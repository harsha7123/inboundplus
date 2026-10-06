import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, PageHead, Panel, Progress, StatusBadge, Tilt } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import D from "../../data";
import { money, sum } from "../../lib/utils";

export default function Billing() {
  const { session } = useAuth();
  const nav = useNavigate();
  const [inv, setInv] = useState(null);
  const [plans, setPlans] = useState(false);
  const r = D.client.retainer;
  const due = sum(D.invoices.filter((i) => i.status === "Due").map((i) => i.amount));

  return (
    <>
      <PageHead title="Billing" sub="Your plan, retainer hours and invoices." />
      <div className="grid g-3">
        <Tilt className="panel">
          <small className="muted">Current plan</small>
          <h3 style={{ margin: "6px 0", fontSize: 20, color: "var(--navy)" }}>{D.client.plan}</h3>
          <p className="muted" style={{ fontSize: 14 }}>{D.client.planTerm} · billed monthly (sample)</p>
          <button className="btn btn-sm btn-ghost" style={{ marginTop: 14 }} onClick={() => setPlans(true)}>Compare plans</button>
        </Tilt>
        <Tilt className="panel">
          <small className="muted">Retainer hours (October)</small>
          <div style={{ fontSize: 28, fontWeight: 600, color: "var(--navy)", margin: "6px 0" }}>{r.used} / {r.hours} h</div>
          <Progress value={(r.used / r.hours) * 100} />
          <small className="muted">{r.hours - r.used} hours remaining · resets Nov 1</small>
        </Tilt>
        <Tilt className="panel">
          <small className="muted">Balance due</small>
          <div style={{ fontSize: 28, fontWeight: 600, color: "var(--amber)", margin: "6px 0" }}>{money(due)}</div>
          <small className="muted">Due Oct 15, 2026 · Bank transfer or card</small>
        </Tilt>
      </div>
      <Panel title="Invoices">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>{["Invoice", "Date", "Description", "Amount", "Status", ""].map((h, i) => <th key={i} className={`nosort ${i === 3 ? "num" : ""}`}>{h}</th>)}</tr></thead>
            <tbody>{D.invoices.map((i) => (
              <tr key={i.id}><td><b>{i.id}</b></td><td>{i.date}</td><td>{i.desc}</td><td className="num">{money(i.amount)}</td><td><StatusBadge s={i.status} /></td>
                <td><button className="btn btn-sm btn-ghost" onClick={() => setInv(i)}>View</button></td></tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>

      <Modal open={!!inv} onClose={() => setInv(null)}>
        {inv && <>
          <h2>{inv.id}</h2><p className="muted">{inv.date} · {session.company}</p><br />
          <div className="list">
            <div className="list-item"><span className="grow">{inv.desc}</span><b>{money(inv.amount)}</b></div>
            <div className="list-item"><span className="grow">Tax</span><b>$0</b></div>
            <div className="list-item"><b className="grow">Total</b><b>{money(inv.amount)}</b></div>
          </div>
          <div className="modal-foot"><button className="btn btn-primary" onClick={() => setInv(null)}>Close</button></div>
        </>}
      </Modal>

      <Modal open={plans} onClose={() => setPlans(false)}>
        <h2>Plans</h2><p className="muted">Contact your account manager to change plans.</p><br />
        <div className="list">{D.plans.map((p) => (
          <div className="list-item" key={p.name}><b className="grow">{p.name}</b><span>{p.price} {p.billing.replace("from · ", "")}</span>{p.name === D.client.plan && <StatusBadge s="Active" />}</div>
        ))}</div>
        <div className="modal-foot"><button className="btn btn-ghost" onClick={() => setPlans(false)}>Close</button><button className="btn btn-primary" onClick={() => nav("/portal/messages")}>Message account manager</button></div>
      </Modal>
    </>
  );
}
