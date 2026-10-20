-- =============================================================================================
-- AZIZURRAHMAN · Migration 1 — foundation, private helper schema, administrator profiles
--
-- Conventions used by every migration in this project:
--   * Every table in `public` (the schema exposed through the Supabase Data API) has RLS enabled
--     and explicit grants. Supabase's default grants to `anon`/`authenticated` are revoked per
--     table and only the privileges each role needs are granted back.
--   * Helper functions live in `private`, which is NOT exposed through the Data API, and always
--     run with an empty search_path (fully-qualified names only).
--   * Docs: docs/database/SCHEMA.md, DATA_DICTIONARY.md, RLS_POLICIES.md
-- =============================================================================================

-- Extensions ----------------------------------------------------------------------------------
-- btree_gist: lets exclusion constraints combine equality (=) on scalar columns with range
-- overlap (&&) — used for non-overlapping intervals and appointments.
create extension if not exists btree_gist with schema extensions;
-- pgcrypto: gen_random_bytes() for unguessable public appointment references.
create extension if not exists pgcrypto with schema extensions;

-- Private schema ------------------------------------------------------------------------------
create schema if not exists private;
comment on schema private is
  'Internal helpers (authorization, triggers, validation). Never add to the Data API exposed schemas.';

revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- Shared helpers ------------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function private.set_updated_at() is 'BEFORE UPDATE trigger: maintains updated_at.';

create or replace function private.is_valid_timezone(tz text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select tz is not null and exists (
    select 1 from pg_catalog.pg_timezone_names where name = tz
  );
$$;

comment on function private.is_valid_timezone(text) is
  'True when tz is a full IANA/PostgreSQL zone name (e.g. Asia/Kolkata). Abbreviations and raw offsets are rejected.';

-- admin_profiles ------------------------------------------------------------------------------
create table public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role text not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint admin_profiles_display_name_length
    check (display_name is null or char_length(btrim(display_name)) between 1 and 80),
  constraint admin_profiles_role_valid
    check (role in ('admin'))
);

comment on table public.admin_profiles is
  'Maps Supabase Auth users to authorised administrators. Rows are provisioned privately (SQL editor / service role); there is no public or self-service path to create or modify them.';
comment on column public.admin_profiles.role is
  'Constrained role. Only ''admin'' exists today; extend the check constraint if more roles are approved.';
comment on column public.admin_profiles.is_active is
  'Set false to revoke all admin database privileges immediately without deleting the auth user.';

create trigger admin_profiles_set_updated_at
  before update on public.admin_profiles
  for each row execute function private.set_updated_at();

-- Authorization helper ------------------------------------------------------------------------
-- SECURITY DEFINER so RLS policies on other tables can consult admin_profiles without granting
-- callers direct access to it and without recursive policy evaluation.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.id = (select auth.uid())
      and ap.is_active
  );
$$;

comment on function private.is_admin() is
  'True when the current JWT subject has an active admin_profiles row. Never trusts client-supplied role claims.';

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated, service_role;

-- RLS: admin_profiles -------------------------------------------------------------------------
alter table public.admin_profiles enable row level security;

revoke all on table public.admin_profiles from anon, authenticated;
grant select on table public.admin_profiles to authenticated;
grant all on table public.admin_profiles to service_role;

create policy "Active admins can read admin profiles"
  on public.admin_profiles
  for select
  to authenticated
  using ((select private.is_admin()));

-- Deliberately no INSERT / UPDATE / DELETE policies or grants for anon/authenticated:
-- nobody can register, promote themselves, or re-activate an account through the API.
