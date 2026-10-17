# Stripe payments: setup and test guide

This guide connects **your own Stripe account** to the InboundPlus Client Hub. You then create an invoice, pay it like a client would, and check that **you received the payment** in Stripe and in the admin portal.

Everything runs in **Stripe test mode**, so no real money moves. Switching to real payments later only means changing the keys (step 7).

---

## What you need
- A Stripe account. It's free at https://dashboard.stripe.com/register. Test mode works immediately, before the business is verified. To accept **real** payments later, Stripe has to verify a company in a supported country. InboundPlus can use its **US (Florida) company**, because Stripe does not currently offer accounts for companies registered in Peru.
- Access to the **Vercel** project (`inboundplus`) and the **Supabase** project.
- About 15 minutes.

---

## 1. Create the invoices table (Supabase, 1 min)
Supabase → **SQL Editor** → paste all of `supabase/003_invoices_payments.sql` → **Run**.

## 2. Get your Stripe test keys (2 min)
1. Log in to Stripe and turn on **Test mode** (the switch in the top right).
2. Go to **Developers → API keys** and copy the **Secret key** (`sk_test_…`).
   Keep it private: never paste it into chat, email or the website code.

## 3. Add the keys to Vercel (3 min)
Vercel → project **inboundplus** → **Settings → Environment Variables** → add each one for **Production** and **Preview**:

| Name | Value | Where to find it |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_…` | Stripe → Developers → API keys |
| `SUPABASE_SERVICE_ROLE_KEY` | the **service_role** / **secret** key | Supabase → Project Settings → API Keys (secret key, **not** the publishable one) |

Then redeploy: **Deployments → … on the latest → Redeploy**.

## 4. Create the Stripe webhook (3 min)
The webhook is how Stripe tells the portal that a payment succeeded.
1. Stripe (Test mode) → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://inboundplus.vercel.app/api/stripe-webhook`
3. Events to send: `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
4. Save, then click **Reveal** under **Signing secret** (`whsec_…`).
5. In Vercel, add `STRIPE_WEBHOOK_SECRET` = `whsec_…` and **redeploy** again.

## 5. Check the connection (1 min)
Log in to the site as an admin → **Billing & payments**. You should see:
- 🟢 **Stripe connected · *your account name***
- 🟠 **Test mode — no real money**

If it says "not connected", the message lists which variable is missing. Add it and redeploy.

## 6. Make a test payment and confirm you received it (5 min)
1. **Admin → Billing & payments → New invoice.** Choose a client, enter for example "Ecommerce Growth Advisory – Test" for **USD 25.00**, and click **Create invoice**.
2. Pay it in either of two ways:
   - **As the client:** log in as that client → **Billing → Pay now**, or
   - **As admin:** click **Pay** on the invoice row.
3. You're taken to Stripe's secure checkout. Use the test card:
   - Card number `4242 4242 4242 4242`, any future expiry date (e.g. 12/34), any CVC (e.g. 123), any name and postcode.
4. After paying, you return to the portal. The pill at the top of the screen confirms the payment, and within a few seconds the invoice shows **Paid**, with the time and the payer's email.
5. **Confirm you received it:**
   - Stripe Dashboard → **Payments**: the payment is listed with the invoice description.
   - Admin → **Billing & payments**: **Collected** goes up, and the invoice row has a **Stripe ↗** link that opens the payment in Stripe.

More test cards: `4000 0025 0000 3155` (asks for 3-D Secure authentication) and `4000 0000 0000 9995` (declined, to show an error).

## Live USD 10 test with the client's real Stripe account
Do this once the client's Stripe account is **activated**: business details verified and a bank account added for payouts.

1. **The client creates the live keys** in their Stripe account → switch **Test mode OFF** → **Developers → API keys** → copy the **Secret key** (`sk_live_…`).
   - Best practice: the client pastes it into Vercel themselves, or shares it once through a password manager. Never send it by email, WhatsApp or chat.
2. **The client creates a live webhook**: Stripe (Live mode) → **Developers → Webhooks → Add endpoint**
   - URL: `https://inboundplus.vercel.app/api/stripe-webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
   - Copy the **Signing secret** (`whsec_…`). Live and test webhooks have **different** secrets.
3. **Vercel** → project → **Settings → Environment Variables** → edit (or add) for **Production**:
   - `STRIPE_SECRET_KEY` = `sk_live_…`
   - `STRIPE_WEBHOOK_SECRET` = the **live** `whsec_…`
   - `SUPABASE_SERVICE_ROLE_KEY` stays the same.
4. **Redeploy**: Vercel → Deployments → latest → **⋯ → Redeploy**. Environment changes only apply after a redeploy.
5. **Check**: Admin → **Billing & payments** must show 🟢 *Stripe connected · client's business name* and 🔴 **LIVE mode — real money**.
6. **Create the test invoice**: **New invoice** → client → description "Live payment test" → **USD 10.00** → **Create invoice**.
7. **Pay it with a real card**: click **Pay**, or log in as that client → Billing → **Pay now**.
8. **Confirm with the client**:
   - The invoice turns **Paid** in the portal within a few seconds.
   - It appears in the client's **Stripe Dashboard → Payments** (Live mode), shows as USD 10.00 Succeeded, and the **Stripe ↗** link opens it.
   - Stripe pays it out to the client's bank account on their normal payout schedule.
9. **Refund the test if you want**: Stripe Dashboard → the payment → **Refund**. Stripe keeps its processing fee (about USD 0.59 for a USD 10 US card payment), so the refund returns USD 10.00 to the card, but the fee is not given back to the client's Stripe balance.

To go back to test mode, put the `sk_test_…` key and test `whsec_…` back into Vercel and redeploy.

## 7. Going live later
1. Finish Stripe's account activation (company details and bank account for payouts).
2. Switch Stripe to **Live mode** and create a live webhook with the same URL and events.
3. In Vercel, replace `STRIPE_SECRET_KEY` with `sk_live_…` and `STRIPE_WEBHOOK_SECRET` with the live `whsec_…`, then redeploy.
4. The admin page will show **LIVE mode — real money**.

---

## How it works (technical)
- `api/create-checkout.js` checks the logged-in user may pay the invoice, reads the **amount from the database** (never from the browser), and creates a Stripe Checkout Session.
- `api/stripe-webhook.js` verifies Stripe's signature, then marks the invoice **Paid** using the service-role key. Clients can never mark invoices paid themselves.
- `api/payments-status.js` shows the admin whether Stripe is connected and in which mode.
- Card details go straight to Stripe. They never touch InboundPlus servers.
- Supported invoice currencies in the UI are USD, EUR, GBP, CAD and AUD. Stripe Checkout shows card, Apple Pay, Google Pay and Link where available.
