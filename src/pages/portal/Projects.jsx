import { useState } from "react";
import Icon from "../../components/Icon";
import RequestModal from "../../components/RequestModal";
import { PageHead, Panel, Progress, StatusBadge, Tilt } from "../../components/ui";
import { useIsland } from "../../context/IslandContext";
import { usePortal } from "../../context/PortalContext";
import D from "../../data";

const COLS = ["Waiting on you", "To do", "In progress", "Done"];

export default function Projects() {
  const { state, update } = usePortal();
  const island = useIsland();
  const [open, setOpen] = useState(false);
  const [over, setOver] = useState(null);
  const [dragging, setDragging] = useState(null);

  const drop = (col) => {
    setOver(null);
    const t = state.tasks.find((x) => x.id === dragging);
    if (!t || t.col === col) return;
    update("tasks", (ts) => ts.map((x) => (x.id === t.id ? { ...x, col } : x)));
    island.notify(`Moved “${t.title}” to ${col}`, { icon: "folder" });
  };

  return (
    <>
      <PageHead title="Projects" sub="Everything InboundPlus is building for you.">
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Icon name="plus" size={16} /> New request</button>
      </PageHead>

      <div className="grid g-2">
        {D.projects.map((p) => (
          <Tilt key={p.id} className="panel">
            <div className="flex between"><span className="badge blue">{p.type}</span><StatusBadge s={p.status} /></div>
            <h3 style={{ margin: "12px 0 4px" }}>{p.name}</h3><small className="muted">Due {p.due}</small>
            <div className="flex" style={{ margin: "14px 0" }}><div style={{ flex: 1 }}><Progress value={p.progress} tone={p.status === "At risk" ? "amber" : ""} /></div><b>{p.progress}%</b></div>
            <div className="flex wrap-gap" style={{ gap: 6 }}>{p.milestones.map((m) => <span key={m} className={`badge ${m.includes("✓") ? "green" : "gray"}`}>{m}</span>)}</div>
          </Tilt>
        ))}
      </div>

      <Panel title="Task board" sub="Drag cards between columns · items in “Waiting on you” need your action">
        <div className="kanban">
          {COLS.map((c) => {
            const tasks = state.tasks.filter((t) => t.col === c);
            return (
              <div key={c} className={`kcol ${over === c ? "over" : ""}`} onDragOver={(e) => { e.preventDefault(); setOver(c); }} onDragLeave={() => setOver(null)} onDrop={(e) => { e.preventDefault(); drop(c); }}>
                <h4>{c}<span className="badge gray">{tasks.length}</span></h4>
                {tasks.map((t) => (
                  <div key={t.id} className={`kcard ${dragging === t.id ? "dragging" : ""}`} draggable onDragStart={() => setDragging(t.id)} onDragEnd={() => setDragging(null)}>
                    <b>{t.title}</b>
                    <div className="k-meta"><span>{t.owner}</span><span><Icon name="calendar" size={12} style={{ verticalAlign: -2 }} /> {t.due}</span></div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Panel>

      {state.requests.length > 0 && (
        <Panel title="Your requests" style={{ marginTop: 20 }}>
          <div className="list">{state.requests.map((r, i) => (
            <div className="list-item" key={i}><Icon name="plus" size={20} style={{ color: "var(--blue)" }} />
              <div className="grow"><b style={{ fontSize: 14 }}>{r.title}</b><small>{r.detail} · submitted {r.at}</small></div><StatusBadge s="In review" /></div>
          ))}</div>
        </Panel>
      )}
      <RequestModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
