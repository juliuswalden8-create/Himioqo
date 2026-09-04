-- Deny-by-default RLS for when Homioqo is wired to Supabase.
-- The live app still uses the in-memory store. Do not apply this blindly
-- to a database that already has data without a backup and a review.
-- Service role bypasses RLS — never expose SUPABASE_SERVICE_ROLE_KEY to the browser.

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.owners enable row level security;
alter table public.tenants enable row level security;

create policy org_members_select on public.organizations
  for select using (
    exists (
      select 1 from public.profiles p
      where p.organization_id = organizations.id
        and p.user_id = auth.uid()
    )
  );

create policy profiles_self_org on public.profiles
  for select using (
    organization_id in (
      select organization_id from public.profiles where user_id = auth.uid()
    )
  );

create policy properties_same_org on public.properties
  for all using (
    organization_id in (
      select organization_id from public.profiles where user_id = auth.uid()
    )
  )
  with check (
    organization_id in (
      select organization_id from public.profiles where user_id = auth.uid()
    )
  );

-- Guests never use these tables. QR tokens stay in a dedicated public view
-- that only exposes guest-safe columns once that view is created.
