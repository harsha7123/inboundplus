-- =====================================================================
-- InboundPlus Client Hub — migration 003: invoices & Stripe payments
-- Run AFTER schema.sql and 002 (Supabase → SQL Editor → paste → Run). Safe to run again.
-- Invoices are created by admins. Clients can read their own invoices and pay them via Stripe.
-- Only the server (Stripe webhook, using the service-role key) marks invoices as paid.
-- =====================================================================

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  number text,
  description text not null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'USD',
  status text not null default 'Due',          -- Due | Paid | Void
  due_date date,
  paid_at timestamptz,
  payer_email text,
  stripe_session_id text,
  stripe_payment_intent text,
  created_at timestamptz not null default now()
);

alter table public.invoices enable row level security;

drop policy if exists "invoices read" on public.invoices;
drop policy if exists "invoices admin" on public.invoices;
create policy "invoices read"  on public.invoices for select using (public.is_admin() or org_id = public.my_org());
create policy "invoices admin" on public.invoices for all using (public.is_admin()) with check (public.is_admin());
