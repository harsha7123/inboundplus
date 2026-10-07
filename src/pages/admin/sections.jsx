/* Admin building blocks. Each section manages one kind of client data.
   orgId = a client id (manage that client) or null (all clients, read/manage across the agency). */
import { useEffect, useRef, useState } from "react";
import Icon from "../../components/Icon";
import { ChatThread, DeployTimeline, DownloadButton, Empty, FileGrid, REQUEST_STATUSES, Uploader } from "../../components/shared";
import { Modal, Panel, Progress, Segmented, StatusBadge } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useIsland } from "../../context/IslandContext";
import { ago, fmtDate, useDb, useOrgs, useTable } from "../../lib/useData";
import { store } from "../../lib/utils";

/** Map org id → name, for "all clients" views. */
export function useOrgName() {
  const orgs = useOrgs().rows;
  return (id) => orgs.find((o) => o.id === id)?.name || "—";
}

const confirmDelete = (what) => window.confirm(`Delete ${what}? This cannot be undone.`);

/* ---------------- Files ---------------- */
export function FilesSection({ orgId }) {
  const db = useDb(); const island = useIsland(); const { session } = useAuth(); const orgName = useOrgName();
  const { rows } = useTable("files", orgId);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("All");

  const upload = async (files) => {
    setBusy(true);
    const job = island.notify(`Uploading ${files.length} file${files.length > 1 ? "s" : ""}…`, { icon: "upload", progress: true, persist: true });
    try {
      for (let i = 0; i < files.length; i++) {
        await db.upload("files", orgId, files[i], { status: needsApproval ? "Needs approval" : "Shared", uploaded_by: `${session.name} (InboundPlus)` });
        job.update(null, ((i + 1) / files.length) * 100);
      }
      job.done(`Shared with ${orgName(orgId)}`);
    } catch (e) { job.done("Upload failed: " + e.message); }
    setBusy(false);
  };
  const del = async (f) => { if (confirmDelete(f.name)) { await db.remove("files", f.id); island.notify("File deleted", { icon: "x" }); } };
  const list = rows.filter((f) => filter === "All" || f.status === filter);

  return (
    <Panel title="Files & approvals" sub={orgId ? "Upload files for this client. Ask for approval when they need to sign off." : "Files across all clients"}
      actions={<Segmented value={filter} onChange={setFilter} options={["All", "Needs approval", "Approved", "Rejected"]} />}>
      {orgId && <>
        <label className="flex" style={{ gap: 8, fontSize: 14, marginBottom: 10 }}><input type="checkbox" checked={needsApproval} onChange={(e) => setNeedsApproval(e.target.checked)} /> Client must approve these files</label>
        <Uploader onFiles={upload} busy={busy} label={`Drop files for ${orgName(orgId)} or click to upload`} />
      </>}
      <FileGrid rows={list} onDelete={del} showOrg={orgId ? null : orgName}
        onApprove={(f) => db.update("files", f.id, { status: "Approved" })} />
    </Panel>
  );
}

/* ---------------- Reports ---------------- */
export function ReportsSection({ orgId }) {
  const db = useDb(); const island = useIsland(); const orgName = useOrgName();
  const { rows } = useTable("reports", orgId);
  const [form, setForm] = useState({ name: "", type: "Monthly", summary: "" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const input = useRef(null);

  const publish = async () => {
    if (!form.name.trim()) return island.notify("Give the report a name", { icon: "x" });
    if (!file && !form.summary.trim()) return island.notify("Attach a PDF or write a summary", { icon: "x" });
    setBusy(true);
    try {
      const extra = { name: form.name.trim(), type: form.type, summary: form.summary.trim() || null };
      if (file) await db.upload("reports", orgId, file, extra); else await db.insert("reports", { org_id: orgId, ...extra });
      island.notify(`Report published to ${orgName(orgId)}`, { icon: "report" });
      setForm({ name: "", type: "Monthly", summary: "" }); setFile(null);
    } catch (e) { island.notify("Could not publish: " + e.message, { icon: "x" }); }
    setBusy(false);
  };
  const del = async (r) => { if (confirmDelete(r.name)) await db.remove("reports", r.id); };

  return (
    <div className={orgId ? "grid g-12" : ""}>
      {orgId && (
        <Panel title="Publish a report" sub="Clients see it immediately in Reports">
          <label className="field"><span>Report name</span><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="October 2026 Performance Report" /></label>
          <label className="field"><span>Type</span><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{["Monthly", "Quarterly", "Audit", "Research"].map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="field"><span>Summary (shown in the portal)</span><textarea className="input" rows={4} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Key results and next steps…" /></label>
          <div className="field"><span style={{ fontWeight: 500, fontSize: 13, display: "block", marginBottom: 6 }}>Attachment (PDF)</span>
            <button className="btn btn-ghost btn-sm" onClick={() => input.current.click()}><Icon name="upload" size={14} /> {file ? file.name : "Choose file"}</button>
            <input ref={input} type="file" hidden accept=".pdf,.pptx,.xlsx,.docx" onChange={(e) => setFile(e.target.files[0] || null)} />
          </div>
          <button className="btn btn-primary" onClick={publish} disabled={busy}>{busy ? "Publishing…" : "Publish report"}</button>
        </Panel>
      )}
      <Panel title="Published reports" sub={orgId ? undefined : "All clients"}>
        {rows.length ? <div className="list">{rows.map((r) => (
          <div className="list-item" key={r.id}>
            <div className="file-ico pdf">PDF</div>
            <div className="grow"><b style={{ fontSize: 14 }}>{r.name}</b><small>{orgId ? "" : `${orgName(r.org_id)} · `}{r.type} · {fmtDate(r.created_at)}{r.path ? " · file attached" : ""}</small></div>
            {r.path && <DownloadButton row={r} />}
            <button className="btn btn-sm btn-ghost" title="Delete" onClick={() => del(r)}><Icon name="x" size={14} /></button>
          </div>
        ))}</div> : <Empty icon="report" title="No reports yet" />}
      </Panel>
    </div>
  );
}

/* ---------------- Deployments ---------------- */
const STEPS = (env) => ["Build", "Unit tests", "Security scan", `Deploy to ${env}`, "Health check"];
export function DeploySection({ orgId }) {
  const db = useDb(); const island = useIsland(); const { session } = useAuth(); const orgName = useOrgName();
  const { rows } = useTable("deployments", orgId);
  const [form, setForm] = useState({ app: "Storefront", env: "Production", version: "", notes: "" });
  const [run, setRun] = useState(null);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  const save = async (status) => db.insert("deployments", { org_id: orgId, app: form.app.trim() || "Storefront", env: form.env, version: form.version.trim() || "v1.0.0", notes: form.notes.trim(), status, by_name: session.name });
  const deploy = () => {
    const steps = STEPS(form.env), app = form.app || "Storefront";
    const job = island.notify(`Deploying ${app} for ${orgName(orgId)}…`, { icon: "rocket", progress: true, persist: true });
    const tick = async (i) => {
      setRun({ step: i, steps });
      if (i === steps.length) {
        try { await save("success"); job.done(`${app} is live on ${form.env}`); setForm({ ...form, version: "", notes: "" }); }
        catch (e) { job.done("Could not save: " + e.message); }
        return;
      }
      job.update(`${steps[i]} · ${app}`, ((i + 1) / steps.length) * 100);
      timer.current = setTimeout(() => tick(i + 1), 800);
    };
    tick(0);
  };
  const running = run && run.step < run.steps.length;

  return (
    <div className={orgId ? "grid g-12" : ""}>
      {orgId && (
        <Panel title="New release" sub="Run the pipeline or just log a release">
          <label className="field"><span>Application</span><input className="input" value={form.app} onChange={(e) => setForm({ ...form, app: e.target.value })} /></label>
          <div className="row-2">
            <label className="field"><span>Environment</span><select className="input" value={form.env} onChange={(e) => setForm({ ...form, env: e.target.value })}><option>Production</option><option>Staging</option></select></label>
            <label className="field"><span>Version</span><input className="input" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="v2.9.0" /></label>
          </div>
          <label className="field"><span>Release notes (client can see)</span><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="What changed?" /></label>
          <div className="flex wrap-gap">
            <button className="btn btn-primary" onClick={deploy} disabled={running}><Icon name="rocket" size={16} /> Deploy with pipeline</button>
            <button className="btn btn-ghost" disabled={running} onClick={async () => { await save("success"); island.notify("Release logged", { icon: "rocket" }); }}>Log only</button>
          </div>
          {run && (
            <div style={{ marginTop: 14 }}>
              {run.steps.map((s, i) => (
                <div className="list-item" key={s}>
                  <span className={`badge ${i < run.step ? "green" : i === run.step ? "amber" : "gray"}`} style={{ width: 72, justifyContent: "center" }}>{i < run.step ? "Passed" : i === run.step ? "Running" : "Queued"}</span>
                  <span className="grow" style={{ fontSize: 14 }}>{s}</span>
                </div>
              ))}
              <div style={{ marginTop: 10 }}><Progress value={(Math.min(run.step + 1, run.steps.length) / run.steps.length) * 100} /></div>
            </div>
          )}
        </Panel>
      )}
      <Panel title="Release history" sub={orgId ? undefined : "All clients"}>
        <DeployTimeline rows={rows} showOrg={orgId ? null : orgName} />
      </Panel>
    </div>
  );
}

/* ---------------- Projects ---------------- */
export function ProjectsSection({ orgId }) {
  const db = useDb(); const island = useIsland();
  const { rows } = useTable("projects", orgId);
  const [edit, setEdit] = useState(null);
  const blank = { name: "", type: "E-commerce", progress: 0, status: "On track", due: "" };

  const save = async () => {
    if (!edit.name.trim()) return;
    const { id, ...data } = edit;
    try {
      if (id) await db.update("projects", id, { name: data.name, type: data.type, progress: +data.progress, status: data.status, due: data.due });
      else await db.insert("projects", { org_id: orgId, ...data, progress: +data.progress });
      island.notify(id ? "Project updated" : "Project added", { icon: "folder" }); setEdit(null);
    } catch (e) { island.notify("Could not save: " + e.message, { icon: "x" }); }
  };

  return (
    <Panel title="Projects" sub="Clients see progress in their portal" actions={orgId && <button className="btn btn-sm btn-primary" onClick={() => setEdit(blank)}><Icon name="plus" size={14} /> Add project</button>}>
      {rows.length ? <div className="list">{rows.map((p) => (
        <div className="list-item" key={p.id}>
          <div className="grow"><b style={{ fontSize: 14 }}>{p.name}</b><small>{p.type}{p.due ? ` · due ${p.due}` : ""}</small><div style={{ marginTop: 6, maxWidth: 360 }}><Progress value={p.progress} tone={p.status === "At risk" ? "amber" : p.status === "Done" ? "green" : ""} /></div></div>
          <b>{p.progress}%</b><StatusBadge s={p.status} />
          <button className="btn btn-sm btn-ghost" onClick={() => setEdit(p)}>Edit</button>
          <button className="btn btn-sm btn-ghost" title="Delete" onClick={async () => { if (confirmDelete(p.name)) await db.remove("projects", p.id); }}><Icon name="x" size={14} /></button>
        </div>
      ))}</div> : <Empty icon="folder" title="No projects yet" />}
      <Modal open={!!edit} onClose={() => setEdit(null)}>
        {edit && <>
          <h2>{edit.id ? "Edit project" : "Add project"}</h2><br />
          <label className="field"><span>Name</span><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} autoFocus /></label>
          <div className="row-2">
            <label className="field"><span>Type</span><select className="input" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value })}>{["E-commerce", "AI Agent", "SEO", "Paid ads", "Integration", "Strategy"].map((t) => <option key={t}>{t}</option>)}</select></label>
            <label className="field"><span>Status</span><select className="input" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>{["On track", "At risk", "Done"].map((t) => <option key={t}>{t}</option>)}</select></label>
          </div>
          <label className="field"><span>Progress: {edit.progress}%</span><input type="range" min="0" max="100" step="5" value={edit.progress} onChange={(e) => setEdit({ ...edit, progress: +e.target.value })} style={{ width: "100%", accentColor: "var(--blue)" }} /></label>
          <label className="field"><span>Due date</span><input className="input" value={edit.due || ""} onChange={(e) => setEdit({ ...edit, due: e.target.value })} placeholder="Nov 30, 2026" /></label>
          <div className="modal-foot"><button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></div>
        </>}
      </Modal>
    </Panel>
  );
}

/* ---------------- Requests ---------------- */
export function RequestsSection({ orgId, title = "Client requests" }) {
  const db = useDb(); const island = useIsland(); const orgName = useOrgName();
  const { rows } = useTable("requests", orgId);
  const [filter, setFilter] = useState("Open");
  const list = rows.filter((r) => filter === "All" || (filter === "Open" ? r.status !== "Done" : r.status === filter));
  const setStatus = async (r, status) => { await db.update("requests", r.id, { status }); island.notify(`“${r.title}” → ${status}`, { icon: "send" }); };
  return (
    <Panel title={title} actions={<Segmented value={filter} onChange={setFilter} options={["Open", "New", "Done", "All"]} />}>
      {list.length ? (
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr>{[!orgId && "Client", "Request", "Type", "From", "Received", "Status"].filter(Boolean).map((h) => <th key={h} className="nosort">{h}</th>)}</tr></thead>
          <tbody>{list.map((r) => (
            <tr key={r.id}>
              {!orgId && <td>{orgName(r.org_id)}</td>}
              <td><b>{r.title}</b>{r.notes && <small className="muted" style={{ display: "block" }}>{r.notes}</small>}</td>
              <td>{r.type}</td><td>{r.created_by}</td><td>{ago(r.created_at)}</td>
              <td><select className="input" style={{ padding: "6px 10px", minWidth: 130 }} value={r.status} onChange={(e) => setStatus(r, e.target.value)}>{REQUEST_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td>
            </tr>
          ))}</tbody>
        </table></div>
      ) : <Empty icon="send" title="Nothing here" text="No requests match this filter." />}
    </Panel>
  );
}

/* ---------------- Messages ---------------- */
export function ChatSection({ orgId, orgLabel }) {
  const db = useDb(); const island = useIsland(); const { session } = useAuth();
  const { rows } = useTable("messages", orgId);
  useEffect(() => { store.set("admin_seen_msgs", new Date().toISOString()); }, [rows.length]);
  const send = async (body) => {
    try { await db.insert("messages", { org_id: orgId, sender_role: "agency", sender_name: session.name, body }); }
    catch (e) { island.notify("Message not sent: " + e.message, { icon: "x" }); }
  };
  return (
    <Panel title={orgLabel ? `Conversation with ${orgLabel}` : "Conversation"} sub="Messages appear in the client's portal">
      <ChatThread messages={rows} me="agency" onSend={send} placeholder="Reply as InboundPlus…" />
    </Panel>
  );
}
