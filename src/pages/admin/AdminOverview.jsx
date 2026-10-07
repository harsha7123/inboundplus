import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import { Empty } from "../../components/shared";
import { Kpi, PageHead, Panel, StatusBadge } from "../../components/ui";
import { ago, useOrgs, useTable } from "../../lib/useData";
import { useOrgName } from "./sections";

export default function AdminOverview() {
  const nav = useNavigate();
  const orgs = useOrgs().rows;
  const files = useTable("files", null).rows;
  const requests = useTable("requests", null).rows;
  const messages = useTable("messages", null).rows;
  const deployments = useTable("deployments", null).rows;
  const projects = useTable("projects", null).rows;
  const orgName = useOrgName();

  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString();
  const pending = files.filter((f) => f.status === "Needs approval");
  const open = requests.filter((r) => r.status !== "Done");
  const stat = (id) => ({
    files: files.filter((f) => f.org_id === id).length,
    pending: pending.filter((f) => f.org_id === id).length,
    requests: open.filter((r) => r.org_id === id).length,
    projects: projects.filter((p) => p.org_id === id).length,
  });
  const activity = [
    ...files.map((f) => ({ at: f.created_at, org: f.org_id, icon: "file", text: `${f.uploaded_by} uploaded ${f.name}` })),
    ...requests.map((r) => ({ at: r.created_at, org: r.org_id, icon: "send", text: `New request: ${r.title}` })),
    ...messages.map((m) => ({ at: m.created_at, org: m.org_id, icon: "chat", text: `${m.sender_name}: ${m.body}` })),
    ...deployments.map((d) => ({ at: d.created_at, org: d.org_id, icon: "rocket", text: `${d.app} ${d.version || ""} deployed to ${d.env}` })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 10);

  return (
    <>
      <PageHead title="Admin overview" sub="Everything happening across InboundPlus clients.">
        <button className="btn btn-ghost" onClick={() => nav("/admin/clients")}><Icon name="users" size={16} /> Clients</button>
        <button className="btn btn-primary" onClick={() => nav("/admin/upload")}><Icon name="upload" size={16} /> Upload for a client</button>
      </PageHead>
      <div className="kpis">
        <Kpi label="Active clients" value={orgs.length} icon="users" />
        <Kpi label="Open requests" value={open.length} icon="send" />
        <Kpi label="Files awaiting approval" value={pending.length} icon="file" />
        <Kpi label="Releases (30 days)" value={deployments.filter((d) => d.created_at > monthAgo).length} icon="rocket" />
      </div>
      <div className="grid g-21">
        <Panel title="Clients" actions={<button className="btn btn-sm btn-ghost" onClick={() => nav("/admin/clients")}>Manage</button>}>
          {orgs.length ? (
            <div className="tbl-wrap"><table className="tbl">
              <thead><tr>{["Client", "Plan", "Status", "Files", "Pending approval", "Open requests"].map((h, i) => <th key={h} className={`nosort ${i > 2 ? "num" : ""}`}>{h}</th>)}</tr></thead>
              <tbody>{orgs.map((o) => { const s = stat(o.id); return (
                <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => nav(`/admin/clients/${o.id}`)}>
                  <td><b>{o.name}</b><small className="muted" style={{ display: "block" }}>{o.platform || "—"}</small></td>
                  <td>{o.plan}</td><td><StatusBadge s={o.status} /></td>
                  <td className="num">{s.files}</td><td className="num">{s.pending ? <span className="badge amber">{s.pending}</span> : 0}</td><td className="num">{s.requests ? <span className="badge blue">{s.requests}</span> : 0}</td>
                </tr>); })}</tbody>
            </table></div>
          ) : <Empty icon="users" title="No clients yet" text="Clients appear here when they register, or add one manually." />}
        </Panel>
        <Panel title="Recent activity">
          {activity.length ? <div className="list">{activity.map((a, i) => (
            <div className="list-item" key={i} style={{ cursor: "pointer" }} onClick={() => nav(`/admin/clients/${a.org}`)}>
              <Icon name={a.icon} size={18} style={{ color: "var(--blue)" }} />
              <div className="grow"><span style={{ fontSize: 14, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.text}</span><small>{orgName(a.org)} · {ago(a.at)}</small></div>
            </div>
          ))}</div> : <Empty icon="zap" title="No activity yet" />}
        </Panel>
      </div>
    </>
  );
}
