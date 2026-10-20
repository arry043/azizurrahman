-- Schema structure: tables, keys, RLS enablement, types and fixed configuration rows.
begin;
create extension if not exists pgtap with schema extensions;

select plan(38);

-- Tables ---------------------------------------------------------------------------------------
select tables_are(
  'public',
  array[
    'admin_profiles', 'services', 'weekly_availability', 'weekly_availability_intervals',
    'date_overrides', 'date_override_intervals', 'site_settings',
    'appointments', 'appointment_services', 'appointment_events',
    'booking_idempotency_keys', 'appointment_verifications'
  ],
  'public schema contains exactly the planned tables'
);

-- RLS enabled on every public table --------------------------------------------------------------
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  0,
  'every table in public has row level security enabled'
);

-- Primary keys -------------------------------------------------------------------------------
select col_is_pk('public', 'admin_profiles', 'id', 'admin_profiles.id is the primary key');
select col_is_pk('public', 'services', 'id', 'services.id is the primary key');
select col_is_pk('public', 'weekly_availability', 'weekday', 'weekly_availability is keyed by weekday');
select col_is_pk('public', 'appointments', 'id', 'appointments.id is the primary key');
select col_is_pk('public', 'site_settings', 'id', 'site_settings has a singleton key');

-- Foreign keys -------------------------------------------------------------------------------
select fk_ok('public', 'admin_profiles', 'id', 'auth', 'users', 'id');
select fk_ok('public', 'weekly_availability_intervals', 'weekday', 'public', 'weekly_availability', 'weekday');
select fk_ok('public', 'date_override_intervals', 'date_override_id', 'public', 'date_overrides', 'id');
select fk_ok('public', 'appointment_services', 'appointment_id', 'public', 'appointments', 'id');
select fk_ok('public', 'appointment_services', 'service_id', 'public', 'services', 'id');
select fk_ok('public', 'appointment_events', 'appointment_id', 'public', 'appointments', 'id');
select fk_ok('public', 'appointment_events', 'actor_admin_id', 'public', 'admin_profiles', 'id');

select is(
  (select confdeltype::text from pg_constraint where conname = 'appointment_services_service_id_fkey'),
  'r',
  'booked services cannot be hard-deleted (ON DELETE RESTRICT)'
);

-- Required columns -----------------------------------------------------------------------------
select col_not_null('public', 'services', 'name', 'services.name is required');
select col_not_null('public', 'services', 'duration_minutes', 'services.duration_minutes is required');
select col_not_null('public', 'appointments', 'customer_name', 'appointments.customer_name is required');
select col_not_null('public', 'appointments', 'normalized_phone', 'appointments.normalized_phone is required');
select col_not_null('public', 'appointments', 'timezone', 'appointments.timezone is required');
select col_is_null('public', 'appointments', 'email', 'appointments.email is optional');
select col_not_null('public', 'appointment_services', 'service_name_snapshot', 'service name snapshot is required');
select col_not_null('public', 'appointment_services', 'duration_minutes_snapshot', 'duration snapshot is required');

-- Types --------------------------------------------------------------------------------------
select col_type_is('public', 'appointments', 'appointment_start', 'timestamp with time zone', 'appointment_start is timestamptz');
select col_type_is('public', 'date_overrides', 'override_date', 'date', 'override_date is a local calendar date');
select col_type_is('public', 'weekly_availability_intervals', 'start_time', 'time without time zone', 'intervals are local wall-clock times');
select enum_has_labels(
  'public', 'appointment_status',
  array['pending', 'confirmed', 'reschedule_requested', 'declined', 'cancelled'],
  'appointment_status has the five planned values'
);
select col_default_is('public', 'appointments', 'status', 'pending'::public.appointment_status, 'new appointments default to pending');
select col_default_is('public', 'services', 'is_active', 'false', 'new services are unpublished by default');

-- Generated columns ---------------------------------------------------------------------------
select is(
  (select attgenerated::text from pg_attribute
   where attrelid = 'public.appointments'::regclass and attname = 'reserves_capacity'),
  's',
  'reserves_capacity is a stored generated column'
);
select is(
  (select attgenerated::text from pg_attribute
   where attrelid = 'public.appointments'::regclass and attname = 'local_date'),
  's',
  'local_date is a stored generated column'
);

-- Indexes / uniqueness -------------------------------------------------------------------------
select has_index('public', 'appointments', 'appointments_one_active_per_phone_per_day', 'daily identity index exists');
select index_is_unique('public', 'appointments', 'appointments_one_active_per_phone_per_day', 'daily identity index is unique');
select has_index('public', 'appointments', 'appointments_status_start_idx', 'status/start index exists');
select has_index('public', 'services', 'services_active_display_order_idx', 'catalogue ordering index exists');

-- Fixed configuration rows ---------------------------------------------------------------------
select results_eq(
  'select weekday::int from public.weekly_availability order by weekday',
  array[0, 1, 2, 3, 4, 5, 6],
  'weekly_availability has exactly one row per weekday 0..6'
);
select is((select count(*)::int from public.site_settings), 1, 'site_settings has exactly one row');

-- Helper schema is not part of the Data API ----------------------------------------------------
select ok(
  not has_schema_privilege('anon', 'private', 'usage'),
  'anon cannot use the private helper schema'
);

select * from finish();
rollback;
