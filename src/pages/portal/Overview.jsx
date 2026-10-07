import { useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import { BarScene, Kpi, PageHead, Panel, Progress, Segmented, StatusBadge } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { usePortal } from "../../context/PortalContext";
import D from "../../data";
import { axes, gauge, rightAxis } from "../../lib/charts";
import { ago, useTable } from "../../lib/useData";
import { C, PALETTE, PALETTE_HEX, fmt, money, pct, sum } from "../../lib/utils";

const A = D.analytics, n = A.revenue.length, m6 = D.months.slice(-6);
const KEEP = { all: [0, 1, 2, 3, 4, 5], paid: [1, 2], organic: [0, 3, 4, 5] };

export default function Overview() {
  const { session } = useAuth();
  const { state } = usePortal();
  const nav = useNavigate();
  const [mode, setMode] = useState("all");
  const projects = useTable("projects", session.orgId || undefined).rows;
  const deployments = useTable("deployments", session.orgId || undefined).rows;
  const r = D.client.retainer;
  const scene = A.channelMonthly.map((row, i) => (KEEP[mode].includes(i) ? row : row.map(() => 0)));

  return (
    <>
      <PageHead title={`Good ${new Date().getHours() < 12 ? "morning" : "afternoon"}, ${session.name.split(" ")[0]} 👋`} sub={`Here's how ${session.company} is performing this month.`}>
        <button className="btn btn-ghost" onClick={() => nav("/portal/reports")}><Icon name="download" size={16} /> Reports</button>
        <button className="btn btn-primary" onClick={() => nav("/portal/agents", { state: { agent: "a3" } })}><Icon name="bot" size={16} /> Ask the AI analyst</button>
      </PageHead>

      {session.isNew && (
        <div className="panel" style={{ marginBottom: 20, borderColor: C.orange }}>
          <div className="flex between wrap-gap">
            <div><h3>Welcome to your client hub 🎉</h3><p className="muted">We're showing sample data until your store and ad accounts are connected.</p></div>
            <button className="btn btn-primary" onClick={() => nav("/portal/settings")}>Connect data sources</button>
          </div>
        </div>
      )}

      <div className="kpis">
        <Kpi label="Revenue (Oct)" value={money(A.revenue[n - 1])} delta={pct(A.revenue[n - 1], A.revenue[n - 2])} icon="chart" spark={A.revenue} color={C.orange} />
        <Kpi label="Orders" value={A.orders[n - 1].toLocaleString()} delta={pct(A.orders[n - 1], A.orders[n - 2])} icon="cart" spark={A.orders} color={C.purple} />
        <Kpi label="Conversion rate" value={A.convRate[n - 1] + "%"} delta={pct(A.convRate[n - 1], A.convRate[n - 2])} icon="target" spark={A.convRate} color={C.green} />
        <Kpi label="Avg. order value" value={"$" + A.aov[n - 1]} delta={pct(A.aov[n - 1], A.aov[n - 2])} icon="card" spark={A.aov} color={C.sky} />
      </div>

      <div className="grid g-21">
        <Panel title="Revenue by channel — 3D view" sub="Last 6 months · drag to rotate, hover a bar for details"
          actions={<Segmented value={mode} onChange={setMode} options={[{ value: "all", label: "All channels" }, { value: "paid", label: "Paid only" }, { value: "organic", label: "Organic only" }]} />}>
          <BarScene values={scene} colors={PALETTE_HEX} radius={17} tooltip={(ri, c, v) => `${A.channels.labels[ri]} · ${m6[c]}<br><b>$${v}k revenue</b>`} />
          <div className="legend" style={{ marginTop: 12 }}>{A.channels.labels.map((l, i) => <span key={l}><i style={{ background: PALETTE[i] }} />{l}</span>)}</div>
        </Panel>
        <Panel title="Traffic sources" sub="Share of sessions">
          <div className="chart-box sm">
            <Doughnut data={{ labels: A.channels.labels, datasets: [{ data: A.channels.values, backgroundColor: PALETTE, borderWidth: 2, borderColor: "#fff", hoverOffset: 10 }] }} options={{ cutout: "64%", plugins: { legend: { display: false } } }} />
          </div>
          <div className="list" style={{ marginTop: 10 }}>
            {A.channels.labels.slice(0, 4).map((l, i) => <div className="list-item" key={l}><span className="dot" style={{ color: PALETTE[i] }} /><span className="grow">{l}</span><b>{A.channels.values[i]}%</b></div>)}
          </div>
        </Panel>
      </div>

      <div className="grid g-21">
        <Panel title="Revenue & sessions" sub="12-month trend">
          <div className="chart-box">
            <Bar data={{ labels: D.months, datasets: [
              { type: "bar", label: "Revenue ($)", data: A.revenue, backgroundColor: C.orange, borderRadius: 6, yAxisID: "y" },
              { type: "line", label: "Sessions", data: A.sessions, borderColor: C.purple, backgroundColor: C.purple, tension: 0.35, pointRadius: 3, yAxisID: "y1" },
            ] }} options={{ interaction: { mode: "index", intersect: false }, scales: { ...axes((v) => "$" + fmt(v)), y1: rightAxis((v) => fmt(v)) } }} />
          </div>
        </Panel>
        <Panel title="Retainer hours" sub={`October · ${r.used} of ${r.hours} h used`}>
          <div className="gauge-wrap">
            <div className="chart-box sm" style={{ width: "100%" }}>
              <Doughnut data={{ labels: ["Used", "Remaining"], datasets: [{ data: [r.used, r.hours - r.used], backgroundColor: [C.orange, "#fff0e8"], borderWidth: 0 }] }} options={gauge} />
            </div>
            <div className="g-num">{Math.round((r.used / r.hours) * 100)}%</div>
            <small>{r.hours - r.used} hours remaining</small>
          </div>
          <div className="list">{[["Development", 38], ["Campaign management", 24], ["Content & SEO", 16], ["Strategy", 8]].map(([t, h]) => <div className="list-item" key={t}><span className="grow">{t}</span><b>{h} h</b></div>)}</div>
        </Panel>
      </div>

      <div className="grid g-3">
        <Panel title="Active projects" actions={<button className="btn btn-sm btn-ghost" onClick={() => nav("/portal/projects")}>View all</button>}>
          <div className="list">{projects.length === 0 && <p className="muted" style={{ fontSize: 14 }}>No projects yet.</p>}{projects.slice(0, 4).map((p) => (
            <div className="list-item" key={p.id}>
              <div className="grow"><b style={{ fontSize: 14 }}>{p.name}</b><small>{p.type}{p.due ? ` · due ${p.due}` : ""}</small><div style={{ marginTop: 6 }}><Progress value={p.progress} tone={p.status === "At risk" ? "amber" : ""} /></div></div>
              <b>{p.progress}%</b>
            </div>))}
          </div>
        </Panel>
        <Panel title="Latest deployments" actions={<button className="btn btn-sm btn-ghost" onClick={() => nav("/portal/deployments")}>View all</button>}>
          <div className="timeline">{deployments.length === 0 && <p className="muted" style={{ fontSize: 14 }}>No deployments yet.</p>}{deployments.slice(0, 4).map((d) => (
            <div key={d.id} className={`tl-item ${d.status === "success" ? "ok" : d.status === "failed" ? "fail" : "run"}`}><b style={{ fontSize: 14 }}>{d.app} {d.version}</b><br /><small>{d.env} · {ago(d.created_at)}</small></div>))}
          </div>
        </Panel>
        <Panel title="AI agents this week" actions={<button className="btn btn-sm btn-ghost" onClick={() => nav("/portal/agents")}>Open</button>}>
          <div className="list">{state.agents.map((a) => (
            <div className="list-item" key={a.id}>
              <div className={`avatar sm ${a.active ? "green" : ""}`}><Icon name="bot" size={16} /></div>
              <div className="grow"><b style={{ fontSize: 14 }}>{a.name}</b><small>{a.convos.toLocaleString()} conversations · {a.resolved}% resolved</small></div>
              <StatusBadge s={a.active ? "Active" : "Paused"} />
            </div>))}
          </div>
          <div className="panel" style={{ background: "var(--surface-2)", boxShadow: "none", border: "none", marginTop: 10, padding: 14 }}>
            <b style={{ fontSize: 22, color: "var(--navy)" }}>{sum(state.agents.map((a) => a.saved))} hours</b><br /><small className="muted">of team time saved by AI agents this quarter</small>
          </div>
        </Panel>
      </div>
    </>
  );
}
