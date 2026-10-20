-- =============================================================================================
-- AZIZURRAHMAN · Migration 3 — appointments, booked-service snapshots, audit history
--
-- Integrity strategy (docs/database/SCHEMA.md#concurrency-and-integrity):
--   * `reserves_capacity` (generated from status) is the single definition of which statuses hold
--     a slot. PROPOSED policy: pending / confirmed / reschedule_requested reserve; declined /
--     cancelled release. Pending client approval (BUSINESS_RULES BR-14).
--   * `appointments_no_overlap` (exclusion constraint) forbids overlapping blocked ranges among
--     capacity-reserving appointments → single provider, one appointment at a time (BR-02).
--   * `appointments_one_active_per_phone_per_day` (partial unique index) → one capacity-reserving
--     appointment per normalised phone per local date (BR-13).
--   Both are evaluated by PostgreSQL under concurrency, so simultaneous requests cannot both win.
-- =============================================================================================

-- Types ---------------------------------------------------------------------------------------
create type public.appointment_status as enum (
  'pending',
  'confirmed',
  'reschedule_requested',
  'declined',
  'cancelled'
);
comment on type public.appointment_status is
  'Appointment lifecycle. Allowed transitions are enforced by private.appointment_status_transition_allowed().';

create type public.contact_method as enum ('phone', 'whatsapp', 'email');

-- Helpers -------------------------------------------------------------------------------------
create or replace function private.generate_public_reference()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  -- Crockford base32 (no I, L, O, U). 256 is divisible by 32, so byte % 32 is unbiased.
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  random_bytes bytea := extensions.gen_random_bytes(10);
  encoded text := '';
begin
  for i in 0..9 loop
    encoded := encoded || substr(alphabet, (get_byte(random_bytes, i) % 32) + 1, 1);
  end loop;
  return 'AZR-' || substr(encoded, 1, 5) || '-' || substr(encoded, 6, 5);
end;
$$;

comment on function private.generate_public_reference() is
  'Unguessable public appointment reference, e.g. AZR-7K2QX-M9D4T (50 random bits). It identifies a booking for the visitor; it is NOT authorization.';

revoke all on function private.generate_public_reference() from public;
grant execute on function private.generate_public_reference() to authenticated, service_role;

create or replace function private.appointment_status_transition_allowed(
  from_status public.appointment_status,
  to_status public.appointment_status
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select from_status = to_status
    or (from_status::text, to_status::text) in (
      ('pending', 'confirmed'),
      ('pending', 'reschedule_requested'),
      ('pending', 'declined'),
      ('pending', 'cancelled'),
      ('confirmed', 'reschedule_requested'),
      ('confirmed', 'cancelled'),
      ('reschedule_requested', 'confirmed'),
      ('reschedule_requested', 'declined'),
      ('reschedule_requested', 'cancelled')
    );
$$;

comment on function private.appointment_status_transition_allowed(public.appointment_status, public.appointment_status) is
  'PROPOSED transition table (BUSINESS_RULES.md#status-transitions). declined and cancelled are terminal.';

revoke all on function private.appointment_status_transition_allowed(public.appointment_status, public.appointment_status) from public;
grant execute on function private.appointment_status_transition_allowed(public.appointment_status, public.appointment_status) to authenticated, service_role;

-- appointments --------------------------------------------------------------------------------
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null default private.generate_public_reference(),

  customer_name text not null,
  phone_number text not null,
  normalized_phone text not null,
  email text,
  preferred_contact_method public.contact_method,
  message text,

  appointment_start timestamptz not null,
  appointment_end timestamptz not null,
  blocked_start timestamptz not null,
  blocked_end timestamptz not null,
  timezone text not null,
  local_date date generated always as ((appointment_start at time zone timezone)::date) stored,

  status public.appointment_status not null default 'pending',
  reserves_capacity boolean generated always as (
    status in ('pending', 'confirmed', 'reschedule_requested')
  ) stored,

  private_admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint appointments_public_reference_key unique (public_reference),
  constraint appointments_public_reference_format
    check (public_reference ~ '^AZR-[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$'),
  constraint appointments_customer_name_length
    check (char_length(btrim(customer_name)) between 1 and 120),
  constraint appointments_phone_number_length
    check (char_length(btrim(phone_number)) between 5 and 32),
  constraint appointments_normalized_phone_e164
    check (normalized_phone ~ '^\+[1-9][0-9]{6,14}$'),
  constraint appointments_email_format
    check (email is null or (email = lower(email)
      and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
      and char_length(email) <= 254)),
  constraint appointments_message_length
    check (message is null or char_length(message) <= 1000),
  constraint appointments_private_admin_notes_length
    check (private_admin_notes is null or char_length(private_admin_notes) <= 4000),
  constraint appointments_valid_time_range
    check (appointment_end > appointment_start
      and appointment_end - appointment_start <= interval '12 hours'),
  constraint appointments_blocked_range_covers_appointment
    check (blocked_start <= appointment_start and blocked_end >= appointment_end),
  constraint appointments_no_overlap exclude using gist (
    tstzrange(blocked_start, blocked_end, '[)') with &&
  ) where (reserves_capacity)
);

comment on table public.appointments is
  'Guest appointment requests. Never readable by anonymous users; public receipt/lookup data is served by controlled server operations that exclude private fields.';
comment on column public.appointments.public_reference is 'Unguessable visitor-facing reference. Not an authorization token.';
comment on column public.appointments.phone_number is 'Phone as entered by the visitor (display only).';
comment on column public.appointments.normalized_phone is 'E.164 form used for duplicate detection and search.';
comment on column public.appointments.appointment_start is 'Consultation start (absolute instant).';
comment on column public.appointments.appointment_end is 'Consultation end (absolute instant).';
comment on column public.appointments.blocked_start is 'Start of the time the provider is occupied, including any before-buffer. Used for overlap prevention.';
comment on column public.appointments.blocked_end is 'End of the occupied time, including any after-buffer.';
comment on column public.appointments.timezone is 'IANA timezone used when the booking was made; defines local_date.';
comment on column public.appointments.local_date is 'Local calendar date of appointment_start in `timezone`. Used by the daily identity rule.';
comment on column public.appointments.reserves_capacity is
  'Generated: true for statuses that hold the slot and count toward the daily limit (PROPOSED: pending, confirmed, reschedule_requested).';
comment on column public.appointments.private_admin_notes is 'Admin-only. Must never be returned by public APIs, receipts or exports.';

create unique index appointments_one_active_per_phone_per_day
  on public.appointments (normalized_phone, local_date)
  where reserves_capacity;
comment on index public.appointments_one_active_per_phone_per_day is
  'PROPOSED daily identity rule (BR-13): one capacity-reserving appointment per phone per local date.';

create index appointments_start_idx on public.appointments (appointment_start);
create index appointments_status_start_idx on public.appointments (status, appointment_start);
create index appointments_local_date_idx on public.appointments (local_date);
create index appointments_phone_date_idx on public.appointments (normalized_phone, local_date);
create index appointments_email_idx on public.appointments (email) where email is not null;
create index appointments_created_at_idx on public.appointments (created_at desc);

-- appointment_services ------------------------------------------------------------------------
create table public.appointment_services (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  position smallint not null default 0,
  service_name_snapshot text not null,
  duration_minutes_snapshot integer not null,
  buffer_before_minutes_snapshot integer not null default 0,
  buffer_after_minutes_snapshot integer not null default 0,
  created_at timestamptz not null default now(),

  constraint appointment_services_unique_service unique (appointment_id, service_id),
  constraint appointment_services_position_non_negative check (position >= 0),
  constraint appointment_services_name_snapshot_length
    check (char_length(service_name_snapshot) between 1 and 120),
  constraint appointment_services_duration_snapshot_positive check (duration_minutes_snapshot > 0),
  constraint appointment_services_buffer_snapshots_non_negative
    check (buffer_before_minutes_snapshot >= 0 and buffer_after_minutes_snapshot >= 0)
);

comment on table public.appointment_services is
  'Services booked in an appointment, with name/duration/buffers frozen at booking time. Snapshots are filled by trigger from public.services and cannot be supplied by the caller.';
comment on column public.appointment_services.service_id is
  'ON DELETE RESTRICT: a booked service cannot be hard-deleted; archive it with is_active = false.';

create index appointment_services_service_id_idx on public.appointment_services (service_id);

-- appointment_events --------------------------------------------------------------------------
create table public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  actor_admin_id uuid references public.admin_profiles (id) on delete set null,
  event_type text not null,
  previous_status public.appointment_status,
  new_status public.appointment_status,
  metadata jsonb not null default '{}'::jsonb,
  -- clock_timestamp(), not now(): several events can be written in one transaction and must
  -- keep their real order.
  created_at timestamptz not null default clock_timestamp(),

  constraint appointment_events_event_type_valid check (event_type in (
    'created', 'status_changed', 'rescheduled', 'details_updated', 'notes_updated'
  )),
  constraint appointment_events_status_change_complete check (
    event_type <> 'status_changed'
    or (previous_status is not null and new_status is not null and previous_status <> new_status)
  ),
  constraint appointment_events_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint appointment_events_metadata_size check (pg_column_size(metadata) <= 4096)
);

comment on table public.appointment_events is
  'Append-only audit trail written exclusively by triggers. Admins can read; nobody can insert, edit or delete through the API. Metadata never contains contact details or message text.';
comment on column public.appointment_events.actor_admin_id is 'Acting admin, or NULL for system/service-role operations (e.g. public booking).';

create index appointment_events_appointment_created_idx
  on public.appointment_events (appointment_id, created_at);
create index appointment_events_actor_admin_id_idx on public.appointment_events (actor_admin_id);

-- Triggers: appointments ----------------------------------------------------------------------
create or replace function private.appointments_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.timezone is distinct from old.timezone then
    if not private.is_valid_timezone(new.timezone) then
      raise exception 'invalid timezone: %', new.timezone using errcode = '22023';
    end if;
  end if;

  if tg_op = 'INSERT' then
    if new.status not in ('pending', 'confirmed') then
      raise exception 'invalid initial appointment status: %', new.status
        using errcode = '23514';
    end if;
    return new;
  end if;

  -- UPDATE
  if new.id is distinct from old.id
     or new.public_reference is distinct from old.public_reference
     or new.created_at is distinct from old.created_at then
    raise exception 'appointment id, public_reference and created_at are immutable'
      using errcode = '23514';
  end if;

  if not private.appointment_status_transition_allowed(old.status, new.status) then
    raise exception 'invalid appointment status transition: % -> %', old.status, new.status;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger appointments_guard_status_transition
  before insert or update on public.appointments
  for each row execute function private.appointments_before_write();

-- Audit writer. SECURITY DEFINER so it can append to appointment_events, which no API role may
-- write to directly.
create or replace function private.appointments_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  changed_fields text[];
begin
  if actor is not null and not exists (select 1 from public.admin_profiles where id = actor) then
    actor := null;
  end if;

  if tg_op = 'INSERT' then
    insert into public.appointment_events (appointment_id, actor_admin_id, event_type, new_status, metadata)
    values (new.id, actor, 'created', new.status,
            jsonb_build_object('source', case when actor is null then 'system' else 'admin' end));
    return null;
  end if;

  if new.status is distinct from old.status then
    insert into public.appointment_events (appointment_id, actor_admin_id, event_type, previous_status, new_status)
    values (new.id, actor, 'status_changed', old.status, new.status);
  end if;

  if (new.appointment_start, new.appointment_end, new.blocked_start, new.blocked_end)
     is distinct from (old.appointment_start, old.appointment_end, old.blocked_start, old.blocked_end) then
    insert into public.appointment_events (appointment_id, actor_admin_id, event_type, metadata)
    values (new.id, actor, 'rescheduled', jsonb_build_object(
      'from_start', old.appointment_start, 'from_end', old.appointment_end,
      'to_start', new.appointment_start, 'to_end', new.appointment_end));
  end if;

  -- Record WHICH contact fields changed, never their values.
  changed_fields := array_remove(array[
    case when new.customer_name is distinct from old.customer_name then 'customer_name' end,
    case when new.phone_number is distinct from old.phone_number
           or new.normalized_phone is distinct from old.normalized_phone then 'phone' end,
    case when new.email is distinct from old.email then 'email' end,
    case when new.preferred_contact_method is distinct from old.preferred_contact_method then 'preferred_contact_method' end,
    case when new.message is distinct from old.message then 'message' end,
    case when new.timezone is distinct from old.timezone then 'timezone' end
  ], null);
  if cardinality(changed_fields) > 0 then
    insert into public.appointment_events (appointment_id, actor_admin_id, event_type, metadata)
    values (new.id, actor, 'details_updated', jsonb_build_object('fields', to_jsonb(changed_fields)));
  end if;

  if new.private_admin_notes is distinct from old.private_admin_notes then
    insert into public.appointment_events (appointment_id, actor_admin_id, event_type)
    values (new.id, actor, 'notes_updated');
  end if;

  return null;
end;
$$;

revoke all on function private.appointments_audit() from public;

create trigger appointments_write_audit_events
  after insert or update on public.appointments
  for each row execute function private.appointments_audit();

-- Triggers: appointment_services --------------------------------------------------------------
-- Snapshots come from the database, never from the caller, and only active services can be added.
create or replace function private.appointment_services_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  svc public.services%rowtype;
begin
  select * into svc from public.services where id = new.service_id;
  if not found or not svc.is_active then
    raise exception 'service % is not available for booking', new.service_id
      using errcode = '23514';
  end if;

  new.service_name_snapshot := svc.name;
  new.duration_minutes_snapshot := svc.duration_minutes;
  new.buffer_before_minutes_snapshot := svc.buffer_before_minutes;
  new.buffer_after_minutes_snapshot := svc.buffer_after_minutes;
  return new;
end;
$$;

revoke all on function private.appointment_services_snapshot() from public;

create trigger appointment_services_fill_snapshot
  before insert on public.appointment_services
  for each row execute function private.appointment_services_snapshot();

-- Every appointment must include at least one service. Checked at COMMIT (deferred), so the
-- appointment and its services can be inserted in one transaction in either order.
create or replace function private.assert_appointment_has_services()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  -- Separate branches: PL/pgSQL resolves record fields per statement, and NEW/OLD have
  -- different shapes on the two tables this trigger is attached to.
  if tg_table_name = 'appointments' then
    target := new.id;
  else
    target := old.appointment_id;
  end if;

  if exists (select 1 from public.appointments where id = target)
     and not exists (select 1 from public.appointment_services where appointment_id = target) then
    raise exception 'appointment % must include at least one service', target
      using errcode = '23514';
  end if;
  return null;
end;
$$;

revoke all on function private.assert_appointment_has_services() from public;

create constraint trigger appointments_require_service
  after insert on public.appointments
  deferrable initially deferred
  for each row execute function private.assert_appointment_has_services();

create constraint trigger appointment_services_keep_at_least_one
  after delete on public.appointment_services
  deferrable initially deferred
  for each row execute function private.assert_appointment_has_services();

-- RLS & grants --------------------------------------------------------------------------------
alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;
alter table public.appointment_events enable row level security;

revoke all on table public.appointments, public.appointment_services, public.appointment_events
  from anon, authenticated;
grant all on table public.appointments, public.appointment_services, public.appointment_events
  to service_role;

-- No anon grants at all: visitors never touch appointment rows directly. Public booking and
-- lookup will go through validated server operations (Phase 6/7).

-- appointments: admins read, create (e.g. phone bookings) and update. No DELETE — cancel instead;
-- retention purges are a privileged (service-role) operation.
grant select, insert, update on table public.appointments to authenticated;

create policy "Admins can read appointments"
  on public.appointments for select to authenticated
  using ((select private.is_admin()));

create policy "Admins can create appointments"
  on public.appointments for insert to authenticated
  with check ((select private.is_admin()));

create policy "Admins can update appointments"
  on public.appointments for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- appointment_services: admins read and add; snapshots are immutable (no UPDATE/DELETE grant).
grant select, insert on table public.appointment_services to authenticated;

create policy "Admins can read appointment services"
  on public.appointment_services for select to authenticated
  using ((select private.is_admin()));

create policy "Admins can add appointment services"
  on public.appointment_services for insert to authenticated
  with check ((select private.is_admin()));

-- appointment_events: read-only for admins; written only by private.appointments_audit().
grant select on table public.appointment_events to authenticated;

create policy "Admins can read appointment events"
  on public.appointment_events for select to authenticated
  using ((select private.is_admin()));
