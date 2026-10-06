import { useEffect, useRef, useState } from "react";
import { Doughnut, Line } from "react-chartjs-2";
import Icon from "../../components/Icon";
import { Kpi, PageHead, Panel, SortableTable } from "../../components/ui";
import { useIsland } from "../../context/IslandContext";
import D from "../../data";
import { axes, gauge, rightAxis } from "../../lib/charts";
import { C, fmt, pct } from "../../lib/utils";

const S = D.seo, n = S.clicks.length;
const SEV = { red: "var(--red)", amber: "var(--amber)", green: "var(--green)" };

export default function Seo() {
  const island = useIsland();
  const [health, setHealth] = useState(S.health);
  const [auditing, setAuditing] = useState(false);
  const [auditTime, setAuditTime] = useState("Last audit: Oct 5");
  const [issues, setIssues] = useState(S.issues);
  const [q, setQ] = useState("");
  const timer = useRef();
  useEffect(() => () => clearInterval(timer.current), []);

  const runAudit = () => {
    setAuditing(true);
    const job = island.notify("Auditing 1,240 pages…", { icon: "zap", progress: true, persist: true });
    let h = S.health;
    timer.current = setInterval(() => {
      h = Math.min(91, h + 1); setHealth(h); job.update(null, ((h - S.health) / (91 - S.health)) * 100);
      if (h >= 91) {
        clearInterval(timer.current); setAuditing(false); setAuditTime("Last audit: just now");
        setIssues((list) => [{ sev: "green", text: "8 meta descriptions fixed since last audit" }, ...list]);
        job.done("Audit complete — health 91/100");
      }
    }, 120);
  };

  const rows = S.keywords.filter((k) => k.kw.includes(q.toLowerCase())).map((k) => [k.kw, k.pos, k.prev - k.pos, k.vol, k.url]);

  return (
    <>
      <PageHead title="SEO" sub="Rankings, organic traffic and site health.">
        <button className="btn btn-primary" onClick={runAudit} disabled={auditing}><Icon name="zap" size={16} /> {auditing ? "Auditing…" : "Run site audit"}</button>
      </PageHead>
      <div className="kpis">
        <Kpi label="Organic clicks" value={fmt(S.clicks[n - 1])} delta={pct(S.clicks[n - 1], S.clicks[n - 2])} icon="search" spark={S.clicks} color={C.orange} />
        <Kpi label="Impressions" value={fmt(S.impressions[n - 1])} delta={pct(S.impressions[n - 1], S.impressions[n - 2])} icon="eye" spark={S.impressions} color={C.purple} />
        <Kpi label="Visibility score" value={S.visibility[n - 1] + "%"} delta={pct(S.visibility[n - 1], S.visibility[n - 2])} icon="globe" spark={S.visibility} color={C.green} />
        <Kpi label="Backlinks" value={S.backlinks[n - 1]} delta={pct(S.backlinks[n - 1], S.backlinks[n - 2])} icon="plug" spark={S.backlinks} color={C.sky} />
      </div>
      <div className="grid g-12">
        <Panel title="Site health" actions={<span className="muted" style={{ fontSize: 12 }}>{auditTime}</span>}>
          <div className="gauge-wrap">
            <div className="chart-box sm" style={{ width: "100%" }}>
              <Doughnut data={{ datasets: [{ data: [health, 100 - health], backgroundColor: [C.green, "#e7f6ec"], borderWidth: 0 }] }} options={gauge} />
            </div>
            <div className="g-num">{health}</div><small>out of 100</small>
          </div>
          <div className="list">{issues.map((i, k) => (
            <div className="list-item fade-in" key={k}><span className="dot" style={{ color: SEV[i.sev] }} /><span className="grow" style={{ fontSize: 14 }}>{i.text}</span></div>
          ))}</div>
        </Panel>
        <Panel title="Organic clicks vs impressions" sub="Google Search Console">
          <div className="chart-box lg">
            <Line data={{ labels: D.months, datasets: [
              { label: "Clicks", data: S.clicks, borderColor: C.orange, backgroundColor: "rgba(242,107,53,.08)", fill: true, tension: 0.35, yAxisID: "y" },
              { label: "Impressions", data: S.impressions, borderColor: C.purple, tension: 0.35, yAxisID: "y1", borderDash: [5, 4] },
            ] }} options={{ interaction: { mode: "index", intersect: false }, scales: { ...axes(), y1: rightAxis((x) => fmt(x)) } }} />
          </div>
        </Panel>
      </div>
      <Panel title="Keyword rankings" sub="Click a header to sort · filter by keyword"
        actions={<input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter keywords…" style={{ maxWidth: 240 }} />}>
        {rows.length ? (
          <SortableTable initialSort={1} initialDir={1} rows={rows} columns={[
            { label: "Keyword", render: (x) => <b>{x}</b> },
            { label: "Position", render: (x) => <span className={`badge ${x <= 3 ? "green" : x <= 10 ? "blue" : "gray"}`}>#{x}</span> },
            { label: "Change", render: (x) => (x === 0 ? "—" : <span style={{ color: x > 0 ? C.green : C.red }}>{x > 0 ? "▲" : "▼"} {Math.abs(x)}</span>) },
            { label: "Search volume", render: (x) => x.toLocaleString() },
            { label: "URL", render: (x) => <small className="muted">{x}</small> },
          ]} />
        ) : <div className="empty">No keywords match “{q}”.</div>}
      </Panel>
    </>
  );
}
