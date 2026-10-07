import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import { Empty } from "../../components/shared";
import { Modal, PageHead, StatusBadge, Tilt } from "../../components/ui";
import { useIsland } from "../../context/IslandContext";
import D from "../../data";
import { fmtDate, useDb, useOrgs, useTable, useUsers } from "../../lib/useData";

export const PLANS = D.plans.map((p) => p.name);
export const PLATFORMS = ["Shopify", "WooCommerce", "VTEX", "Magento", "Other"];

export default function Clients() {
  const db = useDb(); const island = useIsland(); const nav = useNavigate();
  const orgs = useOrgs().rows;
  const users = useUsers().rows;
  const files = useTable("files", null).rows;
  const requests = useTable("requests", null).rows;
  const [q, setQ] = useState("");
  const [add, setAdd] = useState(null);

  const create = async () => {
    if (!add.name.trim()) return island.notify("Enter the client's company name", { icon: "x" });
    try {
      const o = await db.createOrg({ name: add.name.trim(), plan: add.plan, platform: add.platform, website: add.website.trim(), status: "Onboarding" });
      island.notify(`${o.name} added`, { icon: "users" }); setAdd(null); nav(`/admin/clients/${o.id}`);
    } catch (e) { island.notify("Could not add client: " + e.message, { icon: "x" }); }
  };

  const list = orgs.filter((o) => o.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHead title="Clients" sub="Every InboundPlus client workspace. Click a client to manage everything they see.">
        <input className="input" style={{ maxWidth: 240 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter clients…" />
        <button className="btn btn-primary" onClick={() => setAdd({ name: "", plan: PLANS[1], platform: "Shopify", website: "" })}><Icon name="plus" size={16} /> Add client</button>
      </PageHead>
      {list.length ? (
        <div className="grid g-3">
          {list.map((o) => {
            const members = users.filter((u) => u.org_id === o.id);
            return (
              <Tilt key={o.id} className="panel" style={{ cursor: "pointer" }} onClick={() => nav(`/admin/clients/${o.id}`)}>
                <div className="flex between"><div className="avatar">{o.name.slice(0, 2).toUpperCase()}</div><StatusBadge s={o.status} /></div>
                <h3 style={{ margin: "12px 0 2px" }}>{o.name}</h3>
                <small className="muted">{o.plan} · {o.platform || "—"}{o.website ? ` · ${o.website}` : ""}</small>
                <div className="agent-stats" style={{ marginTop: 14 }}>
                  <div><b>{members.length}</b>users</div>
                  <div><b>{files.filter((f) => f.org_id === o.id).length}</b>files</div>
                  <div><b>{requests.filter((r) => r.org_id === o.id && r.status !== "Done").length}</b>open requests</div>
                </div>
                <small className="muted" style={{ display: "block", marginTop: 10 }}>Client since {fmtDate(o.created_at)}</small>
              </Tilt>
            );
          })}
        </div>
      ) : <div className="panel"><Empty icon="users" title="No clients found" text="Clients are created automatically when they register, or add one here." /></div>}

      <Modal open={!!add} onClose={() => setAdd(null)}>
        {add && <>
          <h2>Add client</h2>
          <p className="muted">Creates a client workspace. Their team can then register and you can link them under Users & access.</p><br />
          <label className="field"><span>Company name</span><input className="input" value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} autoFocus /></label>
          <div className="row-2">
            <label className="field"><span>Plan</span><select className="input" value={add.plan} onChange={(e) => setAdd({ ...add, plan: e.target.value })}>{PLANS.map((p) => <option key={p}>{p}</option>)}</select></label>
            <label className="field"><span>Store platform</span><select className="input" value={add.platform} onChange={(e) => setAdd({ ...add, platform: e.target.value })}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select></label>
          </div>
          <label className="field"><span>Website</span><input className="input" value={add.website} onChange={(e) => setAdd({ ...add, website: e.target.value })} placeholder="store.com" /></label>
          <div className="modal-foot"><button className="btn btn-ghost" onClick={() => setAdd(null)}>Cancel</button><button className="btn btn-primary" onClick={create}>Add client</button></div>
        </>}
      </Modal>
    </>
  );
}
