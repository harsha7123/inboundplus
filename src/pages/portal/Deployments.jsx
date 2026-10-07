import { useState } from "react";
import { Bar } from "react-chartjs-2";
import Icon from "../../components/Icon";
import RequestModal from "../../components/RequestModal";
import { DeployTimeline } from "../../components/shared";
import { PageHead, Panel, Segmented, StatusBadge, Tilt } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import D from "../../data";
import { useTable } from "../../lib/useData";
import { C } from "../../lib/utils";

const stacked = { scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: C.grid } } } };

export default function Deployments() {
  const { session } = useAuth();
  const { rows } = useTable("deployments", session.orgId || undefined);
  const [env, setEnv] = useState("All");
  const [open, setOpen] = useState(false);

  // releases per month (last 6 months) from real rows
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - 5 + i); return d; });
  const count = (d, ok) => rows.filter((r) => { const x = new Date(r.created_at); return x.getMonth() === d.getMonth() && x.getFullYear() === d.getFullYear() && (ok ? r.status === "success" : r.status === "failed"); }).length;

  return (
    <>
      <PageHead title="Software & deployments" sub="Live status of your store, AI agents and integrations. Releases are published by the InboundPlus team.">
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Icon name="rocket" size={16} /> Request deployment</button>
      </PageHead>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
        {D.apps.map((a) => (
          <Tilt key={a.name} className="kpi">
            <div className="k-top"><span>{a.env}</span><StatusBadge s={a.health} /></div>
            <div style={{ fontWeight: 500, fontSize: 16, margin: "10px 0 4px" }}>{a.name}</div>
            <small className="muted">{a.version} · {a.uptime}% uptime (30d) · sample</small>
            <div className="flex" style={{ gap: 2, marginTop: 10 }}>{Array.from({ length: 30 }, (_, i) => (
              <span key={i} title={`Day ${i + 1}`} style={{ flex: 1, height: 22, borderRadius: 2, background: a.uptime < 100 && (i === 11 || (a.uptime < 99.95 && i === 23)) ? C.amber : C.green }} />
            ))}</div>
          </Tilt>
        ))}
      </div>

      <div className="grid g-21">
        <Panel title="Deployment history" sub="Every release, with status and notes" actions={<Segmented value={env} onChange={setEnv} options={["All", "Production", "Staging"]} />}>
          <DeployTimeline rows={rows.filter((d) => env === "All" || d.env === env)} />
        </Panel>
        <Panel title="Releases per month">
          <div className="chart-box">
            <Bar data={{ labels: months.map((d) => d.toLocaleString("en-US", { month: "short" })), datasets: [
              { label: "Successful", data: months.map((d) => count(d, true)), backgroundColor: C.green, borderRadius: 4 },
              { label: "Failed", data: months.map((d) => count(d, false)), backgroundColor: C.red, borderRadius: 4 },
            ] }} options={stacked} />
          </div>
        </Panel>
      </div>
      <RequestModal open={open} onClose={() => setOpen(false)} type="Deployment" prefill="Deploy " />
    </>
  );
}
