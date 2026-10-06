import { BarScene, Delta, Kpi, PageHead, Panel, Progress, SortableTable, StatusBadge } from "../../components/ui";
import D from "../../data";
import { PALETTE_HEX, money } from "../../lib/utils";

const P = D.analytics.topProducts;
const SCENE = P.map((p) => [0.7, 0.85, 0.92, 1].map((f) => Math.round((p.revenue / 1000) * f)));
const TESTS = [
  ["One-page checkout", "Checkout", 9.4, 96, "Winner"],
  ["Free-shipping progress bar", "Cart", 5.1, 88, "Running"],
  ["Reviews above the fold", "Product", 3.7, 91, "Running"],
  ["Bundle offer: Trail kit", "Product", -1.2, 54, "Stopped"],
];

export default function Ecommerce() {
  return (
    <>
      <PageHead title="E-commerce" sub="Store performance, products and conversion experiments."><StatusBadge s="Healthy" label="Store online · 99.98% uptime" /></PageHead>
      <div className="kpis">
        <Kpi label="Cart abandonment" value="68.2%" delta={-4.1} icon="cart" />
        <Kpi label="Repeat purchase rate" value="27.4%" delta={2.6} icon="users" />
        <Kpi label="Customer lifetime value" value="$214" delta={6.8} icon="star" />
        <Kpi label="Page speed (LCP)" value="1.9s" delta={-12} icon="zap" />
      </div>
      <div className="grid g-21">
        <Panel title="Top products" sub="Click a column header to sort">
          <SortableTable initialSort={2} rows={P.map((p) => [p.name, p.units, p.revenue, p.trend])} columns={[
            { label: "Product", render: (x) => <b>{x}</b> },
            { label: "Units", render: (x) => x.toLocaleString() },
            { label: "Revenue", render: money },
            { label: "Trend", render: (x) => <Delta v={x} /> },
          ]} />
        </Panel>
        <Panel title="Product revenue — 3D">
          <BarScene height={300} values={SCENE} colors={PALETTE_HEX} radius={14} tooltip={(r, c, v) => `${P[r].name} · ${D.months.slice(-4)[c]}<br><b>$${v}k</b>`} />
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Bars = last 4 months revenue per product. Drag to rotate.</p>
        </Panel>
      </div>
      <Panel title="CRO experiments" sub="A/B tests run by the InboundPlus CRO team">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th className="nosort">Experiment</th><th className="nosort">Page</th><th className="nosort num">Variant lift</th><th className="nosort">Confidence</th><th className="nosort">Status</th></tr></thead>
            <tbody>{TESTS.map(([e, p, l, c, s]) => (
              <tr key={e}><td><b>{e}</b></td><td>{p}</td><td className="num"><Delta v={l} /></td>
                <td><div className="flex"><div style={{ width: 110 }}><Progress value={c} tone={c > 90 ? "green" : "amber"} /></div><small>{c}%</small></div></td>
                <td><StatusBadge s={s} /></td></tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
