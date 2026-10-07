import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Icon from "../../components/Icon";
import { Empty } from "../../components/shared";
import { Kpi, Modal, PageHead, Panel, StatusBadge } from "../../components/ui";
import { useIsland } from "../../context/IslandContext";
import { fmtDate, useDb, useOrgs, useTable, useUsers } from "../../lib/useData";
import { PLANS, PLATFORMS } from "./Clients";
import { ChatSection, DeploySection, FilesSection, ProjectsSection, ReportsSection, RequestsSection } from "./sections";

const TABS = [
  ["overview", "Overview", "home"], ["files", "Files", "file"], ["reports", "Reports", "report"], ["deployments", "Deployments", "rocket"],
  ["projects", "Projects", "folder"], ["requests", "Requests", "send"], ["messages", "Messages", "chat"],
];

export default function ClientDetail() {
  const { id } = useParams();
  const db = useDb(); const island = useIsland();
  const orgs = useOrgs();
  const org = orgs.rows.find((o) => o.id === id);
  const users = useUsers().rows.filter((u) => u.org_id === id);
  const files = useTable("files", id).rows, requests = useTable("requests", id).rows, projects = useTable("projects", id).rows, reports = useTable("reports", id).rows;
  const [tab, setTab] = useState("overview");
  const [edit, setEdit] = useState(null);
  useEffect(() => { setTab("overview"); }, [id]);

  if (orgs.loading) return <div className="empty">Loading…</div>;
  if (!org) return <div className="panel"><Empty icon="users" title="Client not found"><Link className="btn btn-ghost" to="/admin/clients">Back to clients</Link></Empty></div>;

  const save = async () => {
    try { await db.updateOrg(id, { name: edit.name, plan: edit.plan, platform: edit.platform, website: edit.website, status: edit.status }); island.notify("Client updated", { icon: "users" }); setEdit(null); }
    catch (e) { island.notify("Could not save: " + e.message, { icon: "x" }); }
  };
  const pending = files.filter((f) => f.status === "Needs approval").length;
  const openReq = requests.filter((r) => r.status !== "Done").length;

  return (
    <>
      <PageHead title={org.name} sub={`${org.plan} · ${org.platform || "—"}${org.website ? ` · ${org.website}` : ""} · client since ${fmtDate(org.created_at)}`}>
        <StatusBadge s={org.status} />
        <button className="btn btn-ghost" onClick={() => setEdit({ ...org })}><Icon name="gear" size={16} /> Edit client</button>
      </PageHead>

      <div className="tabs-bar">
        {TABS.map(([k, label, icon]) => (
          <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>
            <Icon name={icon} size={16} />{label}
            {k === "files" && pending > 0 && <span className="count">{pending}</span>}
            {k === "requests" && openReq > 0 && <span className="count">{openReq}</span>}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="kpis">
            <Kpi label="Users" value={users.length} icon="users" />
            <Kpi label="Files (pending approval)" value={`${files.length} (${pending})`} icon="file" />
            <Kpi label="Reports published" value={reports.length} icon="report" />
            <Kpi label="Open requests" value={openReq} icon="send" />
          </div>
          <div className="grid g-2">
            <Panel title="Client users" sub="People who can log in to this client's portal">
              {users.length ? <div className="list">{users.map((u) => (
                <div className="list-item" key={u.id}><div className="avatar sm">{(u.full_name || u.email).slice(0, 2).toUpperCase()}</div>
                  <div className="grow"><b style={{ fontSize: 14 }}>{u.full_name || "—"}</b><small>{u.email}</small></div><span className="badge gray">{u.role}</span></div>
              ))}</div> : <Empty icon="users" title="No users yet" text="Ask the client to register; then link them under Users & access." />}
            </Panel>
            <Panel title="Projects" actions={<button className="btn btn-sm btn-ghost" onClick={() => setTab("projects")}>Manage</button>}>
              {projects.length ? <div className="list">{projects.map((p) => (
                <div className="list-item" key={p.id}><div className="grow"><b style={{ fontSize: 14 }}>{p.name}</b><small>{p.type}</small></div><b>{p.progress}%</b><StatusBadge s={p.status} /></div>
              ))}</div> : <Empty icon="folder" title="No projects yet" />}
            </Panel>
          </div>
        </>
      )}
      {tab === "files" && <FilesSection orgId={id} />}
      {tab === "reports" && <ReportsSection orgId={id} />}
      {tab === "deployments" && <DeploySection orgId={id} />}
      {tab === "projects" && <ProjectsSection orgId={id} />}
      {tab === "requests" && <RequestsSection orgId={id} />}
      {tab === "messages" && <ChatSection orgId={id} orgLabel={org.name} />}

      <Modal open={!!edit} onClose={() => setEdit(null)}>
        {edit && <>
          <h2>Edit client</h2><br />
          <label className="field"><span>Company name</span><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
          <div className="row-2">
            <label className="field"><span>Plan</span><select className="input" value={edit.plan || ""} onChange={(e) => setEdit({ ...edit, plan: e.target.value })}>{PLANS.map((p) => <option key={p}>{p}</option>)}</select></label>
            <label className="field"><span>Status</span><select className="input" value={edit.status || "Active"} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>{["Active", "Onboarding", "Paused"].map((p) => <option key={p}>{p}</option>)}</select></label>
          </div>
          <div className="row-2">
            <label className="field"><span>Store platform</span><select className="input" value={edit.platform || "Shopify"} onChange={(e) => setEdit({ ...edit, platform: e.target.value })}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select></label>
            <label className="field"><span>Website</span><input className="input" value={edit.website || ""} onChange={(e) => setEdit({ ...edit, website: e.target.value })} /></label>
          </div>
          <div className="modal-foot"><button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></div>
        </>}
      </Modal>
    </>
  );
}
