import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import { Empty } from "../../components/shared";
import { PageHead, Panel, Segmented, StatusBadge } from "../../components/ui";
import { useAgency } from "../../lib/useAgency";
import { fmtDate } from "../../lib/useData";
import { money } from "../../lib/utils";
import { HealthBadge, NewClientModal, StagePill } from "./agencySections";

const COLS = [
  ["Client", (c) => c.name], ["Stage", (c) => c.stage || ""], ["Package", (c) => c.plan], ["MRR", (c) => c.mrr], ["Health", (c) => c.health.score],
  ["Agents live", (c) => c.agentsLive], ["Open requests", (c) => c.openRequests], ["Manager", (c) => c.manager || ""], ["Renewal", (c) => c.renewal_date || "9999"],
];

export default function Clients() {
  const nav = useNavigate();
  const { clients, loading } = useAgency();
  const [q, setQ] = useState(""), [view, setView] = useState("All"), [sort, setSort] = useState([4, 1]), [adding, setAdding] = useState(false);

  const list = clients
    .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
    .filter((c) => view === "All" || (view === "Live" ? c.stage === "Live" : view === "Onboarding" ? c.stage !== "Live" : c.health.band !== "Healthy"))
    .sort((a, b) => { const f = COLS[sort[0]][1]; return (f(a) > f(b) ? 1 : f(a) < f(b) ? -1 : 0) * sort[1]; });

  return (
    <>
      <PageHead title="Clients" sub="The InboundPlus client portfolio — stage, revenue, health and AI agents for every account.">
        <input className="input" style={{ maxWidth: 220 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter clients…" />
        <button className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={16} /> New client</button>
      </PageHead>
      <Panel actions={<Segmented value={view} onChange={setView} options={["All", "Live", "Onboarding", "Needs attention"]} />} title={`${list.length} client${list.length === 1 ? "" : "s"}`}>
        {list.length ? (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr>{COLS.map(([h], i) => (
              <th key={h} className={i === 3 || i === 5 || i === 6 ? "num" : ""} onClick={() => setSort([i, sort[0] === i ? -sort[1] : 1])}>{h} {sort[0] === i ? (sort[1] > 0 ? "↑" : "↓") : ""}</th>
            ))}</tr></thead>
            <tbody>{list.map((c) => (
              <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => nav(`/admin/clients/${c.id}`)}>
                <td><div className="flex"><div className="avatar sm">{c.name.slice(0, 2).toUpperCase()}</div><div><b>{c.name}</b><small className="muted" style={{ display: "block" }}>{c.industry || c.platform || "—"}</small></div></div></td>
                <td><StagePill stage={c.stage} /></td>
                <td>{c.plan}</td>
                <td className="num">{c.mrr ? money(c.mrr) : <span className="muted">One-time</span>}</td>
                <td><HealthBadge health={c.health} /></td>
                <td className="num">{c.agentsLive}/{c.agentsTotal}</td>
                <td className="num">{c.openRequests ? <span className="badge blue">{c.openRequests}</span> : 0}</td>
                <td>{c.manager || "—"}</td>
                <td>{c.renewal_date ? fmtDate(c.renewal_date) : "—"}</td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : !loading && <Empty icon="users" title="No clients found" text="Clients appear when they register, or add one with “New client”." />}
      </Panel>
      <NewClientModal open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

export { StatusBadge };
