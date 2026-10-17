/* POST /api/create-checkout  { invoiceId, returnPath }
   Creates a Stripe Checkout page for an invoice and returns its URL.
   The amount always comes from the database, never from the browser. */

import { db, json, missingConfig, stripe, userFromRequest } from "./_lib.js";

export async function POST(request) {
  const notReady = missingConfig();
  if (notReady) return json({ error: notReady }, 501);

  try {
    const user = await userFromRequest(request);
    if (!user) return json({ error: "Please log in again." }, 401);

    const { invoiceId, returnPath } = await request.json();
    if (!invoiceId) return json({ error: "Missing invoice." }, 400);

    const [invoice] = await db(`invoices?id=eq.${encodeURIComponent(invoiceId)}&select=*`);
    if (!invoice) return json({ error: "Invoice not found." }, 404);
    if (invoice.status !== "Due") return json({ error: `This invoice is ${invoice.status.toLowerCase()}.` }, 400);

    const [profile] = await db(`profiles?id=eq.${user.id}&select=role,org_id`);
    const allowed = profile && (profile.role === "admin" || profile.org_id === invoice.org_id);
    if (!allowed) return json({ error: "You can't pay this invoice." }, 403);

    const origin = request.headers.get("origin") || new URL(request.url).origin;
    const back = typeof returnPath === "string" && returnPath.startsWith("/") && !returnPath.startsWith("//") ? returnPath : "/portal/billing";
    const sep = back.includes("?") ? "&" : "?";

    const session = await stripe("checkout/sessions", {
      mode: "payment",
      "line_items[0][quantity]": 1,
      "line_items[0][price_data][currency]": invoice.currency.toLowerCase(),
      "line_items[0][price_data][unit_amount]": invoice.amount_cents,
      "line_items[0][price_data][product_data][name]": `${invoice.number || "Invoice"} — ${invoice.description}`,
      customer_email: user.email,
      client_reference_id: invoice.id,
      "metadata[invoice_id]": invoice.id,
      "metadata[org_id]": invoice.org_id,
      "payment_intent_data[metadata][invoice_id]": invoice.id,
      "payment_intent_data[description]": `InboundPlus ${invoice.number || ""} ${invoice.description}`.trim(),
      success_url: `${origin}${back}${sep}paid=${invoice.id}`,
      cancel_url: `${origin}${back}${sep}canceled=1`,
    });

    await db(`invoices?id=eq.${invoice.id}`, { method: "PATCH", body: { stripe_session_id: session.id } });
    return json({ url: session.url });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
