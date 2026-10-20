-- Data integrity: constraints, availability model, booking rules, status transitions, snapshots
-- and audit trail. Runs as the table owner (RLS is covered in 03_rls.test.sql).
-- Uses dates in 2030 so it never collides with the relative-date development seed.
begin;
create extension if not exists pgtap with schema extensions;

select plan(59);

-- Fixtures ------------------------------------------------------------------------------------
insert into public.services (id, name, slug, duration_minutes, buffer_before_minutes, buffer_after_minutes, is_active)
values
  ('10000000-0000-4000-8000-00000000000a', 'Test Service A', 'test-service-a', 30, 0, 0, true),
  ('10000000-0000-4000-8000-00000000000b', 'Test Service B', 'test-service-b', 60, 5, 10, true),
  ('10000000-0000-4000-8000-00000000000c', 'Test Service C', 'test-service-c', 45, 0, 0, false);

-- Book an appointment for `minutes` at a local wall-clock time in Asia/Kolkata, with service A.
create function pg_temp.book(
  phone text,
  local_start timestamp,
  minutes int,
  initial_status public.appointment_status default 'pending'
) returns uuid
language plpgsql as $$
declare
  appointment_id uuid;
  starts timestamptz := local_start at time zone 'Asia/Kolkata';
begin
  insert into public.appointments
    (customer_name, phone_number, normalized_phone, appointment_start, appointment_end,
     blocked_start, blocked_end, timezone, status)
  values
    ('Test Person', phone, phone, starts, starts + make_interval(mins => minutes),
     starts, starts + make_interval(mins => minutes), 'Asia/Kolkata', initial_status)
  returning id into appointment_id;

  insert into public.appointment_services (appointment_id, service_id)
  values (appointment_id, '10000000-0000-4000-8000-00000000000a');
  return appointment_id;
end;
$$;

-- Services ------------------------------------------------------------------------------------
select throws_ok(
  $$insert into public.services (name, slug, duration_minutes) values ('Dup', 'test-service-a', 30)$$,
  '23505', null, 'service slugs are unique'
);
select throws_ok(
  $$insert into public.services (name, slug, duration_minutes) values ('Bad', 'Bad Slug', 30)$$,
  '23514', null, 'service slugs must be lowercase-hyphenated'
);
select throws_ok(
  $$insert into public.services (name, slug, duration_minutes) values ('Zero', 'zero-duration', 0)$$,
  '23514', null, 'service duration must be positive'
);
select throws_ok(
  $$insert into public.services (name, slug, duration_minutes, buffer_after_minutes) values ('Neg', 'negative-buffer', 30, -5)$$,
  '23514', null, 'service buffers cannot be negative'
);
select throws_ok(
  $$insert into public.services (name, slug, duration_minutes) values ('  padded  ', 'padded-name', 30)$$,
  '23514', null, 'service names must be trimmed'
);

-- Weekly availability -------------------------------------------------------------------------
select throws_ok(
  $$insert into public.weekly_availability (weekday) values (7)$$,
  '23514', null, 'weekday must be between 0 and 6'
);
select throws_ok(
  $$insert into public.weekly_availability (weekday) values (1)$$,
  '23505', null, 'only one configuration row per weekday'
);

delete from public.weekly_availability_intervals where weekday = 3;

select throws_ok(
  $$insert into public.weekly_availability_intervals (weekday, start_time, end_time) values (3, '12:00', '12:00')$$,
  '23514', null, 'interval end must be after start'
);
select lives_ok(
  $$insert into public.weekly_availability_intervals (weekday, start_time, end_time) values (3, '09:00', '12:00')$$,
  'a valid weekly interval can be added'
);
select throws_ok(
  $$insert into public.weekly_availability_intervals (weekday, start_time, end_time) values (3, '11:00', '14:00')$$,
  '23P01', null, 'overlapping intervals on the same weekday are rejected'
);
select lives_ok(
  $$insert into public.weekly_availability_intervals (weekday, start_time, end_time) values (3, '12:00', '13:00')$$,
  'adjacent intervals are allowed (half-open ranges)'
);
select lives_ok(
  $$insert into public.weekly_availability_intervals (weekday, start_time, end_time) values (3, '20:00', '24:00')$$,
  '24:00 can be used as end of day'
);
select lives_ok(
  $$insert into public.weekly_availability_intervals (weekday, start_time, end_time) values (4, '09:00', '10:00')$$,
  'the same hours may exist on different weekdays'
);
select lives_ok(
  $$update public.weekly_availability set is_closed = false where weekday = 0$$,
  'Sunday is configurable like any other weekday (not hard-coded closed)'
);

-- Date overrides ------------------------------------------------------------------------------
insert into public.date_overrides (id, override_date, is_closed)
values ('20000000-0000-4000-8000-000000000001', '2030-01-09', false);

select throws_ok(
  $$insert into public.date_overrides (override_date) values ('2030-01-09')$$,
  '23505', null, 'at most one override per date'
);
select lives_ok(
  $$insert into public.date_override_intervals (date_override_id, start_time, end_time)
    values ('20000000-0000-4000-8000-000000000001', '10:00', '12:00')$$,
  'custom hours can be attached to an override'
);
select throws_ok(
  $$insert into public.date_override_intervals (date_override_id, start_time, end_time)
    values ('20000000-0000-4000-8000-000000000001', '11:00', '13:00')$$,
  '23P01', null, 'override intervals cannot overlap'
);
select throws_ok(
  $$insert into public.date_overrides (override_date, reason) values ('2030-01-10', repeat('x', 501))$$,
  '23514', null, 'override reason is length-limited'
);

-- Appointment field validation ------------------------------------------------------------------
select throws_ok(
  $$insert into public.appointments (customer_name, phone_number, normalized_phone, appointment_start, appointment_end, blocked_start, blocked_end, timezone, status)
    values ('X', '+15555550123', '+15555550123', '2030-01-07 05:00Z', '2030-01-07 05:30Z', '2030-01-07 05:00Z', '2030-01-07 05:30Z', 'Asia/Kolkata', 'approved')$$,
  '22P02', null, 'unknown status values are rejected'
);
select throws_ok(
  $$insert into public.appointments (customer_name, phone_number, normalized_phone, appointment_start, appointment_end, blocked_start, blocked_end, timezone)
    values ('X', '+15555550123', '+15555550123', '2030-01-07 05:00Z', '2030-01-07 05:30Z', '2030-01-07 05:00Z', '2030-01-07 05:30Z', 'Mars/Phobos')$$,
  '22023', null, 'timezone must be a valid IANA zone'
);
select throws_ok(
  $$insert into public.appointments (customer_name, phone_number, normalized_phone, appointment_start, appointment_end, blocked_start, blocked_end, timezone)
    values ('X', '12345', '12345', '2030-01-07 05:00Z', '2030-01-07 05:30Z', '2030-01-07 05:00Z', '2030-01-07 05:30Z', 'Asia/Kolkata')$$,
  '23514', null, 'normalized_phone must be E.164'
);
select throws_ok(
  $$insert into public.appointments (customer_name, phone_number, normalized_phone, email, appointment_start, appointment_end, blocked_start, blocked_end, timezone)
    values ('X', '+15555550123', '+15555550123', 'Upper@Example.com', '2030-01-07 05:00Z', '2030-01-07 05:30Z', '2030-01-07 05:00Z', '2030-01-07 05:30Z', 'Asia/Kolkata')$$,
  '23514', null, 'email must be stored normalised (lower-case)'
);
select throws_ok(
  $$insert into public.appointments (customer_name, phone_number, normalized_phone, appointment_start, appointment_end, blocked_start, blocked_end, timezone)
    values ('X', '+15555550123', '+15555550123', '2030-01-07 05:30Z', '2030-01-07 05:30Z', '2030-01-07 05:30Z', '2030-01-07 05:30Z', 'Asia/Kolkata')$$,
  '23514', null, 'appointment end must be after start'
);
select throws_ok(
  $$insert into public.appointments (customer_name, phone_number, normalized_phone, appointment_start, appointment_end, blocked_start, blocked_end, timezone)
    values ('X', '+15555550123', '+15555550123', '2030-01-07 05:00Z', '2030-01-07 05:30Z', '2030-01-07 05:10Z', '2030-01-07 05:30Z', 'Asia/Kolkata')$$,
  '23514', null, 'blocked range must cover the consultation'
);
select throws_ok(
  $$insert into public.appointments (customer_name, phone_number, normalized_phone, appointment_start, appointment_end, blocked_start, blocked_end, timezone, status)
    values ('X', '+15555550123', '+15555550123', '2030-01-07 05:00Z', '2030-01-07 05:30Z', '2030-01-07 05:00Z', '2030-01-07 05:30Z', 'Asia/Kolkata', 'cancelled')$$,
  '23514', null, 'new appointments must start as pending or confirmed'
);
select throws_ok(
  $$insert into public.appointments (customer_name, phone_number, normalized_phone, message, appointment_start, appointment_end, blocked_start, blocked_end, timezone)
    values ('X', '+15555550123', '+15555550123', repeat('m', 1001), '2030-01-07 05:00Z', '2030-01-07 05:30Z', '2030-01-07 05:00Z', '2030-01-07 05:30Z', 'Asia/Kolkata')$$,
  '23514', null, 'visitor message is length-limited'
);

-- Public reference ------------------------------------------------------------------------------
select matches(
  private.generate_public_reference(),
  '^AZR-[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$',
  'public references use the AZR-XXXXX-XXXXX Crockford base32 format'
);
select is(
  (select count(distinct private.generate_public_reference())::int from generate_series(1, 500)),
  500,
  'generated public references are not repeated'
);

create temporary table booked (label text primary key, id uuid not null);

-- Timezone semantics --------------------------------------------------------------------------
insert into booked values ('after_midnight', pg_temp.book('+15555550190', '2030-01-08 00:15', 30));
select is(
  (select local_date from public.appointments where id = (select id from booked where label = 'after_midnight')),
  '2030-01-08'::date,
  'local_date follows the consultation timezone, not UTC (00:15 IST is the previous day in UTC)'
);

-- Overlap prevention (single provider) ------------------------------------------------------------
insert into booked values ('x_morning', pg_temp.book('+15555550111', '2030-01-07 10:00', 60));

select throws_ok(
  $$select pg_temp.book('+15555550122', '2030-01-07 10:30', 30)$$,
  '23P01', null, 'overlapping capacity-reserving appointments are rejected'
);
select lives_ok(
  $$insert into booked values ('z_adjacent', pg_temp.book('+15555550133', '2030-01-07 11:00', 30))$$,
  'back-to-back appointments are allowed'
);

-- Daily identity rule -------------------------------------------------------------------------
select throws_ok(
  $$select pg_temp.book('+15555550111', '2030-01-07 15:00', 30)$$,
  '23505', null, 'same phone cannot hold two active appointments on one local date'
);
select lives_ok(
  $$select pg_temp.book('+15555550111', '2030-01-10 15:00', 30)$$,
  'same phone can book on a different date'
);

-- Releasing capacity ----------------------------------------------------------------------------
update public.appointments set status = 'cancelled' where id = (select id from booked where label = 'x_morning');

select is(
  (select reserves_capacity from public.appointments where id = (select id from booked where label = 'x_morning')),
  false,
  'cancelled appointments do not reserve capacity'
);
select lives_ok(
  $$select pg_temp.book('+15555550122', '2030-01-07 10:00', 60)$$,
  'a cancelled appointment releases its slot'
);
select lives_ok(
  $$select pg_temp.book('+15555550111', '2030-01-07 15:00', 30)$$,
  'a cancelled appointment releases the daily limit'
);

insert into booked values ('declined', pg_temp.book('+15555550144', '2030-01-11 10:00', 30));
update public.appointments set status = 'declined' where id = (select id from booked where label = 'declined');
select is(
  (select reserves_capacity from public.appointments where id = (select id from booked where label = 'declined')),
  false,
  'declined appointments do not reserve capacity'
);

insert into booked values ('flow', pg_temp.book('+15555550155', '2030-01-12 10:00', 30));
select results_eq(
  $$select reserves_capacity from public.appointments where id = (select id from booked where label = 'flow')$$,
  array[true],
  'pending appointments reserve capacity'
);

-- Status transitions --------------------------------------------------------------------------
select lives_ok(
  $$update public.appointments set status = 'confirmed' where id = (select id from booked where label = 'flow')$$,
  'pending -> confirmed is allowed'
);
select throws_ok(
  $$update public.appointments set status = 'pending' where id = (select id from booked where label = 'flow')$$,
  'P0001', 'invalid appointment status transition: confirmed -> pending',
  'confirmed -> pending is rejected'
);
select lives_ok(
  $$update public.appointments set status = 'reschedule_requested' where id = (select id from booked where label = 'flow')$$,
  'confirmed -> reschedule_requested is allowed'
);
select lives_ok(
  $$update public.appointments
      set appointment_start = appointment_start + interval '1 hour',
          appointment_end = appointment_end + interval '1 hour',
          blocked_start = blocked_start + interval '1 hour',
          blocked_end = blocked_end + interval '1 hour',
          status = 'confirmed'
    where id = (select id from booked where label = 'flow')$$,
  'reschedule_requested -> confirmed with a new time is allowed'
);
select throws_ok(
  $$update public.appointments set status = 'confirmed' where id = (select id from booked where label = 'x_morning')$$,
  'P0001', 'invalid appointment status transition: cancelled -> confirmed',
  'cancelled is terminal'
);
select throws_ok(
  $$update public.appointments set status = 'pending' where id = (select id from booked where label = 'declined')$$,
  'P0001', null,
  'declined is terminal'
);
select throws_ok(
  $$update public.appointments set public_reference = 'AZR-00000-00000' where id = (select id from booked where label = 'flow')$$,
  '23514', null, 'public_reference is immutable'
);

-- Audit trail ---------------------------------------------------------------------------------
select results_eq(
  $$select event_type, previous_status::text, new_status::text
      from public.appointment_events
     where appointment_id = (select id from booked where label = 'flow')
     order by created_at$$,
  $$values ('created', null, 'pending'),
           ('status_changed', 'pending', 'confirmed'),
           ('status_changed', 'confirmed', 'reschedule_requested'),
           ('status_changed', 'reschedule_requested', 'confirmed'),
           ('rescheduled', null, null)$$,
  'creation, status changes and reschedules are audited'
);

update public.appointments
   set email = 'private.person@example.com', private_admin_notes = 'secret note'
 where id = (select id from booked where label = 'flow');

select is(
  (select metadata from public.appointment_events
    where appointment_id = (select id from booked where label = 'flow') and event_type = 'details_updated'),
  '{"fields": ["email"]}'::jsonb,
  'detail changes record field names only, never values'
);
select is(
  (select count(*)::int from public.appointment_events
    where appointment_id = (select id from booked where label = 'flow')
      and (metadata::text like '%private.person%' or metadata::text like '%secret note%')),
  0,
  'audit metadata contains no personal data or note text'
);
select throws_ok(
  $$insert into public.appointment_events (appointment_id, event_type) values ((select id from booked where label = 'flow'), 'status_changed')$$,
  '23514', null, 'status_changed events must record both statuses'
);

-- Service snapshots ---------------------------------------------------------------------------
insert into booked values ('multi', pg_temp.book('+15555550166', '2030-01-13 10:00', 120));

select lives_ok(
  $$insert into public.appointment_services
      (appointment_id, service_id, position, service_name_snapshot, duration_minutes_snapshot)
    values ((select id from booked where label = 'multi'), '10000000-0000-4000-8000-00000000000b', 1, 'Spoofed name', 1)$$,
  'a second service can be added to the same appointment'
);
select results_eq(
  $$select service_name_snapshot, duration_minutes_snapshot, buffer_before_minutes_snapshot, buffer_after_minutes_snapshot
      from public.appointment_services
     where appointment_id = (select id from booked where label = 'multi')
     order by position$$,
  $$values ('Test Service A', 30, 0, 0), ('Test Service B', 60, 5, 10)$$,
  'snapshots come from the service record, not caller input'
);

update public.services set name = 'Renamed Service B', duration_minutes = 90
 where id = '10000000-0000-4000-8000-00000000000b';

select is(
  (select service_name_snapshot || ':' || duration_minutes_snapshot from public.appointment_services
    where appointment_id = (select id from booked where label = 'multi') and position = 1),
  'Test Service B:60',
  'editing a service does not rewrite booked snapshots'
);
select throws_ok(
  $$insert into public.appointment_services (appointment_id, service_id)
    values ((select id from booked where label = 'multi'), '10000000-0000-4000-8000-00000000000b')$$,
  '23505', null, 'the same service cannot be added twice to one appointment'
);
select throws_ok(
  $$insert into public.appointment_services (appointment_id, service_id)
    values ((select id from booked where label = 'multi'), '10000000-0000-4000-8000-00000000000c')$$,
  '23514', null, 'inactive services cannot be booked'
);
select throws_ok(
  $$delete from public.services where id = '10000000-0000-4000-8000-00000000000a'$$,
  '23503', null, 'a booked service cannot be hard-deleted'
);

-- Appointment must include at least one service (deferred, checked at commit) -------------------
with inserted as (
  insert into public.appointments
    (customer_name, phone_number, normalized_phone, appointment_start, appointment_end, blocked_start, blocked_end, timezone)
  values ('Orphan', '+15555550177', '+15555550177', '2030-01-14 05:00Z', '2030-01-14 05:30Z', '2030-01-14 05:00Z', '2030-01-14 05:30Z', 'Asia/Kolkata')
  returning id
)
insert into booked (label, id) select 'orphan', id from inserted;

select throws_ok(
  $$set constraints appointments_require_service immediate$$,
  '23514', null, 'an appointment without services is rejected at commit'
);
delete from public.appointments where id = (select id from booked where label = 'orphan');
set constraints appointments_require_service deferred;

-- Site settings -------------------------------------------------------------------------------
select throws_ok(
  $$insert into public.site_settings (id) values (false)$$,
  '23514', null, 'site_settings is a singleton'
);
select throws_ok(
  $$update public.site_settings set public_phone = '01234 567890'$$,
  '23514', null, 'public phone numbers must be E.164'
);
select throws_ok(
  $$update public.site_settings set booking_horizon_days = 0$$,
  '23514', null, 'booking horizon must be at least one day'
);

select * from finish();
rollback;
