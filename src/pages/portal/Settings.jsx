import { useState } from "react";
import Icon from "../../components/Icon";
import { Modal, PageHead, Panel, Switch } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useIsland } from "../../context/IslandContext";
import { usePortal } from "../../context/PortalContext";
import { C, initials, validEmail } from "../../lib/utils";

const NOTIFS = [["weekly", "Weekly KPI digest"], ["deploy", "Deployment updates"], ["approvals", "Files needing approval"], ["invoices", "Invoices & billing"]];

export default function Settings() {
  const { session, updateProfile } = useAuth();
  const { state, update } = usePortal();
  const island = useIsland();
  const [name, setName] = useState(session.name), [company, setCompany] = useState(session.company);
  const [invite, setInvite] = useState(false), [inv, setInv] = useState({ n: "", e: "", r: "Viewer" });
  const team = state.team || [{ n: session.name, e: session.email, r: "Owner" }, { n: "Diego Paredes", e: "diego@andesoutdoor.example", r: "Marketing" }];

  const save = async () => {
    try { await updateProfile({ name: name.trim() || session.name, company: company.trim() || session.company }); island.notify("Profile updated", { icon: "users" }); }
    catch (e) { island.notify("Could not save: " + e.message, { icon: "x" }); }
  };
  const toggleInt = (k) => {
    const on = !state.integrations[k];
    update("integrations", (i) => ({ ...i, [k]: on }));
    island.notify(`${k} ${on ? "connected (demo)" : "disconnected"}`, { icon: "plug" });
  };
  const sendInvite = () => {
    if (!inv.n.trim() || !validEmail(inv.e)) return island.notify("Enter a name and valid email", { icon: "x" });
    update("team", [...team, { n: inv.n.trim(), e: inv.e.trim(), r: inv.r }]);
    setInvite(false); setInv({ n: "", e: "", r: "Viewer" });
    island.notify(`Invite recorded for ${inv.n} (demo — no email sent)`, { icon: "send" });
  };

  return (
    <>
      <PageHead title="Settings" sub="Profile, team, notifications and data connections." />
      <div className="grid g-2">
        <Panel title="Profile">
          <label className="field"><span>Name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="field"><span>Company</span><input className="input" value={company} onChange={(e) => setCompany(e.target.value)} /></label>
          <label className="field"><span>Email</span><input className="input" value={session.email} disabled /></label>
          <button className="btn btn-primary" onClick={save}>Save changes</button>
        </Panel>
        <Panel title="Data connections" sub="Powers your dashboards">
          <div className="list">{Object.entries(state.integrations).map(([k, on]) => (
            <div className="list-item" key={k}>
              <Icon name="plug" size={20} style={{ color: on ? C.green : C.gray }} />
              <span className="grow">{k}<small>{on ? "Connected · synced 12 min ago" : "Not connected"}</small></span>
              <button className={`btn btn-sm ${on ? "btn-ghost" : "btn-primary"}`} onClick={() => toggleInt(k)}>{on ? "Disconnect" : "Connect"}</button>
            </div>
          ))}</div>
        </Panel>
        <Panel title="Team members" actions={<button className="btn btn-sm btn-ghost" onClick={() => setInvite(true)}><Icon name="plus" size={14} /> Invite</button>}>
          <div className="list">{team.map((t) => (
            <div className="list-item" key={t.e}><div className="avatar sm">{initials(t.n)}</div><div className="grow"><b style={{ fontSize: 14 }}>{t.n}</b><small>{t.e}</small></div><span className="badge gray">{t.r}</span></div>
          ))}</div>
        </Panel>
        <Panel title="Email notifications">
          <div className="list">{NOTIFS.map(([k, t]) => (
            <div className="list-item" key={k}><span className="grow">{t}</span>
              <Switch checked={state.notifs[k]} onChange={(v) => { update("notifs", (n) => ({ ...n, [k]: v })); island.notify("Preference saved", { icon: "bell" }); }} /></div>
          ))}</div>
        </Panel>
      </div>

      <Modal open={invite} onClose={() => setInvite(false)}>
        <h2>Invite a teammate</h2><br />
        <label className="field"><span>Name</span><input className="input" value={inv.n} onChange={(e) => setInv({ ...inv, n: e.target.value })} /></label>
        <label className="field"><span>Email</span><input className="input" type="email" value={inv.e} onChange={(e) => setInv({ ...inv, e: e.target.value })} /></label>
        <label className="field"><span>Role</span><select className="input" value={inv.r} onChange={(e) => setInv({ ...inv, r: e.target.value })}><option>Viewer</option><option>Editor</option><option>Admin</option></select></label>
        <div className="modal-foot"><button className="btn btn-ghost" onClick={() => setInvite(false)}>Cancel</button><button className="btn btn-primary" onClick={sendInvite}>Send invite</button></div>
      </Modal>
    </>
  );
}
