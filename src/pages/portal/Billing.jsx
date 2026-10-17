import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "../../components/Icon";
import { Empty } from "../../components/shared";
import { Modal, PageHead, Panel, Progress, StatusBadge, Tilt } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { useIsland } from "../../context/IslandContext";
import D from "../../data";
import { formatAmount, payInvoice } from "../../lib/payments";
import { fmtDate, useDb, useTable } from "../../lib/useData";

export default function Billing() {
  const { session } = useAuth();
  const db = useDb(); const island = useIsland(); const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const { rows, reload } = useTable("invoices", session.orgId || undefined);
  const [inv, setInv] = useState(null), [plans, setPlans] = useState(false), [paying, setPaying] = useState(null);
  const r = D.client.retainer;

  // Returning from Stripe Checkout: confirm, then refresh until the webhook marks the invoice Paid.
  useEffect(() => {
    const paidId = params.get("paid");
    if (params.get("canceled")) { island.notify("Payment canceled — nothing was charged", { icon: "x" }); setParams({}, { replace: true }); }
    if (!paidId) return;
    setParams({}, { replace: true });
    const job = island.notify("Payment received — confirming with Stripe…", { icon: "card", progress: true, persist: true, pct: 30 });
    let tries = 0;
    const t = setInterval(async () => {
      tries++;
      const list = await db.list("invoices", session.orgId);
      const row = list.find((x) => x.id === paidId);
      if (row?.status === "Paid") { clearInterval(t); reload(); job.done(`Paid ${formatAmount(row.amount_cents, row.currency)} — thank you!`); }
      else if (tries >= 10) { clearInterval(t); reload(); job.done("Payment received. Your invoice will update shortly."); }
      else job.update(null, 30 + tries * 7);
    }, 2000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pay = async (invoice) => {
    setPaying(invoice.id);
    const job = island.notify("Opening secure Stripe checkout…", { icon: "card", progress: true, persist: true, pct: 40 });
    try {
      const res = await payInvoice(db, invoice, "/portal/billing");
      if (res.simulated) job.done(`Paid ${formatAmount(invoice.amount_cents, invoice.currency)} (demo)`);
    } catch (e) { job.done(e.message); }
    setPaying(null);
  };

  const due = rows.filter((x) => x.status === "Due");
  const dueTotal = due.length ? formatAmount(due.reduce((s, x) => s + (x.currency === due[0].currency ? x.amount_cents : 0), 0), due[0].currency) : formatAmount(0);

  return (
    <>
      <PageHead title="Billing" sub="Your plan, retainer hours and invoices. Pay securely by card through Stripe." />
      <div className="grid g-3">
        <Tilt className="panel">
          <small className="muted">Current plan</small>
          <h3 style={{ margin: "6px 0", fontSize: 20, color: "var(--navy)" }}>{D.client.plan}</h3>
          <p className="muted" style={{ fontSize: 14 }}>{D.client.planTerm}</p>
          <button className="btn btn-sm btn-ghost" style={{ marginTop: 14 }} onClick={() => setPlans(true)}>Compare plans</button>
        </Tilt>
        <Tilt className="panel">
          <small className="muted">Retainer hours (October)</small>
          <div style={{ fontSize: 28, fontWeight: 600, color: "var(--navy)", margin: "6px 0" }}>{r.used} / {r.hours} h</div>
          <Progress value={(r.used / r.hours) * 100} />
          <small className="muted">{r.hours - r.used} hours remaining · sample</small>
        </Tilt>
        <Tilt className="panel">
          <small className="muted">Balance due</small>
          <div style={{ fontSize: 28, fontWeight: 600, color: due.length ? "var(--amber)" : "var(--green)", margin: "6px 0" }}>{dueTotal}</div>
          <small className="muted">{due.length ? `${due.length} open invoice${due.length > 1 ? "s" : ""} · card, Apple Pay, Google Pay` : "All paid — thank you!"}</small>
          {due.length > 0 && <div style={{ marginTop: 12 }}><button className="btn btn-sm btn-primary" disabled={!!paying} onClick={() => pay(due[0])}><Icon name="card" size={14} /> Pay {formatAmount(due[0].amount_cents, due[0].currency)} now</button></div>}
        </Tilt>
      </div>

      <Panel title="Invoices">
        {rows.length ? (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr>{["Invoice", "Date", "Description", "Amount", "Status", ""].map((h, i) => <th key={i} className={`nosort ${i === 3 ? "num" : ""}`}>{h}</th>)}</tr></thead>
            <tbody>{rows.map((x) => (
              <tr key={x.id}>
                <td><b>{x.number || "—"}</b></td><td>{fmtDate(x.created_at)}</td><td>{x.description}</td>
                <td className="num">{formatAmount(x.amount_cents, x.currency)}</td><td><StatusBadge s={x.status} /></td>
                <td><div className="flex" style={{ gap: 6, justifyContent: "flex-end" }}>
                  {x.status === "Due" && <button className="btn btn-sm btn-primary" disabled={!!paying} onClick={() => pay(x)}>{paying === x.id ? "Opening…" : "Pay now"}</button>}
                  <button className="btn btn-sm btn-ghost" onClick={() => setInv(x)}>View</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <Empty icon="card" title="No invoices yet" text="Invoices from InboundPlus will appear here." />}
        <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>🔒 Payments are processed by Stripe. InboundPlus never sees or stores your card details.</p>
      </Panel>

      <Modal open={!!inv} onClose={() => setInv(null)}>
        {inv && <>
          <div className="flex between"><h2>{inv.number || "Invoice"}</h2><StatusBadge s={inv.status} /></div>
          <p className="muted">{fmtDate(inv.created_at)} · {session.company}{inv.due_date ? ` · due ${fmtDate(inv.due_date)}` : ""}</p><br />
          <div className="list">
            <div className="list-item"><span className="grow">{inv.description}</span><b>{formatAmount(inv.amount_cents, inv.currency)}</b></div>
            <div className="list-item"><b className="grow">Total</b><b>{formatAmount(inv.amount_cents, inv.currency)}</b></div>
            {inv.paid_at && <div className="list-item"><span className="grow muted">Paid</span><span>{fmtDate(inv.paid_at)}{inv.payer_email ? ` · ${inv.payer_email}` : ""}</span></div>}
          </div>
          <div className="modal-foot">
            <button className="btn btn-ghost" onClick={() => setInv(null)}>Close</button>
            {inv.status === "Due" && <button className="btn btn-primary" onClick={() => { const x = inv; setInv(null); pay(x); }}><Icon name="card" size={16} /> Pay now</button>}
          </div>
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
