-- =====================================================================
-- InboundPlus Client Hub — database schema (run in Supabase → SQL Editor)
-- Safe to run more than once.
--
-- Roles:  'admin'  = InboundPlus team (sees and manages every client)
--         'client' = a client user (sees only their own organization)
-- Every new sign-up becomes a client with its own organization.
-- Make yourself admin afterwards:
--   update public.profiles set role = 'admin', org_id = null where email = 'you@company.com';
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Core tables ----------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text default 'Ecommerce Growth Advisory',
  platform text,
  website text,
  status text default 'Active',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  company text,
  platform text,
  goal text,
  website text,
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists role text not null default 'client';
alter table public.profiles add column if not exists org_id uuid references public.organizations (id) on delete set null;

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  size text,
  kind text,
  path text,
  status text not null default 'Shared',          -- Shared | Needs approval | Approved | Rejected
  uploaded_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  type text default 'Monthly',                    -- Monthly | Quarterly | Audit | Research | Custom
  summary text,
  path text,
  created_at timestamptz not null default now()
);

create table if not exists public.deployments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  app text not null,
  env text default 'Production',
  version text,
  status text default 'success',                  -- success | failed | running
  notes text,
  by_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  type text,
  progress int default 0,
  status text default 'On track',                 -- On track | At risk | Done
  due text,
  created_at timestamptz not null default now()
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  type text,
  notes text,
  status text not null default 'New',             -- New | In review | In progress | Done
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  sender_role text not null default 'client',     -- client | agency
  sender_name text,
  body text not null,
  created_at timestamptz not null default now()
);

-- ---------- Helper functions ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_org() returns uuid
language sql stable security definer set search_path = public as $$
  select org_id from public.profiles where id = auth.uid();
$$;

-- ---------- Row Level Security ----------
alter table public.organizations enable row level security;
alter table public.profiles      enable row level security;
alter table public.files         enable row level security;
alter table public.reports       enable row level security;
alter table public.deployments   enable row level security;
alter table public.projects      enable row level security;
alter table public.requests      enable row level security;
alter table public.messages      enable row level security;

-- organizations
drop policy if exists "org read"  on public.organizations;
drop policy if exists "org admin" on public.organizations;
create policy "org read"  on public.organizations for select using (public.is_admin() or id = public.my_org());
create policy "org admin" on public.organizations for all using (public.is_admin()) with check (public.is_admin());

-- profiles
drop policy if exists "Users can read own profile"   on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "profile read"   on public.profiles;
drop policy if exists "profile update" on public.profiles;
drop policy if exists "profile admin"  on public.profiles;
create policy "profile read"   on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profile update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profile admin"  on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- Clients may not change their own role or organization
create or replace function public.protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin()
     and (new.role is distinct from old.role or new.org_id is distinct from old.org_id) then
    raise exception 'Not allowed to change role or organization';
  end if;
  return new;
end;
$$;
drop trigger if exists protect_profile on public.profiles;
create trigger protect_profile before update on public.profiles for each row execute function public.protect_profile();

-- read: admin or own org; write: admin
do $$
declare t text;
begin
  foreach t in array array['files','reports','deployments','projects','requests','messages'] loop
    execute format('drop policy if exists "%1$s read" on public.%1$s', t);
    execute format('drop policy if exists "%1$s admin" on public.%1$s', t);
    execute format('create policy "%1$s read" on public.%1$s for select using (public.is_admin() or org_id = public.my_org())', t);
    execute format('create policy "%1$s admin" on public.%1$s for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- client write permissions for their own organization
drop policy if exists "files client insert"    on public.files;
drop policy if exists "files client update"    on public.files;
drop policy if exists "requests client insert" on public.requests;
drop policy if exists "messages client insert" on public.messages;
create policy "files client insert"    on public.files    for insert with check (org_id = public.my_org());
create policy "files client update"    on public.files    for update using (org_id = public.my_org()) with check (org_id = public.my_org());
create policy "requests client insert" on public.requests for insert with check (org_id = public.my_org());
create policy "messages client insert" on public.messages for insert with check (org_id = public.my_org() and sender_role = 'client');

-- ---------- New user → profile + organization ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_org uuid;
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.organizations (name, platform, website)
  values (coalesce(nullif(m ->> 'company', ''), new.email), m ->> 'platform', m ->> 'website')
  returning id into new_org;

  insert into public.profiles (id, email, full_name, company, platform, goal, website, role, org_id)
  values (new.id, new.email, m ->> 'full_name', m ->> 'company', m ->> 'platform', m ->> 'goal', m ->> 'website', 'client', new_org)
  on conflict (id) do update set org_id = coalesce(public.profiles.org_id, excluded.org_id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill users who signed up before this schema existed
do $$
declare u record; new_org uuid;
begin
  for u in select au.id, au.email, au.raw_user_meta_data m from auth.users au
           left join public.profiles p on p.id = au.id
           where p.id is null or (p.org_id is null and coalesce(p.role, 'client') = 'client') loop
    insert into public.organizations (name, platform)
    values (coalesce(nullif(u.m ->> 'company', ''), u.email), u.m ->> 'platform') returning id into new_org;
    insert into public.profiles (id, email, full_name, company, platform, role, org_id)
    values (u.id, u.email, u.m ->> 'full_name', u.m ->> 'company', u.m ->> 'platform', 'client', new_org)
    on conflict (id) do update set org_id = excluded.org_id;
  end loop;
end $$;

-- ---------- File storage (private bucket, one folder per organization) ----------
insert into storage.buckets (id, name, public) values ('client-files', 'client-files', false)
on conflict (id) do nothing;

drop policy if exists "client-files read"   on storage.objects;
drop policy if exists "client-files insert" on storage.objects;
drop policy if exists "client-files delete" on storage.objects;
create policy "client-files read" on storage.objects for select
  using (bucket_id = 'client-files' and (public.is_admin() or (storage.foldername(name))[1] = public.my_org()::text));
create policy "client-files insert" on storage.objects for insert
  with check (bucket_id = 'client-files' and (public.is_admin() or (storage.foldername(name))[1] = public.my_org()::text));
create policy "client-files delete" on storage.objects for delete
  using (bucket_id = 'client-files' and public.is_admin());
