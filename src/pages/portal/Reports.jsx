import { useState } from "react";
import Icon from "../../components/Icon";
import { DownloadButton, Empty } from "../../components/shared";
import { Modal, PageHead, Panel, Segmented, Switch } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useIsland } from "../../context/IslandContext";
import { usePortal } from "../../context/PortalContext";
import D from "../../data";
import { fmtDate, useTable } from "../../lib/useData";
import { money, pct, sum } from "../../lib/utils";

const SECTIONS = ["Sales & revenue", "Traffic & conversion", "SEO", "Paid ads", "AI agents", "Deployments"];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function sectionText(s, ctx) {
  const A = D.analytics, n = A.revenue.length;
  return {
    "Sales & revenue": `Revenue reached ${money(A.revenue[n - 1])} (+${pct(A.revenue[n - 1], A.revenue[n - 2]).toFixed(1)}%), with ${A.orders[n - 1].toLocaleString()} orders and an AOV of $${A.aov[n - 1]}.`,
    "Traffic & conversion": `${A.sessions[n - 1].toLocaleString()} sessions; conversion rate ${A.convRate[n - 1]}%. Mobile is 68% of traffic.`,
    SEO: `Site health ${D.seo.health}/100. 5 of 8 tracked keywords improved; “zapatillas trail running” now ranks #3.`,
    "Paid ads": "Blended ROAS 4.6×. Meta Retargeting is the top performer at 6.9×; TikTok Awareness recommended for pause.",
    "AI agents": `Agents handled ${sum(ctx.agents.map((a) => a.convos)).toLocaleString()} conversations and saved ${sum(ctx.agents.map((a) => a.saved))} team hours.`,
    Deployments: ctx.deployments.length ? `${ctx.deployments.length} releases logged; latest: ${ctx.deployments[0].app} ${ctx.deployments[0].version || ""}.` : "No releases logged yet.",
  }[s];
}

export default function Reports() {
  const { state } = usePortal();
  const { session } = useAuth();
  const island = useIsland();
  const orgId = session.orgId || undefined;
  const reports = useTable("reports", orgId);
  const deployments = useTable("deployments", orgId);
  const ctx = { agents: state.agents, deployments: deployments.rows };
  const [type, setType] = useState("All");
  const [view, setView] = useState(null);
  const [builder, setBuilder] = useState(false);
  const [custom, setCustom] = useState([]);
  const [draft, setDraft] = useState({ name: "", period: "Last 30 days", sections: SECTIONS.slice(0, 4) });

  const body = (r) => (r.summary ? [["Summary", r.summary]] : (r.sections || SECTIONS.slice(0, 4)).map((s) => [s, sectionText(s, ctx)]));

  const printReport = (r) => {
    const w = window.open("", "_blank");
    if (!w) return island.notify("Allow pop-ups to save the PDF", { icon: "x" });
    const html = body(r).map(([h, t]) => `<h3>${esc(h)}</h3><p>${esc(t)}</p>`).join("");
    w.document.write(`<!doctype html><html><head><title>${esc(r.name)}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,Inter,Segoe UI,sans-serif;color:#0c1115;max-width:720px;margin:40px auto;padding:0 20px}h1{color:#f26b35;font-weight:600}h3{font-weight:500}.top{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #f26b35;padding-bottom:12px;margin-bottom:20px}</style></head><body><div class="top"><img src="${location.origin}/img/logo.png" style="height:28px" alt="InboundPlus"><span>${esc(session.company)}</span></div><h1>${esc(r.name)}</h1><p>${esc(r.type)} report · ${esc(fmtDate(r.created_at))}</p>${html}<script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  };

  const generate = () => {
    if (!draft.sections.length) return island.notify("Pick at least one section", { icon: "x" });
    const r = { id: "c" + Date.now(), name: draft.name.trim() || "Custom report", type: "Custom", created_at: new Date().toISOString(), sections: draft.sections };
    setCustom((c) => [r, ...c]); setBuilder(false); setType("All"); setView(r);
    island.notify("Report generated", { icon: "report" });
  };

  const all = [...custom, ...reports.rows];
  const list = all.filter((r) => type === "All" || r.type === type);
  return (
    <>
      <PageHead title="Reports" sub="Reports shared by your InboundPlus team, plus custom reports you build yourself.">
        <button className="btn btn-primary" onClick={() => { setDraft({ name: `Custom report – ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, period: "Last 30 days", sections: SECTIONS.slice(0, 4) }); setBuilder(true); }}>
          <Icon name="plus" size={16} /> Build custom report</button>
      </PageHead>
      <div className="grid g-21">
        <Panel title="Report library" actions={<Segmented value={type} onChange={setType} options={[{ value: "All", label: "All" }, { value: "Monthly", label: "Monthly" }, { value: "Quarterly", label: "Quarterly" }, { value: "Audit", label: "Audits" }]} />}>
          {list.length ? (
            <div className="list">{list.map((r) => (
              <div className="list-item fade-in" key={r.id}>
                <div className="file-ico pdf">PDF</div>
                <div className="grow"><b style={{ fontSize: 14 }}>{r.name}</b><small>{r.type} · {fmtDate(r.created_at)}{r.path ? " · file attached" : ""}</small></div>
                <button className="btn btn-sm btn-ghost" onClick={() => setView(r)}><Icon name="eye" size={15} /> View</button>
                {r.path ? <DownloadButton row={r} label="PDF" /> : <button className="btn btn-sm btn-ghost" onClick={() => printReport(r)}><Icon name="download" size={15} /> PDF</button>}
              </div>
            ))}</div>
          ) : <Empty icon="report" title="No reports yet" text="Reports from your InboundPlus team will appear here." />}
        </Panel>
        <Panel title="Scheduled reports">
          <div className="list">
            {[["Weekly KPI digest", "Every Monday 8:00", true], ["Monthly performance", "1st business day", true], ["Ads pacing alert", "When spend > 90% of budget", false]].map(([t, w, on]) => (
              <ScheduleRow key={t} title={t} when={w} initial={on} onToggle={(v) => island.notify(v ? `${t} turned on` : `${t} paused`, { icon: "calendar" })} />
            ))}
          </div>
          <div className="demo-note" style={{ marginTop: 14 }}>Reports are emailed to {session.email} and stored here.</div>
        </Panel>
      </div>

      <Modal open={!!view} onClose={() => setView(null)}>
        {view && <>
          <span className="badge blue">{view.type}</span>
          <h2 style={{ marginTop: 10 }}>{view.name}</h2>
          <p className="muted">{session.company} · {fmtDate(view.created_at)}</p>
          {body(view).map(([h, t]) => <div key={h}><h3 style={{ margin: "16px 0 6px", fontSize: 15 }}>{h}</h3><p style={{ fontSize: 14 }}>{t}</p></div>)}
          <div className="modal-foot">
            <button className="btn btn-ghost" onClick={() => setView(null)}>Close</button>
            {view.path ? <DownloadButton row={view} label="Open attached file" className="btn btn-primary" /> : <button className="btn btn-primary" onClick={() => printReport(view)}><Icon name="download" size={16} /> Save as PDF</button>}
          </div>
        </>}
      </Modal>

      <Modal open={builder} onClose={() => setBuilder(false)}>
        <h2>Build a custom report</h2>
        <p className="muted">Pick the sections and period. We'll generate it instantly.</p><br />
        <label className="field"><span>Report name</span><input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
        <label className="field"><span>Period</span><select className="input" value={draft.period} onChange={(e) => setDraft({ ...draft, period: e.target.value })}><option>Last 30 days</option><option>Last quarter</option><option>Year to date</option></select></label>
        <div className="field"><span style={{ fontWeight: 500, fontSize: 13, display: "block", marginBottom: 8 }}>Sections</span>
          {SECTIONS.map((s) => (
            <label className="opt" key={s}><input type="checkbox" checked={draft.sections.includes(s)}
              onChange={(e) => setDraft({ ...draft, sections: e.target.checked ? [...draft.sections, s] : draft.sections.filter((x) => x !== s) })} /> {s}</label>
          ))}
        </div>
        <div className="modal-foot"><button className="btn btn-ghost" onClick={() => setBuilder(false)}>Cancel</button><button className="btn btn-primary" onClick={generate}>Generate report</button></div>
      </Modal>
    </>
  );
}

function ScheduleRow({ title, when, initial, onToggle }) {
  const [on, setOn] = useState(initial);
  return (
    <div className="list-item">
      <div className="grow"><b style={{ fontSize: 14 }}>{title}</b><small>{when}</small></div>
      <Switch checked={on} onChange={(v) => { setOn(v); onToggle(v); }} />
    </div>
  );
}
