import { useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import { Kpi, PageHead, Panel, Segmented, StatusBadge } from "../../components/ui";
import D from "../../data";
import { axes, noLegend } from "../../lib/charts";
import { C, fmt, money, sum } from "../../lib/utils";

const AD = D.ads;
const SPEND = sum(AD.campaigns.map((c) => c.spend)), REV = sum(AD.campaigns.map((c) => c.revenue)), CONV = sum(AD.campaigns.map((c) => c.conv));
const ROAS0 = REV / SPEND;

export default function Ads() {
  const [platform, setPlatform] = useState("All");
  const [budget, setBudget] = useState(SPEND);
  const list = AD.campaigns.filter((c) => platform === "All" || c.platform === platform);
  const roas = ROAS0 * Math.pow(budget / SPEND, -0.28), projRev = budget * roas;

  return (
    <>
      <PageHead title="Paid ads" sub="Meta, Google and TikTok campaigns in one view.">
        <Segmented value={platform} onChange={setPlatform} options={["All", "Meta", "Google", "TikTok"]} />
      </PageHead>
      <div className="kpis">
        <Kpi label="Ad spend" value={money(SPEND)} delta={6.2} icon="card" />
        <Kpi label="Attributed revenue" value={money(REV)} delta={14.8} icon="chart" />
        <Kpi label="ROAS" value={ROAS0.toFixed(2) + "×"} delta={8.1} icon="target" />
        <Kpi label="Cost per purchase" value={"$" + (SPEND / CONV).toFixed(2)} delta={-5.4} icon="cart" />
      </div>
      <div className="grid g-2">
        <Panel title="Spend vs revenue by campaign">
          <div className="chart-box">
            <Bar data={{ labels: list.map((c) => c.name.split("·")[1].trim()), datasets: [
              { label: "Spend", data: list.map((c) => c.spend), backgroundColor: C.peach, borderRadius: 5 },
              { label: "Revenue", data: list.map((c) => c.revenue), backgroundColor: C.orange, borderRadius: 5 },
            ] }} options={{ scales: axes((x) => "$" + fmt(x)) }} />
          </div>
        </Panel>
        <Panel title="Budget simulator" sub="Drag to see projected results next month">
          <label className="field"><span>Monthly budget: <b>{money(budget)}</b></span>
            <input type="range" min="5000" max="30000" step="500" value={budget} onChange={(e) => setBudget(+e.target.value)} style={{ width: "100%", accentColor: C.orange }} /></label>
          <div className="grid g-3" style={{ margin: 0 }}>
            <div className="kpi"><div className="k-top">Projected revenue</div><div className="k-val">{money(projRev)}</div></div>
            <div className="kpi"><div className="k-top">Projected ROAS</div><div className="k-val">{roas.toFixed(2)}×</div></div>
            <div className="kpi"><div className="k-top">Purchases</div><div className="k-val">{Math.round(projRev / 82)}</div></div>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>Model assumes diminishing returns above current spend, based on the last 12 months.</p>
          <div className="chart-box sm" style={{ marginTop: 8 }}>
            <Line data={{ labels: D.months, datasets: [{ label: "ROAS", data: AD.roasTrend, borderColor: C.green, backgroundColor: "rgba(22,163,74,.08)", fill: true, tension: 0.35 }] }} options={{ plugins: noLegend, scales: axes((x) => x + "×") }} />
          </div>
        </Panel>
      </div>
      <Panel title="Campaigns">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>{["Campaign", "Status", "Spend", "Revenue", "ROAS", "Clicks", "Purchases"].map((h, i) => <th key={h} className={`nosort ${i > 1 ? "num" : ""}`}>{h}</th>)}</tr></thead>
            <tbody>{list.map((c) => (
              <tr key={c.name}><td><b>{c.name}</b></td><td><StatusBadge s={c.status} /></td><td className="num">{money(c.spend)}</td><td className="num">{money(c.revenue)}</td>
                <td className="num"><b style={{ color: c.revenue / c.spend >= 3 ? C.green : C.amber }}>{(c.revenue / c.spend).toFixed(1)}×</b></td>
                <td className="num">{c.clicks.toLocaleString()}</td><td className="num">{c.conv}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
