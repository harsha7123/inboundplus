import { useEffect, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Kpi, PageHead, Panel, Segmented } from "../../components/ui";
import D from "../../data";
import { axes, noLegend, rightAxis } from "../../lib/charts";
import { C, PALETTE, fmt, money, pct, sum } from "../../lib/utils";

const A = D.analytics;
const TIPS = [
  "Top of funnel — 68% of sessions are mobile.",
  "Product pages: add size guides and reviews above the fold.",
  "Cart: free-shipping threshold banner is being A/B tested.",
  "Checkout: one-page checkout is projected to lift completion by ~9%.",
  "Purchases: AI agent recovers ~6% of abandoned carts on WhatsApp.",
];

export default function Analytics() {
  const [range, setRange] = useState("12");
  const [stage, setStage] = useState(null);
  const [grown, setGrown] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => setGrown(true)); return () => cancelAnimationFrame(t); }, []);

  const N = +range, sl = (a) => a.slice(-N), labels = sl(D.months);
  const rev = sl(A.revenue), ses = sl(A.sessions), ord = sl(A.orders), half = Math.max(1, Math.floor(N / 2));
  const prev = A.revenue.slice(-2 * N, -N);
  const prevSum = prev.length ? sum(prev) : sum(rev.slice(0, half)) * (N / half);
  const F = A.funnel, top = F[0].value, cm = D.months.slice(-6);

  return (
    <>
      <PageHead title="Analytics" sub="Traffic, conversion and customer behaviour across your store.">
        <Segmented value={range} onChange={setRange} options={[{ value: "3", label: "3M" }, { value: "6", label: "6M" }, { value: "12", label: "12M" }]} />
      </PageHead>

      <div className="kpis">
        <Kpi label="Revenue" value={money(sum(rev))} delta={pct(sum(rev), prevSum)} />
        <Kpi label="Sessions" value={fmt(sum(ses))} delta={pct(sum(ses.slice(-half)), sum(ses.slice(0, half)))} />
        <Kpi label="Orders" value={sum(ord).toLocaleString()} delta={pct(sum(ord.slice(-half)), sum(ord.slice(0, half)))} />
        <Kpi label="Returning customers" value="34.8%" delta={3.2} />
      </div>

      <div className="grid g-2">
        <Panel title="Conversion rate & AOV" sub="Click legend items to toggle">
          <div className="chart-box">
            <Line data={{ labels, datasets: [
              { label: "Conversion rate (%)", data: sl(A.convRate), borderColor: C.orange, backgroundColor: C.orange, tension: 0.35, yAxisID: "y" },
              { label: "AOV ($)", data: sl(A.aov), borderColor: C.purple, backgroundColor: C.purple, tension: 0.35, yAxisID: "y1" },
            ] }} options={{ interaction: { mode: "index", intersect: false }, scales: { ...axes((x) => x + "%"), y1: rightAxis((x) => "$" + x) } }} />
          </div>
        </Panel>
        <Panel title="Conversion funnel" sub="Click a stage to see drop-off">
          <div className="funnel">
            {F.map((s, i) => (
              <div key={s.stage} className="funnel-row" style={{ cursor: "pointer", opacity: stage == null || stage === i ? 1 : 0.55 }} onClick={() => setStage(i)}>
                <span>{s.stage}</span>
                <div><div className="funnel-bar" style={{ width: grown ? `${Math.max(8, (s.value / top) * 100)}%` : 0, background: PALETTE[i], color: i === 4 ? C.ink : "#fff" }}>{fmt(s.value)}</div></div>
                <b className="num">{((s.value / top) * 100).toFixed(1)}%</b>
              </div>
            ))}
          </div>
          <div className="muted" style={{ marginTop: 14, fontSize: 13 }}>
            {stage == null ? "Select a stage." : (
              <>
                <b style={{ color: "var(--navy)" }}>{F[stage].stage}: {F[stage].value.toLocaleString()}</b>
                {stage > 0 && <> · <span style={{ color: C.red }}>{(100 - (F[stage].value / F[stage - 1].value) * 100).toFixed(1)}% drop-off from {F[stage - 1].stage}</span></>}
                <br />{TIPS[stage]}
              </>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid g-3">
        <Panel title="Devices">
          <div className="chart-box sm"><Doughnut data={{ labels: A.devices.labels, datasets: [{ data: A.devices.values, backgroundColor: [C.orange, C.purple, C.peach], borderWidth: 2, borderColor: "#fff", hoverOffset: 8 }] }} options={{ cutout: "60%", plugins: { legend: { position: "bottom" } } }} /></div>
        </Panel>
        <Panel title="Sales by region">
          <div className="chart-box sm"><Bar data={{ labels: A.regions.map((r) => r.name), datasets: [{ data: A.regions.map((r) => r.value), backgroundColor: C.orange, borderRadius: 5 }] }}
            options={{ indexAxis: "y", plugins: noLegend, scales: { x: { grid: { color: C.grid }, ticks: { callback: (x) => x + "%" } }, y: { grid: { display: false } } } }} /></div>
        </Panel>
        <Panel title="Orders per month">
          <div className="chart-box sm"><Bar data={{ labels, datasets: [{ label: "Orders", data: ord, backgroundColor: C.purple, borderRadius: 5 }] }} options={{ plugins: noLegend, scales: axes() }} /></div>
        </Panel>
      </div>

      <Panel title="Customer retention cohorts" sub="% of customers who purchase again, by first-purchase month">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th className="nosort">Cohort</th>{["M0", "M1", "M2", "M3", "M4", "M5"].map((m) => <th key={m} className="nosort num">{m}</th>)}</tr></thead>
            <tbody>{A.cohorts.map((row, i) => (
              <tr key={i}><td><b>{cm[i]}</b></td>{[0, 1, 2, 3, 4, 5].map((j) => row[j] == null ? <td key={j} /> : (
                <td key={j} className="num" title={`${cm[i]} cohort, month ${j}: ${row[j]}%`}
                  style={{ background: `rgba(85,81,211,${(row[j] / 100) * 0.85 + 0.05})`, color: row[j] > 50 ? "#fff" : C.ink, fontWeight: 500 }}>{row[j]}%</td>
              ))}</tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
