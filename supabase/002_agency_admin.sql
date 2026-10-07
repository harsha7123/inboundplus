-- =====================================================================
-- InboundPlus Client Hub — migration 002: agency admin features
-- Run AFTER schema.sql (Supabase → SQL Editor → paste → Run). Safe to run again.
-- Adds: client lifecycle fields, onboarding checklists, AI agent deployments.
-- =====================================================================

-- Client lifecycle and commercial fields
alter table public.organizations add column if not exists stage text default 'Signed';      -- Signed | Kickoff | Access & assets | Setup | Launch | Live
alter table public.organizations add column if not exists manager text;                      -- account manager
alter table public.organizations add column if not exists mrr numeric default 0;             -- monthly recurring revenue (USD)
alter table public.organizations add column if not exists industry text;
alter table public.organizations add column if not exists contact_name text;
alter table public.organizations add column if not exists contact_email text;
alter table public.organizations add column if not exists start_date date;
alter table public.organizations add column if not exists renewal_date date;

-- Onboarding checklist items per client
create table if not exists public.onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  section text not null,
  title text not null,
  done boolean not null default false,
  position int default 0,
  created_at timestamptz not null default now()
);

-- AI agents deployed for each client
create table if not exists public.agent_deployments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  agent_key text not null,
  channel text,
  status text not null default 'Setup',                -- Setup | Testing | Live | Paused
  conversations int default 0,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.onboarding_tasks  enable row level security;
alter table public.agent_deployments enable row level security;

-- Clients can read their own rows; only admins can write
do $$
declare t text;
begin
  foreach t in array array['onboarding_tasks','agent_deployments'] loop
    execute format('drop policy if exists "%1$s read" on public.%1$s', t);
    execute format('drop policy if exists "%1$s admin" on public.%1$s', t);
    execute format('create policy "%1$s read" on public.%1$s for select using (public.is_admin() or org_id = public.my_org())', t);
    execute format('create policy "%1$s admin" on public.%1$s for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- New sign-ups start at the "Signed" stage
update public.organizations set stage = 'Signed' where stage is null;
