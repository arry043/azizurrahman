-- =============================================================================================
-- AZIZURRAHMAN · Migration 2 — service catalogue, recurring availability, date overrides,
-- site settings
--
-- Time semantics: all `time` and `date` columns here are LOCAL to the consultation timezone
-- (CONSULTATION_TIMEZONE). Intervals are half-open [start_time, end_time) and never cross
-- midnight; '24:00' is a valid end_time meaning end of day.
-- =============================================================================================

-- Local time range type used by interval exclusion constraints ---------------------------------
create type private.time_range as range (subtype = time);
comment on type private.time_range is 'Range of local wall-clock times; used to forbid overlapping intervals.';
grant usage on type private.time_range to authenticated, service_role;

-- services ------------------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  short_description text,
  description text,
  image_url text,
  duration_minutes integer not null,
  buffer_before_minutes integer not null default 0,
  buffer_after_minutes integer not null default 0,
  display_order integer not null default 0,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint services_slug_key unique (slug),
  constraint services_name_valid
    check (name = btrim(name) and char_length(name) between 1 and 120),
  constraint services_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  constraint services_short_description_length
    check (short_description is null or char_length(short_description) <= 280),
  constraint services_description_length
    check (description is null or char_length(description) <= 10000),
  constraint services_image_url_valid
    check (image_url is null or (image_url ~ '^(https://|/)' and char_length(image_url) <= 2048)),
  constraint services_duration_positive
    check (duration_minutes > 0 and duration_minutes <= 720),
  constraint services_buffers_non_negative
    check (buffer_before_minutes between 0 and 240 and buffer_after_minutes between 0 and 240)
);

comment on table public.services is
  'Public service catalogue. Only active services are visible to visitors and bookable. Archive with is_active = false; historical bookings keep their own snapshots.';
comment on column public.services.is_active is
  'Defaults to false so new services are unpublished until an admin activates them.';
comment on column public.services.duration_minutes is 'Consultation length; source of truth for slot calculation (never trust client input).';

create index services_active_display_order_idx
  on public.services (display_order, name)
  where is_active;

create trigger services_set_updated_at
  before update on public.services
  for each row execute function private.set_updated_at();

-- weekly_availability -------------------------------------------------------------------------
create table public.weekly_availability (
  weekday smallint primary key,
  is_closed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint weekly_availability_weekday_range check (weekday between 0 and 6)
);

comment on table public.weekly_availability is
  'One row per weekday (exactly seven rows, created by this migration). Nothing is hard-coded closed — every weekday, including Sunday, is configurable.';
comment on column public.weekly_availability.weekday is
  '0 = Sunday, 1 = Monday, ... 6 = Saturday. Matches PostgreSQL extract(dow) and JavaScript Date#getDay().';
comment on column public.weekly_availability.is_closed is
  'When true the weekday is closed regardless of its intervals (intervals are kept so reopening restores them).';

insert into public.weekly_availability (weekday, is_closed)
select d, true from generate_series(0, 6) as d;

create trigger weekly_availability_set_updated_at
  before update on public.weekly_availability
  for each row execute function private.set_updated_at();

-- weekly_availability_intervals ---------------------------------------------------------------
create table public.weekly_availability_intervals (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null references public.weekly_availability (weekday) on delete cascade,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint weekly_intervals_valid_range check (end_time > start_time),
  constraint weekly_intervals_no_overlap exclude using gist (
    weekday with =,
    private.time_range(start_time, end_time, '[)') with &&
  )
);

comment on table public.weekly_availability_intervals is
  'Working hours for a weekday. Several non-overlapping intervals model breaks (e.g. 10:00-13:00 and 15:00-19:00). These are opening hours, not bookable slots.';

create trigger weekly_availability_intervals_set_updated_at
  before update on public.weekly_availability_intervals
  for each row execute function private.set_updated_at();

-- date_overrides ------------------------------------------------------------------------------
create table public.date_overrides (
  id uuid primary key default gen_random_uuid(),
  override_date date not null,
  is_closed boolean not null default true,
  reason text,
  created_by uuid default auth.uid() references public.admin_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint date_overrides_override_date_key unique (override_date),
  constraint date_overrides_reason_length check (reason is null or char_length(reason) <= 500)
);

comment on table public.date_overrides is
  'Date-specific exception that takes precedence over weekly_availability. is_closed = true closes the date; false uses date_override_intervals as that day''s hours (no intervals = effectively closed). Never cancels existing appointments.';
comment on column public.date_overrides.override_date is 'Local calendar date in the consultation timezone (not a UTC instant).';
comment on column public.date_overrides.reason is 'Private admin note. Never exposed publicly.';

create index date_overrides_created_by_idx on public.date_overrides (created_by);

create trigger date_overrides_set_updated_at
  before update on public.date_overrides
  for each row execute function private.set_updated_at();

-- date_override_intervals ---------------------------------------------------------------------
create table public.date_override_intervals (
  id uuid primary key default gen_random_uuid(),
  date_override_id uuid not null references public.date_overrides (id) on delete cascade,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint date_override_intervals_valid_range check (end_time > start_time),
  constraint date_override_intervals_no_overlap exclude using gist (
    date_override_id with =,
    private.time_range(start_time, end_time, '[)') with &&
  )
);

comment on table public.date_override_intervals is 'Custom working hours for a date override with is_closed = false.';

create trigger date_override_intervals_set_updated_at
  before update on public.date_override_intervals
  for each row execute function private.set_updated_at();

-- site_settings -------------------------------------------------------------------------------
create table public.site_settings (
  id boolean primary key default true,
  min_advance_notice_minutes integer not null default 1440,
  booking_horizon_days integer not null default 60,
  slot_interval_minutes integer not null default 30,
  public_phone text,
  public_whatsapp text,
  public_email text,
  public_address text,
  consultation_hours_text text,
  whatsapp_message_template text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint site_settings_singleton check (id),
  constraint site_settings_advance_notice_range check (min_advance_notice_minutes between 0 and 43200),
  constraint site_settings_horizon_range check (booking_horizon_days between 1 and 365),
  constraint site_settings_slot_interval_range check (slot_interval_minutes between 5 and 240),
  constraint site_settings_public_phone_e164
    check (public_phone is null or public_phone ~ '^\+[1-9][0-9]{6,14}$'),
  constraint site_settings_public_whatsapp_e164
    check (public_whatsapp is null or public_whatsapp ~ '^\+[1-9][0-9]{6,14}$'),
  constraint site_settings_public_email_format
    check (public_email is null or (public_email = lower(public_email)
      and public_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
      and char_length(public_email) <= 254)),
  constraint site_settings_text_lengths check (
    coalesce(char_length(public_address), 0) <= 500
    and coalesce(char_length(consultation_hours_text), 0) <= 500
    and coalesce(char_length(whatsapp_message_template), 0) <= 500
  )
);

comment on table public.site_settings is
  'Singleton row of NON-SECRET public/business settings. Never store API keys or provider secrets here. Numeric defaults are proposals pending client approval (docs/requirements/BUSINESS_RULES.md). Contact fields stay NULL until the client verifies them.';

insert into public.site_settings default values;

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function private.set_updated_at();

-- RLS & grants --------------------------------------------------------------------------------
alter table public.services enable row level security;
alter table public.weekly_availability enable row level security;
alter table public.weekly_availability_intervals enable row level security;
alter table public.date_overrides enable row level security;
alter table public.date_override_intervals enable row level security;
alter table public.site_settings enable row level security;

revoke all on table
  public.services,
  public.weekly_availability,
  public.weekly_availability_intervals,
  public.date_overrides,
  public.date_override_intervals,
  public.site_settings
from anon, authenticated;

grant all on table
  public.services,
  public.weekly_availability,
  public.weekly_availability_intervals,
  public.date_overrides,
  public.date_override_intervals,
  public.site_settings
to service_role;

-- services: visitors see active services; admins manage everything.
grant select on table public.services to anon;
grant select, insert, update, delete on table public.services to authenticated;

create policy "Visitors can read active services"
  on public.services for select to anon
  using (is_active);

create policy "Signed-in users read active services; admins read all"
  on public.services for select to authenticated
  using (is_active or (select private.is_admin()));

create policy "Admins can create services"
  on public.services for insert to authenticated
  with check ((select private.is_admin()));

create policy "Admins can update services"
  on public.services for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- Deleting is only possible for services never booked (appointment_services FK is RESTRICT).
create policy "Admins can delete services"
  on public.services for delete to authenticated
  using ((select private.is_admin()));

-- weekly_availability: public opening hours are readable; the seven rows are fixed (update only).
grant select on table public.weekly_availability to anon;
grant select, update on table public.weekly_availability to authenticated;

create policy "Anyone can read the weekly schedule"
  on public.weekly_availability for select to anon, authenticated
  using (true);

create policy "Admins can update the weekly schedule"
  on public.weekly_availability for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- weekly_availability_intervals
grant select on table public.weekly_availability_intervals to anon;
grant select, insert, update, delete on table public.weekly_availability_intervals to authenticated;

create policy "Anyone can read weekly working intervals"
  on public.weekly_availability_intervals for select to anon, authenticated
  using (true);

create policy "Admins can create weekly intervals"
  on public.weekly_availability_intervals for insert to authenticated
  with check ((select private.is_admin()));

create policy "Admins can update weekly intervals"
  on public.weekly_availability_intervals for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins can delete weekly intervals"
  on public.weekly_availability_intervals for delete to authenticated
  using ((select private.is_admin()));

-- date_overrides + intervals: admin only (reason is private). Public availability for specific
-- dates will be served through a controlled server-side operation in Phase 5.
grant select, insert, update, delete on table public.date_overrides to authenticated;
grant select, insert, update, delete on table public.date_override_intervals to authenticated;

create policy "Admins can read date overrides"
  on public.date_overrides for select to authenticated
  using ((select private.is_admin()));

create policy "Admins can create date overrides"
  on public.date_overrides for insert to authenticated
  with check ((select private.is_admin()));

create policy "Admins can update date overrides"
  on public.date_overrides for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins can delete date overrides"
  on public.date_overrides for delete to authenticated
  using ((select private.is_admin()));

create policy "Admins can read date override intervals"
  on public.date_override_intervals for select to authenticated
  using ((select private.is_admin()));

create policy "Admins can create date override intervals"
  on public.date_override_intervals for insert to authenticated
  with check ((select private.is_admin()));

create policy "Admins can update date override intervals"
  on public.date_override_intervals for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins can delete date override intervals"
  on public.date_override_intervals for delete to authenticated
  using ((select private.is_admin()));

-- site_settings: public, non-secret values are readable; only admins update the single row.
grant select on table public.site_settings to anon;
grant select, update on table public.site_settings to authenticated;

create policy "Anyone can read public site settings"
  on public.site_settings for select to anon, authenticated
  using (true);

create policy "Admins can update site settings"
  on public.site_settings for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
