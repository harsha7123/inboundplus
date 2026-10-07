import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Icon from "../../components/Icon";
import { Empty } from "../../components/shared";
import { Kpi, Modal, PageHead, Panel, StatusBadge } from "../../components/ui";
import { useIsland } from "../../context/IslandContext";
import { STAGES } from "../../data/agency";
import { useAgency } from "../../lib/useAgency";
import { fmtDate, useDb, useUsers } from "../../lib/useData";
import { money } from "../../lib/utils";
import { AgentsSection, HealthBadge, OnboardingSection, PLANS, PLATFORMS, StagePill } from "./agencySections";
import { ChatSection, DeploySection, FilesSection, ProjectsSection, ReportsSection, RequestsSection } from "./sections";

const TABS = [
  ["overview", "Overview", "home"], ["onboarding", "Onboarding", "survey"], ["agents", "AI agents", "bot"], ["files", "Files", "file"],
  ["reports", "Reports", "report"], ["projects", "Projects", "folder"], ["deployments", "Deployments", "rocket"], ["requests", "Requests", "send"], ["messages", "Messages", "chat"],
];

export default function ClientDetail() {
  const { id } = useParams();
  const db = useDb(); const island = useIsland();
  const { clients, loading } = useAgency();
  const c = clients.find((o) => o.id === id);
  const users = useUsers().rows.filter((u) => u.org_id === id);
  const [tab, setTab] = useState("overview");
  const [edit, setEdit] = useState(null);
  useEffect(() => { setTab("overview"); }, [id]);
  useEffect(() => { if (c) document.title = `${c.name} · InboundPlus Admin`; }, [c?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="empty">Loading…</div>;
  if (!c) return <div className="panel"><Empty icon="users" title="Client not found"><Link className="btn btn-ghost" to="/admin/clients">Back to clients</Link></Empty></div>;

  const save = async () => {
    const { name, plan, platform, website, status, stage, manager, mrr, industry, contact_name, contact_email, start_date, renewal_date } = edit;
    try {
      await db.updateOrg(id, { name, plan, platform, website, status, stage, manager, mrr: Number(mrr) || 0, industry, contact_name, contact_email, start_date: start_date || null, renewal_date: renewal_date || null });
      island.notify("Client updated", { icon: "users" }); setEdit(null);
    } catch (e) { island.notify("Could not save: " + e.message, { icon: "x" }); }
  };
  const set = (k) => (e) => setEdit({ ...edit, [k]: e.target.value });

  return (
    <>
      <PageHead title={c.name} sub={`${c.plan} · ${c.industry || c.platform || "—"} · client since ${fmtDate(c.start_date || c.created_at)}`}>
        <StagePill stage={c.stage} /><HealthBadge health={c.health} />
        <button className="btn btn-ghost" onClick={() => setEdit({ ...c })}><Icon name="gear" size={16} /> Edit client</button>
      </PageHead>

      <div className="tabs-bar">
        {TABS.map(([k, label, icon]) => (
          <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>
            <Icon name={icon} size={16} />{label}
            {k === "files" && c.pendingApprovals > 0 && <span className="count">{c.pendingApprovals}</span>}
            {k === "requests" && c.openRequests > 0 && <span className="count">{c.openRequests}</span>}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="kpis">
            <Kpi label="Monthly value" value={c.mrr ? money(c.mrr) : "One-time"} icon="chart" />
            <Kpi label="Onboarding" value={c.onboarding == null ? "—" : `${c.onboarding}%`} icon="survey" />
            <Kpi label="AI agents live" value={`${c.agentsLive} / ${c.agentsTotal}`} icon="bot" />
            <Kpi label="Open requests" value={c.openRequests} icon="send" />
          </div>
          <div className="grid g-3">
            <Panel title="Health" sub={`Score ${c.health.score} / 100`}>
              <HealthBadge health={c.health} />
              {c.health.reasons.length ? <div className="list" style={{ marginTop: 10 }}>{c.health.reasons.map((r) => <div key={r} className="list-item"><Icon name="zap" size={16} style={{ color: "var(--amber)" }} /><span className="grow" style={{ fontSize: 14 }}>{r}</span></div>)}</div>
                : <p className="muted" style={{ marginTop: 10, fontSize: 14 }}>No issues. Keep it up!</p>}
            </Panel>
            <Panel title="Account">
              <div className="list">
                {[["Stage", <StagePill key="s" stage={c.stage} />], ["Status", <StatusBadge key="st" s={c.status} />], ["Account manager", c.manager || "—"], ["Package", c.plan],
                  ["Start date", c.start_date ? fmtDate(c.start_date) : "—"], ["Renewal", c.renewal_date ? fmtDate(c.renewal_date) : "—"], ["Website", c.website || "—"], ["Platform", c.platform || "—"]]
                  .map(([k, v]) => <div className="list-item" key={k}><span className="grow muted" style={{ fontSize: 13 }}>{k}</span><span style={{ fontSize: 14 }}>{v}</span></div>)}
              </div>
            </Panel>
            <Panel title="People">
              {c.contact_name && <div className="list-item"><div className="avatar sm blue">{c.contact_name.slice(0, 2).toUpperCase()}</div><div className="grow"><b style={{ fontSize: 14 }}>{c.contact_name}</b><small>{c.contact_email || "Main contact"}</small></div><span className="badge blue">Main contact</span></div>}
              {users.map((u) => (
                <div className="list-item" key={u.id}><div className="avatar sm">{(u.full_name || u.email).slice(0, 2).toUpperCase()}</div><div className="grow"><b style={{ fontSize: 14 }}>{u.full_name || "—"}</b><small>{u.email}</small></div><span className="badge gray">Portal user</span></div>
              ))}
              {!c.contact_name && !users.length && <Empty icon="users" title="No people yet" text="Add a main contact with “Edit client”." />}
            </Panel>
          </div>
        </>
      )}
      {tab === "onboarding" && <OnboardingSection org={c} />}
      {tab === "agents" && <AgentsSection orgId={id} />}
      {tab === "files" && <FilesSection orgId={id} />}
      {tab === "reports" && <ReportsSection orgId={id} />}
      {tab === "projects" && <ProjectsSection orgId={id} />}
      {tab === "deployments" && <DeploySection orgId={id} />}
      {tab === "requests" && <RequestsSection orgId={id} />}
      {tab === "messages" && <ChatSection orgId={id} orgLabel={c.name} />}

      <Modal open={!!edit} onClose={() => setEdit(null)}>
        {edit && <>
          <h2>Edit client</h2><br />
          <div className="row-2">
            <label className="field"><span>Company name</span><input className="input" value={edit.name} onChange={set("name")} /></label>
            <label className="field"><span>Industry</span><input className="input" value={edit.industry || ""} onChange={set("industry")} /></label>
          </div>
          <div className="row-2">
            <label className="field"><span>Package</span><select className="input" value={edit.plan || ""} onChange={set("plan")}>{PLANS.map((p) => <option key={p}>{p}</option>)}</select></label>
            <label className="field"><span>MRR (USD / month)</span><input className="input" type="number" min="0" value={edit.mrr ?? 0} onChange={set("mrr")} /></label>
          </div>
          <div className="row-2">
            <label className="field"><span>Stage</span><select className="input" value={edit.stage || "Signed"} onChange={set("stage")}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></label>
            <label className="field"><span>Status</span><select className="input" value={edit.status || "Active"} onChange={set("status")}>{["Active", "Onboarding", "Paused"].map((p) => <option key={p}>{p}</option>)}</select></label>
          </div>
          <div className="row-2">
            <label className="field"><span>Account manager</span><input className="input" value={edit.manager || ""} onChange={set("manager")} /></label>
            <label className="field"><span>Store platform</span><select className="input" value={edit.platform || "Shopify"} onChange={set("platform")}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select></label>
          </div>
          <div className="row-2">
            <label className="field"><span>Main contact</span><input className="input" value={edit.contact_name || ""} onChange={set("contact_name")} /></label>
            <label className="field"><span>Contact email</span><input className="input" value={edit.contact_email || ""} onChange={set("contact_email")} /></label>
          </div>
          <div className="row-2">
            <label className="field"><span>Start date</span><input className="input" type="date" value={edit.start_date || ""} onChange={set("start_date")} /></label>
            <label className="field"><span>Renewal date</span><input className="input" type="date" value={edit.renewal_date || ""} onChange={set("renewal_date")} /></label>
          </div>
          <label className="field"><span>Website</span><input className="input" value={edit.website || ""} onChange={set("website")} /></label>
          <div className="modal-foot"><button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></div>
        </>}
      </Modal>
    </>
  );
}
