/* Simulated checkout shown only for demo accounts (no Stripe call, no money). */
import { useState } from "react";
import Icon from "./Icon";
import { Modal } from "./ui";
import { formatAmount } from "../lib/payments";

export function DemoPaymentNote() {
  return (
    <div className="demo-note" style={{ marginBottom: 16, borderLeft: "3px solid var(--purple)" }}>
      <b>Demo account — payments are simulated.</b> “Pay” opens a practice checkout and no money is charged.
      To pay through the real Stripe checkout, log in with a real account (not the demo buttons) after the Stripe keys are added in Vercel.
    </div>
  );
}

export default function DemoCheckout({ invoice, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  if (!invoice) return null;
  const pay = async () => { setBusy(true); await onConfirm(invoice); setBusy(false); onClose(); };
  return (
    <Modal open onClose={onClose}>
      <span className="sample-pill">DEMO — no money will be charged</span>
      <h2 style={{ marginTop: 12 }}>Practice checkout</h2>
      <p className="muted">With a real account, this step is Stripe's secure payment page.</p><br />
      <div className="list">
        <div className="list-item"><span className="grow">{invoice.number} · {invoice.description}</span><b>{formatAmount(invoice.amount_cents, invoice.currency)}</b></div>
      </div>
      <label className="field" style={{ marginTop: 14 }}><span>Card number (demo)</span><input className="input" value="4242 4242 4242 4242" readOnly /></label>
      <div className="row-2">
        <label className="field"><span>Expiry</span><input className="input" value="12 / 34" readOnly /></label>
        <label className="field"><span>CVC</span><input className="input" value="123" readOnly /></label>
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={pay} disabled={busy}><Icon name="card" size={16} /> {busy ? "Processing…" : `Simulate payment of ${formatAmount(invoice.amount_cents, invoice.currency)}`}</button>
      </div>
    </Modal>
  );
}
