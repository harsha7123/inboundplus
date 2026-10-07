import { useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import { Empty } from "../../components/shared";
import { Kpi, PageHead, Panel } from "../../components/ui";
import { STAGES } from "../../data/agency";
import { noLegend } from "../../lib/charts";
import { useAgency } from "../../lib/useAgency";
import { ago } from "../../lib/useData";
import { C, money, sum } from "../../lib/utils";
import { HealthBadge, NewClientModal, StagePill } from "./agencySections";

export default function AdminOverview() {
  const nav = useNavigate();
  const { clients, files, requests, messages, agents, deployments } = useAgency();
  const [adding, setAdding] = useState(false);

  const live = clients.filter((c) => c.stage === "Live");
  const onboarding = clients.filter((c) => c.stage !== "Live");
  const mrr = sum(clients.map((c) => c.mrr));
  const atRisk = clients.filter((c) => c.health.band !== "Healthy");
  const mrrAtRisk = sum(atRisk.filter((c) => c.health.band === "At risk").map((c) => c.mrr));
  const plans = [...new Set(clients.map((c) => c.plan))];
  const orgName = (id) => clients.find((c) => c.id === id)?.name || "—";

  const activity = [
    ...files.map((f) => ({ at: f.created_at, org: f.org_id, icon: "file", text: `${f.uploaded_by} uploaded ${f.name}` })),
    ...requests.map((r) => ({ at: r.created_at, org: r.org_id, icon: "send", text: `Request: ${r.title}` })),
    ...messages.map((m) => ({ at: m.created_at, org: m.org_id, icon: "chat", text: `${m.sender_name}: ${m.body}` })),
    ...deployments.map((d) => ({ at: d.created_at, org: d.org_id, icon: "rocket", text: `${d.app} ${d.version || ""} → ${d.env}` })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 8);

  return (
    <>
      <PageHead title="Agency command center" sub="Client portfolio, onboarding, AI agents and revenue — at a glance.">
        <button className="btn btn-ghost" onClick={() => nav("/admin/onboarding")}><Icon name="folder" size={16} /> Onboarding board</button>
        <button className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> New client</button>
      </PageHead>

      <div className="kpis">
        <Kpi label="Monthly recurring revenue" value={money(mrr)} icon="chart" />
        <Kpi label="Live clients" value={`${live.length} / ${clients.length}`} icon="users" />
        <Kpi label="In onboarding" value={onboarding.length} icon="folder" />
        <Kpi label="AI agents live" value={agents.filter((a) => a.status === "Live").length} icon="bot" />
      </div>

      <div className="grid g-21">
        <Panel title="Needs attention" sub={`${atRisk.length} client${atRisk.length === 1 ? "" : "s"} below “Healthy” · ${money(mrrAtRisk)} MRR at risk`}
          actions={<button className="btn btn-sm btn-ghost" onClick={() => nav("/admin/clients")}>All clients</button>}>
          {atRisk.length ? <div className="list">{atRisk.sort((a, b) => a.health.score - b.health.score).map((c) => (
            <div className="list-item" key={c.id} style={{ cursor: "pointer" }} onClick={() => nav(`/admin/clients/${c.id}`)}>
              <div className="avatar sm">{c.name.slice(0, 2).toUpperCase()}</div>
              <div className="grow"><b style={{ fontSize: 14 }}>{c.name}</b><small>{c.health.reasons.slice(0, 2).join(" · ") || "—"}</small></div>
              <span className="muted" style={{ fontSize: 13 }}>{money(c.mrr)}/mo</span><HealthBadge health={c.health} />
            </div>
          ))}</div> : <Empty icon="check" title="All clients healthy" text="Nothing needs attention right now." />}
        </Panel>
        <Panel title="Onboarding pipeline" actions={<button className="btn btn-sm btn-ghost" onClick={() => nav("/admin/onboarding")}>Open board</button>}>
          <div className="chart-box sm">
            <Bar data={{ labels: STAGES, datasets: [{ data: STAGES.map((s) => clients.filter((c) => (c.stage || "Signed") === s).length), backgroundColor: STAGES.map((s) => (s === "Live" ? C.green : C.orange)), borderRadius: 6 }] }}
              options={{ indexAxis: "y", plugins: noLegend, scales: { x: { ticks: { stepSize: 1 }, grid: { color: C.grid } }, y: { grid: { display: false } } } }} />
          </div>
        </Panel>
      </div>

      <div className="grid g-3">
        <Panel title="Revenue by package">
          <div className="chart-box sm">
            <Doughnut data={{ labels: plans, datasets: [{ data: plans.map((p) => sum(clients.filter((c) => c.plan === p).map((c) => c.mrr))), backgroundColor: [C.orange, C.purple, C.sky, C.ink], borderWidth: 2, borderColor: "#fff" }] }}
              options={{ cutout: "62%", plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: (x) => ` ${x.label}: ${money(x.raw)}/mo` } } } }} />
          </div>
        </Panel>
        <Panel title="Portfolio health">
          {["Healthy", "Watch", "At risk"].map((b) => {
            const n = clients.filter((c) => c.health.band === b).length;
            return (
              <div key={b} className="list-item"><span className={`badge ${b === "Healthy" ? "green" : b === "Watch" ? "amber" : "red"}`}>{b}</span>
                <div className="grow"><div className="progress" style={{ marginLeft: 8 }}><div style={{ width: `${clients.length ? (n / clients.length) * 100 : 0}%`, background: b === "Healthy" ? C.green : b === "Watch" ? C.amber : C.red }} /></div></div><b>{n}</b></div>
            );
          })}
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>Health is scored from approvals waiting, open requests, response time, onboarding progress and account status.</p>
        </Panel>
        <Panel title="Recent activity">
          {activity.length ? <div className="list">{activity.map((a, i) => (
            <div className="list-item" key={i} style={{ cursor: "pointer" }} onClick={() => nav(`/admin/clients/${a.org}`)}>
              <Icon name={a.icon} size={16} style={{ color: "var(--blue)" }} />
              <div className="grow"><span style={{ fontSize: 13, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.text}</span><small>{orgName(a.org)} · {ago(a.at)}</small></div>
            </div>
          ))}</div> : <Empty icon="zap" title="No activity yet" />}
        </Panel>
      </div>

      <Panel title="Onboarding in progress" actions={<button className="btn btn-sm btn-ghost" onClick={() => nav("/admin/onboarding")}>Manage</button>}>
        {onboarding.length ? <div className="tbl-wrap"><table className="tbl">
          <thead><tr>{["Client", "Stage", "Checklist", "Manager", "Started"].map((h) => <th key={h} className="nosort">{h}</th>)}</tr></thead>
          <tbody>{onboarding.map((c) => (
            <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => nav(`/admin/clients/${c.id}`)}>
              <td><b>{c.name}</b><small className="muted" style={{ display: "block" }}>{c.plan}</small></td>
              <td><StagePill stage={c.stage} /></td>
              <td style={{ minWidth: 160 }}>{c.onboarding == null ? <span className="muted">No checklist</span> : <div className="flex"><div style={{ flex: 1 }}><div className="progress"><div style={{ width: `${c.onboarding}%` }} /></div></div><small>{c.onboarding}%</small></div>}</td>
              <td>{c.manager || "—"}</td><td>{ago(c.created_at)}</td>
            </tr>
          ))}</tbody>
        </table></div> : <Empty icon="folder" title="No clients in onboarding" />}
      </Panel>
      <NewClientModal open={adding} onClose={() => setAdding(false)} />
    </>
  );
}
