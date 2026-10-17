/* Admin: invoices and Stripe payments. InvoicesSection is reused on each client's page. */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "../../components/Icon";
import { Empty } from "../../components/shared";
import { Kpi, Modal, PageHead, Panel, Segmented, StatusBadge } from "../../components/ui";
import { useIsland } from "../../context/IslandContext";
import { CURRENCIES, formatAmount, payInvoice, paymentsStatus, stripePaymentUrl } from "../../lib/payments";
import { ago, fmtDate, useDb, useOrgs, useTable } from "../../lib/useData";

/** Stripe connection banner (shared by the page and client tabs). */
export function useStripeStatus() {
  const db = useDb();
  const [status, setStatus] = useState(null);
  useEffect(() => { paymentsStatus(db).then(setStatus); }, [db]);
  return status;
}

function StripeBanner({ status }) {
  if (!status) return null;
  if (status.demo) return <div className="demo-note" style={{ marginBottom: 16 }}><b>Demo mode:</b> “Pay” simulates a successful payment. Log in with a real admin account to use Stripe.</div>;
  if (!status.connected) return (
    <div className="panel" style={{ marginBottom: 16, borderColor: "var(--amber)" }}>
      <b>Stripe is not connected yet.</b>
      <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>{status.message} — see PAYMENTS.md in the project for the 10-minute setup.</p>
    </div>
  );
  return (
    <div className="flex wrap-gap" style={{ marginBottom: 16 }}>
      <span className="badge green"><span className="dot" />Stripe connected · {status.account}</span>
      <span className={`badge ${status.mode === "live" ? "red" : "amber"}`}>{status.mode === "live" ? "LIVE mode — real money" : "Test mode — no real money"}</span>
      {!status.webhook && <span className="badge red">Webhook secret missing — payments won't be marked Paid</span>}
    </div>
  );
}

export function InvoicesSection({ orgId, status, returnPath = "/admin/payments" }) {
  const db = useDb(); const island = useIsland();
  const orgs = useOrgs().rows;
  const { rows, reload } = useTable("invoices", orgId);
  const [filter, setFilter] = useState("All");
  const [add, setAdd] = useState(null);
  const [paying, setPaying] = useState(null);
  const orgName = (id) => orgs.find((o) => o.id === id)?.name || "—";

  // refresh every 8 s while any invoice is due, so a completed Stripe payment shows up without reloading
  useEffect(() => {
    if (db.kind !== "remote" || !rows.some((r) => r.status === "Due")) return;
    const t = setInterval(reload, 8000);
    return () => clearInterval(t);
  }, [db.kind, rows, reload]);

  const create = async () => {
    const cents = Math.round(parseFloat(add.amount) * 100);
    if (!add.org_id) return island.notify("Choose a client", { icon: "x" });
    if (!add.description.trim()) return island.notify("Add a description", { icon: "x" });
    if (!(cents >= 50)) return island.notify("Amount must be at least 0.50", { icon: "x" });
    try {
      await db.insert("invoices", { org_id: add.org_id, number: add.number.trim() || null, description: add.description.trim(), amount_cents: cents, currency: add.currency, status: "Due", due_date: add.due_date || null });
      island.notify(`Invoice for ${formatAmount(cents, add.currency)} sent to ${orgName(add.org_id)}`, { icon: "card" }); setAdd(null);
    } catch (e) { island.notify(e.message.includes("invoices") ? "Run supabase/003_invoices_payments.sql first" : "Could not create: " + e.message, { icon: "x" }); }
  };
  const pay = async (inv) => {
    setPaying(inv.id);
    const job = island.notify("Opening secure Stripe checkout…", { icon: "card", progress: true, persist: true });
    try {
      const r = await payInvoice(db, inv, returnPath);
      if (r.simulated) job.done(`Payment received: ${formatAmount(inv.amount_cents, inv.currency)}`);
    } catch (e) { job.done(e.message); }
    setPaying(null);
  };
  const setStatus = async (inv, s) => { await db.update("invoices", inv.id, s === "Paid" ? { status: s, paid_at: new Date().toISOString() } : { status: s }); island.notify(`Invoice marked ${s}`, { icon: "card" }); };

  const list = rows.filter((r) => filter === "All" || r.status === filter);
  const nextNumber = `INV-${new Date().getFullYear()}-${String(rows.length + 1).padStart(4, "0")}`;

  return (
    <Panel title="Invoices" sub={orgId ? "Invoices for this client — they can pay them from their portal" : "All clients"}
      actions={<div className="flex wrap-gap">
        <Segmented value={filter} onChange={setFilter} options={["All", "Due", "Paid", "Void"]} />
        <button className="btn btn-sm btn-primary" onClick={() => setAdd({ org_id: orgId || orgs[0]?.id || "", number: nextNumber, description: "", amount: "", currency: "USD", due_date: "" })}><Icon name="plus" size={14} /> New invoice</button>
      </div>}>
      {list.length ? (
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr>{["Invoice", !orgId && "Client", "Description", "Amount", "Status", "Paid", ""].filter((x) => x !== false).map((h, i) => <th key={i} className={`nosort ${h === "Amount" ? "num" : ""}`}>{h}</th>)}</tr></thead>
          <tbody>{list.map((inv) => {
            const link = stripePaymentUrl(inv, status?.mode);
            return (
              <tr key={inv.id}>
                <td><b>{inv.number || "—"}</b><small className="muted" style={{ display: "block" }}>{fmtDate(inv.created_at)}</small></td>
                {!orgId && <td>{orgName(inv.org_id)}</td>}
                <td>{inv.description}</td>
                <td className="num"><b>{formatAmount(inv.amount_cents, inv.currency)}</b></td>
                <td><StatusBadge s={inv.status} /></td>
                <td>{inv.paid_at ? <>{ago(inv.paid_at)}<small className="muted" style={{ display: "block" }}>{inv.payer_email}</small></> : <span className="muted">—</span>}</td>
                <td><div className="flex" style={{ gap: 6, justifyContent: "flex-end" }}>
                  {inv.status === "Due" && <button className="btn btn-sm btn-primary" disabled={paying === inv.id} onClick={() => pay(inv)} title="Pay with Stripe (use a test card in test mode)">Pay</button>}
                  {link && <a className="btn btn-sm btn-ghost" href={link} target="_blank" rel="noopener noreferrer">Stripe ↗</a>}
                  {inv.status === "Due" && <button className="btn btn-sm btn-ghost" onClick={() => setStatus(inv, "Void")}>Void</button>}
                </div></td>
              </tr>
            );
          })}</tbody>
        </table></div>
      ) : <Empty icon="card" title="No invoices yet" text="Create an invoice and the client can pay it by card from their portal." />}

      <Modal open={!!add} onClose={() => setAdd(null)}>
        {add && <>
          <h2>New invoice</h2>
          <p className="muted">The client sees it in Billing and can pay by card, Apple Pay or Google Pay through Stripe.</p><br />
          {!orgId && <label className="field"><span>Client</span><select className="input" value={add.org_id} onChange={(e) => setAdd({ ...add, org_id: e.target.value })}>{orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>}
          <div className="row-2">
            <label className="field"><span>Invoice number</span><input className="input" value={add.number} onChange={(e) => setAdd({ ...add, number: e.target.value })} /></label>
            <label className="field"><span>Due date</span><input className="input" type="date" value={add.due_date} onChange={(e) => setAdd({ ...add, due_date: e.target.value })} /></label>
          </div>
          <label className="field"><span>Description</span><input className="input" value={add.description} onChange={(e) => setAdd({ ...add, description: e.target.value })} placeholder="Ecommerce Growth Advisory – November" autoFocus /></label>
          <div className="row-2">
            <label className="field"><span>Amount</span><input className="input" type="number" min="0.5" step="0.01" value={add.amount} onChange={(e) => setAdd({ ...add, amount: e.target.value })} placeholder="3000.00" /></label>
            <label className="field"><span>Currency</span><select className="input" value={add.currency} onChange={(e) => setAdd({ ...add, currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          </div>
          <div className="modal-foot"><button className="btn btn-ghost" onClick={() => setAdd(null)}>Cancel</button><button className="btn btn-primary" onClick={create}>Create invoice</button></div>
        </>}
      </Modal>
    </Panel>
  );
}

export default function Payments() {
  const status = useStripeStatus();
  const island = useIsland();
  const [params, setParams] = useSearchParams();
  const rows = useTable("invoices", null).rows;

  useEffect(() => {
    if (params.get("paid")) island.notify("Payment completed — waiting for Stripe confirmation…", { icon: "card" });
    if (params.get("canceled")) island.notify("Checkout canceled", { icon: "x" });
    if (params.get("paid") || params.get("canceled")) setParams({}, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const usd = (r) => r.currency === "USD";
  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString();
  const sumCents = (list) => list.filter(usd).reduce((s, r) => s + r.amount_cents, 0);
  const paid = rows.filter((r) => r.status === "Paid"), due = rows.filter((r) => r.status === "Due");

  return (
    <>
      <PageHead title="Billing & payments" sub="Invoice clients and get paid by card worldwide through Stripe." />
      <StripeBanner status={status} />
      <div className="kpis">
        <Kpi label="Collected (USD)" value={formatAmount(sumCents(paid))} icon="card" />
        <Kpi label="Outstanding (USD)" value={formatAmount(sumCents(due))} icon="calendar" />
        <Kpi label="Paid in last 30 days" value={paid.filter((r) => r.paid_at > monthAgo).length} icon="check" />
        <Kpi label="Open invoices" value={due.length} icon="report" />
      </div>
      <InvoicesSection orgId={null} status={status} />
      <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>Test mode: pay with card 4242 4242 4242 4242, any future date, any CVC. Each payment also appears in your Stripe Dashboard → Payments.</p>
    </>
  );
}
