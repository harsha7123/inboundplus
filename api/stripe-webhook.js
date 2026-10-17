/* POST /api/stripe-webhook
   Stripe calls this after a payment. We verify the signature, then mark the invoice as Paid.
   In Stripe: Developers → Webhooks → Add endpoint → https://<your-site>/api/stripe-webhook
   Events: checkout.session.completed, checkout.session.async_payment_succeeded */

import { db, json, verifyStripeSignature } from "./_lib.js";

export async function POST(request) {
  const raw = await request.text();
  if (!verifyStripeSignature(raw, request.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET)) {
    return json({ error: "Invalid signature" }, 400);
  }

  const event = JSON.parse(raw);
  const paidEvents = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
  if (!paidEvents.includes(event.type)) return json({ received: true, ignored: event.type });

  const session = event.data.object;
  const invoiceId = session.metadata?.invoice_id || session.client_reference_id;
  if (!invoiceId || session.payment_status !== "paid") return json({ received: true, pending: true });

  try {
    await db(`invoices?id=eq.${encodeURIComponent(invoiceId)}`, {
      method: "PATCH",
      body: {
        status: "Paid",
        paid_at: new Date((event.created || Date.now() / 1000) * 1000).toISOString(),
        payer_email: session.customer_details?.email || session.customer_email || null,
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent || null,
      },
    });
    return json({ received: true, invoice: invoiceId });
  } catch (e) {
    // a non-2xx makes Stripe retry later
    return json({ error: e.message }, 500);
  }
}
