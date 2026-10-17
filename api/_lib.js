/* Shared helpers for the Vercel server functions (files starting with "_" are not exposed as endpoints).
   Talks to Stripe and Supabase over plain HTTPS — no extra npm packages needed.

   Required Vercel environment variables (Project → Settings → Environment Variables):
     STRIPE_SECRET_KEY          sk_test_... (or sk_live_...)   — never expose in the browser
     STRIPE_WEBHOOK_SECRET      whsec_...                      — from the Stripe webhook endpoint
     SUPABASE_SERVICE_ROLE_KEY  service_role key               — server only, bypasses RLS
   Optional: SUPABASE_URL, SUPABASE_ANON_KEY (default to the project in .env). */

import crypto from "node:crypto";

export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://pnagluwtfgnumtiykhzw.supabase.co";
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_UDWJYqWo-tKtPrlwpwynzw_9hysj8Wh";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

export const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export function missingConfig() {
  const missing = [!STRIPE_KEY && "STRIPE_SECRET_KEY", !SERVICE_KEY && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean);
  return missing.length ? `Payments are not set up yet. Missing on Vercel: ${missing.join(", ")}` : null;
}

export const stripeMode = () => (STRIPE_KEY?.startsWith("sk_live") ? "live" : "test");

/** Call the Stripe API with form-encoded params. */
export async function stripe(path, params = {}, method = "POST") {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) body.append(k, String(v));
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${STRIPE_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: method === "GET" ? undefined : body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Stripe error ${res.status}`);
  return data;
}

/** Supabase REST call with the service-role key (server only). */
export async function db(path, { method = "GET", body } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.message || `Database error ${res.status}`);
  return data;
}

/** Resolve the signed-in Supabase user from the browser's access token. */
export async function userFromRequest(request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
  return res.ok ? res.json() : null;
}

/** Verify a Stripe webhook signature (Stripe-Signature header, HMAC-SHA256, 5-minute tolerance). */
export function verifyStripeSignature(rawBody, header, secret, toleranceSec = 300) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")).filter((p) => p.length === 2).map(([k, v]) => [k, v]));
  const signatures = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  const t = Number(parts.t);
  if (!t || !signatures.length || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`, "utf8").digest("hex");
  return signatures.some((sig) => sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)));
}
