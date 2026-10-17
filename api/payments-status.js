/* GET /api/payments-status — tells the admin page whether Stripe is connected and in which mode. */

import { json, missingConfig, stripe, stripeMode } from "./_lib.js";

export async function GET() {
  const notReady = missingConfig();
  if (notReady) return json({ connected: false, message: notReady });
  try {
    const account = await stripe("account", {}, "GET");
    return json({
      connected: true,
      mode: stripeMode(),
      account: account.settings?.dashboard?.display_name || account.business_profile?.name || account.email || account.id,
      webhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    });
  } catch (e) {
    return json({ connected: false, message: e.message });
  }
}
