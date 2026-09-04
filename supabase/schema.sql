-- Homioqo schema for Supabase
-- Run in the SQL editor of a new project. Enable RLS on every table.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  slug text unique not null,
  city text,
  country text not null default 'ES',
  support_email text,
  support_phone text,
  default_locale text not null default 'es',
  plan text not null default 'starter',
  is_demo boolean not null default false,
  settings jsonb not null default '{}'::jsonb
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role text not null default 'staff',
  locale text not null default 'es'
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text not null,
  city text not null,
  postal_code text,
  type text not null,
  notes text
);

create table public.owners (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  country text,
  locale text not null default 'en',
  notes text
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  unit_id uuid,
  full_name text not null,
  email text,
  phone text,
  locale text not null default 'es'
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  label text not null,
  floor text,
  bedrooms int,
  owner_id uuid references public.owners(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  occupancy text not null default 'longTerm',
  report_token text unique not null,
  archived_at timestamptz
);

create table public.contractors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_name text not null,
  trade text not null,
  email text,
  phone text,
  city text,
  locale text not null default 'es',
  hourly_rate numeric,
  notes text
);

create table public.maintenance_cases (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  reference text unique not null,
  unit_id uuid not null references public.units(id),
  property_id uuid not null references public.properties(id),
  category text not null,
  priority text not null,
  status text not null default 'new',
  original_locale text not null,
  original_description text not null,
  translations jsonb not null default '{}'::jsonb,
  reporter_name text not null,
  reporter_contact text not null,
  reporter_locale text not null,
  source text not null default 'qr',
  manager_id uuid references public.profiles(id),
  contractor_id uuid references public.contractors(id),
  scheduled_at timestamptz,
  estimated_cost numeric,
  final_cost numeric,
  completed_at timestamptz,
  consent_at timestamptz,
  anonymised_at timestamptz
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.maintenance_cases(id) on delete cascade,
  contractor_id uuid not null references public.contractors(id),
  status text not null default 'pending',
  note text,
  responded_at timestamptz,
  decline_reason text,
  proposed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  work_summary text
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.maintenance_cases(id) on delete cascade,
  author_role text not null,
  author_name text not null,
  audience text not null default 'all',
  original_locale text not null,
  original_text text not null,
  translations jsonb not null default '{}'::jsonb
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.maintenance_cases(id) on delete cascade,
  kind text not null,
  url text not null,
  caption text,
  uploaded_by_role text not null
);

create table public.cost_estimates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.maintenance_cases(id) on delete cascade,
  amount numeric not null,
  note text,
  status text not null default 'pending',
  created_by_role text not null,
  decided_at timestamptz
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid not null references public.maintenance_cases(id) on delete cascade,
  type text not null,
  actor_role text not null,
  actor_name text not null,
  meta jsonb
);

create table public.secure_links (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  token text unique not null,
  role text not null,
  case_id uuid references public.maintenance_cases(id) on delete cascade,
  unit_id uuid references public.units(id) on delete cascade,
  contractor_id uuid references public.contractors(id) on delete set null,
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz
);

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid references public.maintenance_cases(id) on delete set null,
  channel text not null,
  recipient text not null,
  subject text not null,
  status text not null,
  error text
);

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','profiles','properties','owners','tenants','units','contractors',
    'maintenance_cases','assignments','messages','attachments','cost_estimates',
    'activity_logs','secure_links','notification_logs'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end $$;

-- Helper: current user's organization
create or replace function public.current_org_id()
returns uuid as $$
  select organization_id from public.profiles where user_id = auth.uid() limit 1
$$ language sql stable security definer set search_path = public;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.owners enable row level security;
alter table public.tenants enable row level security;
alter table public.units enable row level security;
alter table public.contractors enable row level security;
alter table public.maintenance_cases enable row level security;
alter table public.assignments enable row level security;
alter table public.messages enable row level security;
alter table public.attachments enable row level security;
alter table public.cost_estimates enable row level security;
alter table public.activity_logs enable row level security;
alter table public.secure_links enable row level security;
alter table public.notification_logs enable row level security;

create policy "org members read own org" on public.organizations
  for select using (id = public.current_org_id());
create policy "org members update own org" on public.organizations
  for update using (id = public.current_org_id());

create policy "org members manage profiles" on public.profiles
  for all using (organization_id = public.current_org_id());

create policy "org isolation properties" on public.properties
  for all using (organization_id = public.current_org_id());
create policy "org isolation owners" on public.owners
  for all using (organization_id = public.current_org_id());
create policy "org isolation tenants" on public.tenants
  for all using (organization_id = public.current_org_id());
create policy "org isolation units" on public.units
  for all using (organization_id = public.current_org_id());
create policy "org isolation contractors" on public.contractors
  for all using (organization_id = public.current_org_id());
create policy "org isolation cases" on public.maintenance_cases
  for all using (organization_id = public.current_org_id());
create policy "org isolation assignments" on public.assignments
  for all using (organization_id = public.current_org_id());
create policy "org isolation messages" on public.messages
  for all using (organization_id = public.current_org_id());
create policy "org isolation attachments" on public.attachments
  for all using (organization_id = public.current_org_id());
create policy "org isolation estimates" on public.cost_estimates
  for all using (organization_id = public.current_org_id());
create policy "org isolation activity" on public.activity_logs
  for all using (organization_id = public.current_org_id());
create policy "org isolation links" on public.secure_links
  for all using (organization_id = public.current_org_id());
create policy "org isolation notifications" on public.notification_logs
  for all using (organization_id = public.current_org_id());

-- Public QR reporting: anon can insert a case when the unit token matches.
-- Actual public writes in v1 go through the Next.js server with the service role
-- or the in-memory demo store. Keep this as a starting point.

create index on public.units (report_token);
create index on public.secure_links (token);
create index on public.maintenance_cases (organization_id, status);
create index on public.maintenance_cases (unit_id);

-- ---------------------------------------------------------------------------
-- Shared login / membership (app runtime still uses the in-memory store)
-- ---------------------------------------------------------------------------

alter table public.properties
  add column if not exists guest_pin_hash text,
  add column if not exists guest_link_expires_at timestamptz,
  add column if not exists guest_link_revoked_at timestamptz,
  add column if not exists report_token text unique;

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null check (role in ('host', 'owner', 'cleaner', 'contractor')),
  property_ids uuid[] not null default '{}',
  directory_id uuid,
  revoked_at timestamptz
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  phone text,
  role text not null check (role in ('owner', 'cleaner', 'contractor')),
  property_ids uuid[] not null default '{}',
  invited_by_user_id uuid not null references public.profiles(id),
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  channel text not null default 'email',
  directory_id uuid
);

create table if not exists public.login_links (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  intended_role text,
  intended_organization_id uuid references public.organizations(id) on delete cascade
);

-- Assignments already exist as public.assignments (maintenance) and cleaning jobs
-- in the app store. Keep names aligned with the product:
comment on table public.assignments is 'Maintenance assignments (contractor <-> case).';

alter table public.organization_memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.login_links enable row level security;

create policy "org isolation memberships" on public.organization_memberships
  for all using (organization_id = public.current_org_id());
create policy "org isolation invitations" on public.invitations
  for all using (organization_id = public.current_org_id());
create policy "users read own login links" on public.login_links
  for select using (
    user_id in (select id from public.profiles where organization_id = public.current_org_id())
  );

create index if not exists organization_memberships_user_idx on public.organization_memberships (user_id);
create index if not exists invitations_org_idx on public.invitations (organization_id, email);
create index if not exists login_links_hash_idx on public.login_links (token_hash);

-- Storage bucket for photos (create via dashboard or):
-- insert into storage.buckets (id, name, public) values ('case-photos', 'case-photos', false);
