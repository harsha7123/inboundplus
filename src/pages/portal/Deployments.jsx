import { useEffect, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import Icon from "../../components/Icon";
import { Modal, PageHead, Panel, Progress, Segmented, StatusBadge, Tilt } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useIsland } from "../../context/IslandContext";
import { usePortal } from "../../context/PortalContext";
import D from "../../data";
import { C } from "../../lib/utils";

const STEPS = (env) => ["Build", "Unit tests", "Security scan", `Deploy to ${env}`, "Health check"];
const stacked = { scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: C.grid } } } };

export default function Deployments() {
  const { state, update } = usePortal();
  const { session } = useAuth();
  const island = useIsland();
  const [env, setEnv] = useState("All");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ app: D.apps[0].name, env: "Staging", notes: "" });
  const [run, setRun] = useState(null); // { app, env, ver, step }
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  const start = () => {
    setModal(false);
    const ver = `v${2 + Math.floor(Math.random() * 2)}.${Math.floor(Math.random() * 9)}.${Math.floor(Math.random() * 9)}`;
    const steps = STEPS(form.env), job = island.notify(`Deploying ${form.app} ${ver}…`, { icon: "rocket", progress: true, persist: true });
    const { app, env: target } = form, notes = form.notes.trim() || "Client-requested release";
    const tick = (i) => {
      setRun({ app, env: target, ver, step: i, steps });
      if (i === steps.length) {
        update("deployments", (ds) => [{ id: `d-${1044 + ds.length - 5}`, app, env: target, version: ver, status: "success", by: `${session.name} (request)`, when: "Just now", notes }, ...ds]);
        job.done(`${app} ${ver} is live on ${target}`);
        return;
      }
      job.update(`${steps[i]} · ${app}`, ((i + 1) / steps.length) * 100);
      timer.current = setTimeout(() => tick(i + 1), 900);
    };
    tick(0);
  };

  const list = state.deployments.filter((d) => env === "All" || d.env === env);
  return (
    <>
      <PageHead title="Software & deployments" sub="Live status of your store, AI agents and integrations.">
        <button className="btn btn-primary" onClick={() => setModal(true)} disabled={run && run.step < run.steps.length}><Icon name="rocket" size={16} /> Request deployment</button>
      </PageHead>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
        {D.apps.map((a) => (
          <Tilt key={a.name} className="kpi">
            <div className="k-top"><span>{a.env}</span><StatusBadge s={a.health} /></div>
            <div style={{ fontWeight: 500, fontSize: 16, margin: "10px 0 4px" }}>{a.name}</div>
            <small className="muted">{a.version} · {a.uptime}% uptime (30d)</small>
            <div className="flex" style={{ gap: 2, marginTop: 10 }}>{Array.from({ length: 30 }, (_, i) => (
              <span key={i} title={`Day ${i + 1}`} style={{ flex: 1, height: 22, borderRadius: 2, background: a.uptime < 100 && (i === 11 || (a.uptime < 99.95 && i === 23)) ? C.amber : C.green }} />
            ))}</div>
          </Tilt>
        ))}
      </div>

      <div className="grid g-21">
        <Panel title="Deployment history" sub="Every release, with status and notes" actions={<Segmented value={env} onChange={setEnv} options={["All", "Production", "Staging"]} />}>
          <div className="timeline">{list.map((d) => (
            <div key={d.id} className={`tl-item fade-in ${d.status === "success" ? "ok" : d.status === "failed" ? "fail" : "run"}`}>
              <div className="flex between wrap-gap"><b>{d.app} <span className="muted" style={{ fontWeight: 400 }}>{d.version}</span></b><StatusBadge s={d.status} /></div>
              <small>{d.id} · {d.env} · {d.by} · {d.when}</small>
              <p style={{ fontSize: 14, marginTop: 4 }}>{d.notes}</p>
            </div>
          ))}</div>
        </Panel>
        <Panel title="Pipeline">
          {!run ? <p className="muted" style={{ fontSize: 14 }}>No deployment running. Click <b>Request deployment</b> to watch a release go through build → test → deploy.</p> : (
            <>
              <b>{run.app} {run.ver}</b><small className="muted" style={{ display: "block", marginBottom: 12 }}>→ {run.env}</small>
              {run.steps.map((s, i) => (
                <div className="list-item" key={s}>
                  <span className={`badge ${i < run.step ? "green" : i === run.step ? "amber" : "gray"}`} style={{ width: 72, justifyContent: "center" }}>{i < run.step ? "Passed" : i === run.step ? "Running" : "Queued"}</span>
                  <span className="grow" style={{ fontSize: 14 }}>{s}</span>
                </div>
              ))}
              <div style={{ marginTop: 12 }}><Progress value={(Math.min(run.step + 1, run.steps.length) / run.steps.length) * 100} /></div>
            </>
          )}
          <div className="chart-box sm" style={{ marginTop: 16 }}>
            <Bar data={{ labels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"], datasets: [
              { label: "Successful", data: [6, 8, 7, 11, 12, 4], backgroundColor: C.green, borderRadius: 4 },
              { label: "Failed", data: [1, 0, 1, 1, 1, 0], backgroundColor: C.red, borderRadius: 4 },
            ] }} options={stacked} />
          </div>
        </Panel>
      </div>

      <Modal open={modal} onClose={() => setModal(false)}>
        <h2>Request deployment</h2>
        <p className="muted">Choose what to release. The pipeline runs automatically after approval.</p><br />
        <label className="field"><span>Application</span><select className="input" value={form.app} onChange={(e) => setForm({ ...form, app: e.target.value })}>{D.apps.map((a) => <option key={a.name}>{a.name}</option>)}</select></label>
        <label className="field"><span>Environment</span><select className="input" value={form.env} onChange={(e) => setForm({ ...form, env: e.target.value })}><option>Staging</option><option>Production</option></select></label>
        <label className="field"><span>Release notes</span><input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="What's changing?" /></label>
        <div className="modal-foot"><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={start}><Icon name="rocket" size={16} /> Start deployment</button></div>
      </Modal>
    </>
  );
}
