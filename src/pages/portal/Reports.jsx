import { useState } from "react";
import Icon from "../../components/Icon";
import { Modal, PageHead, Panel, Segmented, Switch } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useIsland } from "../../context/IslandContext";
import { usePortal } from "../../context/PortalContext";
import D from "../../data";
import { money, pct, sum } from "../../lib/utils";

const SECTIONS = ["Sales & revenue", "Traffic & conversion", "SEO", "Paid ads", "AI agents", "Deployments"];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function sectionText(s, state) {
  const A = D.analytics, n = A.revenue.length;
  return {
    "Sales & revenue": `Revenue reached ${money(A.revenue[n - 1])} (+${pct(A.revenue[n - 1], A.revenue[n - 2]).toFixed(1)}%), with ${A.orders[n - 1].toLocaleString()} orders and an AOV of $${A.aov[n - 1]}.`,
    "Traffic & conversion": `${A.sessions[n - 1].toLocaleString()} sessions; conversion rate ${A.convRate[n - 1]}%. Mobile is 68% of traffic.`,
    SEO: `Site health ${D.seo.health}/100. 5 of 8 tracked keywords improved; “zapatillas trail running” now ranks #3.`,
    "Paid ads": "Blended ROAS 4.6×. Meta Retargeting is the top performer at 6.9×; TikTok Awareness recommended for pause.",
    "AI agents": `Agents handled ${sum(state.agents.map((a) => a.convos)).toLocaleString()} conversations and saved ${sum(state.agents.map((a) => a.saved))} team hours.`,
    Deployments: `${state.deployments.length} releases logged; latest: ${state.deployments[0].app} ${state.deployments[0].version}.`,
  }[s];
}

export default function Reports() {
  const { state, update } = usePortal();
  const { session } = useAuth();
  const island = useIsland();
  const [type, setType] = useState("All");
  const [view, setView] = useState(null);
  const [builder, setBuilder] = useState(false);
  const [draft, setDraft] = useState({ name: "", period: "Last 30 days", sections: SECTIONS.slice(0, 4) });
  const secs = (r) => r.sections || SECTIONS.slice(0, 4);

  const printReport = (r) => {
    const w = window.open("", "_blank");
    if (!w) return island.notify("Allow pop-ups to save the PDF", { icon: "x" });
    const body = secs(r).map((s) => `<h3>${esc(s)}</h3><p>${esc(sectionText(s, state))}</p>`).join("");
    w.document.write(`<!doctype html><html><head><title>${esc(r.name)}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,Inter,Segoe UI,sans-serif;color:#0c1115;max-width:720px;margin:40px auto;padding:0 20px;font-weight:400}h1{color:#f26b35;font-weight:600}h3{font-weight:500}.top{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #f26b35;padding-bottom:12px;margin-bottom:20px}</style></head><body><div class="top"><img src="${location.origin}/img/logo.png" style="height:28px" alt="InboundPlus"><span>${esc(session.company)}</span></div><h1>${esc(r.name)}</h1><p>${esc(r.type)} report · ${esc(r.date)}</p>${body}<p style="margin-top:40px;color:#64748b;font-size:12px">Prototype report with sample data.</p><script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  };

  const generate = () => {
    if (!draft.sections.length) return island.notify("Pick at least one section", { icon: "x" });
    const r = { id: "r" + Date.now(), name: draft.name.trim() || "Custom report", type: "Custom", date: "Today", pages: 2 + draft.sections.length * 2, sections: draft.sections };
    update("reports", (rs) => [r, ...rs]); setBuilder(false); setType("All"); setView(r);
    island.notify("Report generated", { icon: "report" });
  };

  const openBuilder = () => {
    setDraft({ name: `Custom report – ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, period: "Last 30 days", sections: SECTIONS.slice(0, 4) });
    setBuilder(true);
  };

  const list = state.reports.filter((r) => type === "All" || r.type === type);
  return (
    <>
      <PageHead title="Reports" sub="Monthly, quarterly and custom reports — view online or save as PDF.">
        <button className="btn btn-primary" onClick={openBuilder}><Icon name="plus" size={16} /> Build custom report</button>
      </PageHead>
      <div className="grid g-21">
        <Panel title="Report library" actions={<Segmented value={type} onChange={setType} options={[{ value: "All", label: "All" }, { value: "Monthly", label: "Monthly" }, { value: "Quarterly", label: "Quarterly" }, { value: "Audit", label: "Audits" }]} />}>
          <div className="list">
            {list.length ? list.map((r) => (
              <div className="list-item fade-in" key={r.id}>
                <div className="file-ico pdf">PDF</div>
                <div className="grow"><b style={{ fontSize: 14 }}>{r.name}</b><small>{r.type} · {r.date} · {r.pages} pages</small></div>
                <button className="btn btn-sm btn-ghost" onClick={() => setView(r)}><Icon name="eye" size={15} /> View</button>
                <button className="btn btn-sm btn-ghost" onClick={() => printReport(r)}><Icon name="download" size={15} /> PDF</button>
              </div>
            )) : <div className="empty">No reports of this type yet.</div>}
          </div>
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
          <p className="muted">{session.company} · {view.date}</p>
          {secs(view).map((s) => <div key={s}><h3 style={{ margin: "16px 0 6px", fontSize: 15 }}>{s}</h3><p style={{ fontSize: 14 }}>{sectionText(s, state)}</p></div>)}
          <div className="modal-foot"><button className="btn btn-ghost" onClick={() => setView(null)}>Close</button><button className="btn btn-primary" onClick={() => printReport(view)}><Icon name="download" size={16} /> Save as PDF</button></div>
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
