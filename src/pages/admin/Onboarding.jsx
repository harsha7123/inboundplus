import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import { PageHead } from "../../components/ui";
import { useIsland } from "../../context/IslandContext";
import { STAGES } from "../../data/agency";
import { useAgency } from "../../lib/useAgency";
import { ago, useDb } from "../../lib/useData";
import { money } from "../../lib/utils";
import { HealthBadge, NewClientModal } from "./agencySections";

/* Kanban board of the client lifecycle. Drag a client to move it to the next stage. */
export default function Onboarding() {
  const db = useDb(); const island = useIsland(); const nav = useNavigate();
  const { clients } = useAgency();
  const [over, setOver] = useState(null), [drag, setDrag] = useState(null), [adding, setAdding] = useState(false);

  const move = async (stage) => {
    setOver(null);
    const c = clients.find((x) => x.id === drag);
    if (!c || (c.stage || "Signed") === stage) return;
    await db.updateOrg(c.id, { stage, status: stage === "Live" ? "Active" : "Onboarding" });
    island.notify(`${c.name} → ${stage}`, { icon: "folder" });
  };

  return (
    <>
      <PageHead title="Client onboarding" sub="From signed contract to live client. Drag a card to change its stage; open it to work through the checklist.">
        <button className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> New client</button>
      </PageHead>
      <div className="stage-board">
        {STAGES.map((s) => {
          const list = clients.filter((c) => (c.stage || "Signed") === s);
          return (
            <div key={s} className={`kcol ${over === s ? "over" : ""}`} onDragOver={(e) => { e.preventDefault(); setOver(s); }} onDragLeave={() => setOver(null)} onDrop={(e) => { e.preventDefault(); move(s); }}>
              <h4>{s}<span className="badge gray">{list.length}</span></h4>
              {list.map((c) => (
                <div key={c.id} className={`kcard ${drag === c.id ? "dragging" : ""}`} draggable onDragStart={() => setDrag(c.id)} onDragEnd={() => setDrag(null)}
                  onClick={() => nav(`/admin/clients/${c.id}`)} style={{ cursor: "pointer" }}>
                  <b>{c.name}</b>
                  <small className="muted" style={{ display: "block", margin: "2px 0 8px" }}>{c.plan}{c.mrr ? ` · ${money(c.mrr)}/mo` : ""}</small>
                  {c.onboarding != null && <div className="flex" style={{ gap: 6 }}><div style={{ flex: 1 }}><div className="progress"><div style={{ width: `${c.onboarding}%` }} /></div></div><small>{c.onboarding}%</small></div>}
                  <div className="k-meta"><span>{c.manager || "No manager"}</span><span>{ago(c.created_at)}</span></div>
                  <div style={{ marginTop: 8 }}><HealthBadge health={c.health} /></div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <NewClientModal open={adding} onClose={() => setAdding(false)} />
    </>
  );
}
