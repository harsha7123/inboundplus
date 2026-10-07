/* Agency-specific admin components: health, onboarding checklist, AI agent deployments, new-client form. */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import { Empty } from "../../components/shared";
import { Modal, Panel, Progress, Segmented, StatusBadge } from "../../components/ui";
import { useIsland } from "../../context/IslandContext";
import D from "../../data";
import { AGENT_CATALOG, AGENT_STATUSES, PLAN_MRR, STAGES, agentByKey } from "../../data/agency";
import { createChecklist, loadSampleData, removeSampleData } from "../../lib/db";
import { isSampleOrg } from "../../data/sampleAgency";
import { HEALTH_TONE } from "../../lib/health";
import { ago, useDb, useOrgs, useTable } from "../../lib/useData";
import { money } from "../../lib/utils";

export const PLANS = D.plans.map((p) => p.name);
export const PLATFORMS = ["Shopify", "WooCommerce", "VTEX", "Magento", "Other"];

export const HealthBadge = ({ health }) => (
  <span className={`badge ${HEALTH_TONE[health.band]}`} title={health.reasons.join("\n") || "No issues"}><span className="dot" />{health.band} · {health.score}</span>
);

export const StagePill = ({ stage }) => {
  const i = STAGES.indexOf(stage);
  return <span className={`badge ${stage === "Live" ? "green" : i >= 3 ? "blue" : "amber"}`}>{stage || "Signed"}</span>;
};

/* ---------------- New client (creates workspace + onboarding checklist) ---------------- */
export function NewClientModal({ open, onClose }) {
  const db = useDb(); const island = useIsland(); const nav = useNavigate();
  const blank = { name: "", plan: PLANS[1], platform: "Shopify", website: "", industry: "", contact_name: "", contact_email: "", manager: "", start_date: new Date().toISOString().slice(0, 10) };
  const [f, setF] = useState(blank);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const create = async () => {
    if (!f.name.trim()) return island.notify("Enter the client's company name", { icon: "x" });
    try {
      const renewal = new Date(f.start_date); renewal.setMonth(renewal.getMonth() + (f.plan === "Commerce Growth Partner" ? 6 : f.plan === "Ecommerce Growth Advisory" ? 4 : 1));
      const o = await db.createOrg({ ...f, name: f.name.trim(), mrr: PLAN_MRR[f.plan] ?? 0, stage: "Signed", status: "Onboarding", renewal_date: renewal.toISOString().slice(0, 10) });
      await createChecklist(db, o.id);
      island.notify(`${o.name} added — onboarding checklist created`, { icon: "users" });
      setF(blank); onClose(); nav(`/admin/clients/${o.id}`);
    } catch (e) { island.notify("Could not add client: " + e.message, { icon: "x" }); }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2>New client</h2>
      <p className="muted">Creates the client workspace, starts them at “Signed” and adds the standard onboarding checklist.</p><br />
      <div className="row-2">
        <label className="field"><span>Company name</span><input className="input" value={f.name} onChange={set("name")} autoFocus /></label>
        <label className="field"><span>Industry</span><input className="input" value={f.industry} onChange={set("industry")} placeholder="Fashion, food, education…" /></label>
      </div>
      <div className="row-2">
        <label className="field"><span>Package</span><select className="input" value={f.plan} onChange={set("plan")}>{PLANS.map((p) => <option key={p}>{p}</option>)}</select></label>
        <label className="field"><span>Store platform</span><select className="input" value={f.platform} onChange={set("platform")}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select></label>
      </div>
      <div className="row-2">
        <label className="field"><span>Main contact</span><input className="input" value={f.contact_name} onChange={set("contact_name")} /></label>
        <label className="field"><span>Contact email</span><input className="input" type="email" value={f.contact_email} onChange={set("contact_email")} /></label>
      </div>
      <div className="row-2">
        <label className="field"><span>Account manager</span><input className="input" value={f.manager} onChange={set("manager")} /></label>
        <label className="field"><span>Start date</span><input className="input" type="date" value={f.start_date} onChange={set("start_date")} /></label>
      </div>
      <label className="field"><span>Website</span><input className="input" value={f.website} onChange={set("website")} placeholder="store.com" /></label>
      <p className="muted" style={{ fontSize: 13 }}>Monthly value: <b>{money(PLAN_MRR[f.plan] ?? 0)}</b>{f.plan === "Ecommerce Growth Blueprint" ? " (USD 2,000 one-time project)" : ""}</p>
      <div className="modal-foot"><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={create}>Create client</button></div>
    </Modal>
  );
}

/* ---------------- Onboarding checklist for one client ---------------- */
export function OnboardingSection({ org }) {
  const db = useDb(); const island = useIsland();
  const { rows, loading } = useTable("onboarding_tasks", org.id);
  const tasks = [...rows].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const done = tasks.filter((t) => t.done).length;
  const pctDone = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const toggle = (t) => db.update("onboarding_tasks", t.id, { done: !t.done });
  const setStage = async (stage) => { await db.updateOrg(org.id, { stage, status: stage === "Live" ? "Active" : "Onboarding" }); island.notify(`${org.name} moved to ${stage}`, { icon: "folder" }); };
  const nextStage = STAGES[Math.min(STAGES.indexOf(org.stage || "Signed") + 1, STAGES.length - 1)];

  return (
    <Panel title="Onboarding" sub={`${done} of ${tasks.length} steps complete`}
      actions={<div className="flex wrap-gap">
        <select className="input" style={{ padding: "6px 10px" }} value={org.stage || "Signed"} onChange={(e) => setStage(e.target.value)}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select>
        {org.stage !== "Live" && <button className="btn btn-sm btn-primary" onClick={() => setStage(nextStage)}>Move to {nextStage} →</button>}
      </div>}>
      <div className="stage-track">{STAGES.map((s, i) => (
        <div key={s} className={`stage-step ${i < STAGES.indexOf(org.stage || "Signed") ? "done" : s === (org.stage || "Signed") ? "current" : ""}`}><span>{i + 1}</span>{s}</div>
      ))}</div>
      <div style={{ margin: "16px 0" }}><Progress value={pctDone} tone={pctDone === 100 ? "green" : ""} /></div>
      {loading ? null : tasks.length ? (
        <div className="grid g-2" style={{ marginBottom: 0 }}>
          {STAGES.slice(1, 5).map((section) => {
            const list = tasks.filter((t) => t.section === section);
            if (!list.length) return null;
            return (
              <div key={section} className="check-group">
                <h4>{section} <small className="muted">{list.filter((t) => t.done).length}/{list.length}</small></h4>
                {list.map((t) => (
                  <label key={t.id} className={`check-item ${t.done ? "done" : ""}`}>
                    <input type="checkbox" checked={!!t.done} onChange={() => toggle(t)} /><span>{t.title}</span>
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <Empty icon="survey" title="No onboarding checklist yet">
          <button className="btn btn-primary" onClick={async () => { await createChecklist(db, org.id); island.notify("Checklist created", { icon: "survey" }); }}>Create standard checklist</button>
        </Empty>
      )}
    </Panel>
  );
}

/* ---------------- AI agent deployments (one client or all) ---------------- */
export function AgentsSection({ orgId, title = "AI agents", deployRequest }) {
  const db = useDb(); const island = useIsland();
  const orgs = useOrgs().rows;
  const { rows } = useTable("agent_deployments", orgId);
  const [add, setAdd] = useState(null);
  const orgName = (id) => orgs.find((o) => o.id === id)?.name || "—";

  const open = (agentKey) => setAdd({ org_id: orgId || orgs[0]?.id || "", agent_key: agentKey || AGENT_CATALOG[0].key, status: "Setup", channel: agentByKey(agentKey || AGENT_CATALOG[0].key).channel, notes: "" });
  // a parent (e.g. the catalogue) can ask this section to open the deploy dialog for a given agent
  useEffect(() => { if (deployRequest) open(deployRequest.key); }, [deployRequest]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = async () => {
    if (!add.org_id) return island.notify("Choose a client", { icon: "x" });
    try {
      await db.insert("agent_deployments", { ...add, conversations: 0 });
      island.notify(`${agentByKey(add.agent_key).name} added for ${orgName(add.org_id)}`, { icon: "bot" }); setAdd(null);
    } catch (e) { island.notify("Could not add agent: " + e.message, { icon: "x" }); }
  };
  const setStatus = async (a, status) => { await db.update("agent_deployments", a.id, { status }); island.notify(`${agentByKey(a.agent_key)?.name} → ${status}`, { icon: "bot" }); };

  return (
    <Panel title={title} sub={orgId ? "Agents InboundPlus runs for this client — visible in their portal" : "Every agent deployment across clients"}
      actions={<button className="btn btn-sm btn-primary" onClick={() => open()}><Icon name="plus" size={14} /> Deploy agent</button>}>
      {rows.length ? (
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr>{["Agent", !orgId && "Client", "Channel", "Conversations", "Added", "Status", ""].filter((x) => x !== false).map((h, i) => <th key={i} className="nosort">{h}</th>)}</tr></thead>
          <tbody>{rows.map((a) => { const cat = agentByKey(a.agent_key); return (
            <tr key={a.id}>
              <td><div className="flex"><span className="agent-ico"><Icon name={cat?.icon || "bot"} size={16} /></span><div><b>{cat?.name || a.agent_key}</b>{a.notes && <small className="muted" style={{ display: "block" }}>{a.notes}</small>}</div></div></td>
              {!orgId && <td>{orgName(a.org_id)}</td>}
              <td>{a.channel}</td><td className="num">{(a.conversations || 0).toLocaleString()}</td><td>{ago(a.created_at)}</td>
              <td><select className="input" style={{ padding: "6px 10px", minWidth: 110 }} value={a.status} onChange={(e) => setStatus(a, e.target.value)}>{AGENT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td>
              <td><button className="btn btn-sm btn-ghost" title="Remove" onClick={async () => { if (window.confirm("Remove this agent?")) await db.remove("agent_deployments", a.id); }}><Icon name="x" size={14} /></button></td>
            </tr>); })}</tbody>
        </table></div>
      ) : <Empty icon="bot" title="No agents deployed yet" text="Deploy an agent from the catalogue to start." />}

      <Modal open={!!add} onClose={() => setAdd(null)}>
        {add && <>
          <h2>Deploy an AI agent</h2>
          <p className="muted">{agentByKey(add.agent_key)?.summary}</p><br />
          {!orgId && <label className="field"><span>Client</span><select className="input" value={add.org_id} onChange={(e) => setAdd({ ...add, org_id: e.target.value })}>{orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>}
          <label className="field"><span>Agent</span><select className="input" value={add.agent_key} onChange={(e) => setAdd({ ...add, agent_key: e.target.value, channel: agentByKey(e.target.value).channel })}>
            {["Client stores", "InboundPlus delivery", "InboundPlus growth"].map((g) => <optgroup key={g} label={g}>{AGENT_CATALOG.filter((a) => a.group === g).map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}</optgroup>)}
          </select></label>
          <div className="row-2">
            <label className="field"><span>Channel</span><input className="input" value={add.channel} onChange={(e) => setAdd({ ...add, channel: e.target.value })} /></label>
            <label className="field"><span>Status</span><select className="input" value={add.status} onChange={(e) => setAdd({ ...add, status: e.target.value })}>{AGENT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
          </div>
          <label className="field"><span>Notes</span><input className="input" value={add.notes} onChange={(e) => setAdd({ ...add, notes: e.target.value })} placeholder="Persona, rules, what's pending…" /></label>
          <div className="modal-foot"><button className="btn btn-ghost" onClick={() => setAdd(null)}>Cancel</button><button className="btn btn-primary" onClick={save}><Icon name="bot" size={16} /> Deploy</button></div>
        </>}
      </Modal>
    </Panel>
  );
}

/* ---------------- Sample data loader ---------------- */
export function SampleDataButton() {
  const db = useDb(); const island = useIsland();
  const orgs = useOrgs().rows;
  const [busy, setBusy] = useState(false);
  const has = orgs.some(isSampleOrg);

  const load = async () => {
    setBusy(true);
    const job = island.notify("Loading sample clients…", { icon: "users", progress: true, persist: true });
    try { const n = await loadSampleData(db, (p) => job.update(null, p * 100)); job.done(`${n} sample clients added`); }
    catch (e) { job.done(e.message.includes("column") ? "Run supabase/002_agency_admin.sql first" : "Could not load: " + e.message); }
    setBusy(false);
  };
  const remove = async () => {
    if (!window.confirm("Remove all sample clients (websites ending in .example) and their data?")) return;
    setBusy(true);
    try { const n = await removeSampleData(db); island.notify(`${n} sample clients removed`, { icon: "x" }); }
    catch (e) { island.notify("Could not remove: " + e.message, { icon: "x" }); }
    setBusy(false);
  };
  return has
    ? <button className="btn btn-ghost" onClick={remove} disabled={busy} title="Sample clients use websites ending in .example"><Icon name="x" size={16} /> Remove sample data</button>
    : <button className="btn btn-ghost" onClick={load} disabled={busy}><Icon name="download" size={16} /> Load sample data</button>;
}

export { StatusBadge, Segmented };
