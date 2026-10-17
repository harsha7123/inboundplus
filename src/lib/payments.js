/* Front-end side of Stripe payments.
   Live (Supabase) accounts: ask our Vercel function for a Stripe Checkout URL and redirect there.
   Demo accounts: simulate the payment locally so the flow can be shown without Stripe. */

import { supabase } from "./supabase";

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];

export const formatAmount = (cents, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);

/** Start paying an invoice. Returns { redirected } or { simulated } ; throws with a readable message. */
export async function payInvoice(db, invoice, returnPath) {
  if (db.kind === "local") {
    await new Promise((r) => setTimeout(r, 1200));
    await db.update("invoices", invoice.id, { status: "Paid", paid_at: new Date().toISOString(), payer_email: "demo@payer.example", stripe_payment_intent: "pi_demo_" + Date.now() });
    return { simulated: true };
  }
  const { data } = await supabase.auth.getSession();
  const res = await fetch("/api/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}` },
    body: JSON.stringify({ invoiceId: invoice.id, returnPath }),
  });
  let body = {};
  try { body = await res.json(); } catch { /* not JSON */ }
  if (!res.ok || !body.url) throw new Error(body.error || `Payment service unavailable (${res.status}). Is the site deployed on Vercel?`);
  window.location.assign(body.url);
  return { redirected: true };
}

/** Stripe connection status for the admin page. */
export async function paymentsStatus(db) {
  if (db.kind === "local") return { connected: false, demo: true, message: "Demo mode — payments are simulated." };
  try {
    const res = await fetch("/api/payments-status");
    return await res.json();
  } catch {
    return { connected: false, message: "Payment service not reachable." };
  }
}

export const stripePaymentUrl = (inv, mode = "test") =>
  inv.stripe_payment_intent && !inv.stripe_payment_intent.startsWith("pi_demo")
    ? `https://dashboard.stripe.com/${mode === "live" ? "" : "test/"}payments/${inv.stripe_payment_intent}`
    : null;
