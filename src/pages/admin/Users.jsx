import { useState } from "react";
import { Empty } from "../../components/shared";
import { PageHead, Panel, Segmented } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useIsland } from "../../context/IslandContext";
import { fmtDate, useDb, useOrgs, useUsers } from "../../lib/useData";

export default function Users() {
  const db = useDb(); const island = useIsland(); const { session } = useAuth();
  const users = useUsers().rows;
  const orgs = useOrgs().rows;
  const [filter, setFilter] = useState("All");

  const change = async (u, patch) => {
    if (u.id === session.id && patch.role === "client") return island.notify("You can't remove your own admin access", { icon: "x" });
    try {
      await db.updateUser(u.id, patch);
      island.notify(`${u.full_name || u.email} updated`, { icon: "users" });
    } catch (e) { island.notify("Could not update: " + e.message, { icon: "x" }); }
  };
  const list = users.filter((u) => filter === "All" || (filter === "Admins" ? u.role === "admin" : filter === "Unassigned" ? u.role !== "admin" && !u.org_id : u.role !== "admin"));

  return (
    <>
      <PageHead title="Users & access" sub="Who can log in, their role, and which client workspace they belong to.">
        <Segmented value={filter} onChange={setFilter} options={["All", "Clients", "Admins", "Unassigned"]} />
      </PageHead>
      <Panel>
        {list.length ? (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr>{["User", "Role", "Client workspace", "Joined"].map((h) => <th key={h} className="nosort">{h}</th>)}</tr></thead>
            <tbody>{list.map((u) => (
              <tr key={u.id}>
                <td><b>{u.full_name || "—"}</b><small className="muted" style={{ display: "block" }}>{u.email}</small></td>
                <td><select className="input" style={{ padding: "6px 10px", minWidth: 110 }} value={u.role} onChange={(e) => change(u, { role: e.target.value, org_id: e.target.value === "admin" ? null : u.org_id })}>
                  <option value="client">Client</option><option value="admin">Admin</option></select></td>
                <td>{u.role === "admin" ? <span className="muted">All clients</span> : (
                  <select className="input" style={{ padding: "6px 10px", minWidth: 200 }} value={u.org_id || ""} onChange={(e) => change(u, { org_id: e.target.value || null })}>
                    <option value="">— Not assigned —</option>{orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>)}</td>
                <td>{fmtDate(u.created_at)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <Empty icon="users" title="No users" />}
        <p className="demo-note" style={{ marginTop: 14 }}>New sign-ups automatically get their own client workspace. To give a teammate access to an existing client, ask them to register, then pick the client here. Admins see every client.</p>
      </Panel>
    </>
  );
}
