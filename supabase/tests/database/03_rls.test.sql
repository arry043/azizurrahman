-- Row Level Security and grants, exercised as each API role:
--   anon (public visitor) · authenticated non-admin · inactive admin · active admin.
-- Role switching mirrors what PostgREST does: SET ROLE + request.jwt.claims.
begin;
create extension if not exists pgtap with schema extensions;

select plan(47);

-- Fixtures (as table owner) ---------------------------------------------------------------------
insert into auth.users (id, email) values
  ('a0000000-0000-4000-8000-000000000001', 'rls-admin@example.test'),
  ('a0000000-0000-4000-8000-000000000002', 'rls-inactive-admin@example.test'),
  ('a0000000-0000-4000-8000-000000000003', 'rls-user@example.test');

insert into public.admin_profiles (id, display_name, is_active) values
  ('a0000000-0000-4000-8000-000000000001', 'RLS Admin', true),
  ('a0000000-0000-4000-8000-000000000002', 'RLS Inactive Admin', false);

insert into public.services (id, name, slug, duration_minutes, is_active) values
  ('b0000000-0000-4000-8000-000000000001', 'RLS Active', 'rls-active', 30, true),
  ('b0000000-0000-4000-8000-000000000002', 'RLS Inactive', 'rls-inactive', 30, false);

with appointment as (
  insert into public.appointments
    (id, customer_name, phone_number, normalized_phone, email, message, private_admin_notes,
     appointment_start, appointment_end, blocked_start, blocked_end, timezone)
  values
    ('c0000000-0000-4000-8000-000000000001', 'RLS Visitor', '+15555550188', '+15555550188',
     'rls.visitor@example.com', 'private message', 'private admin note',
     '2031-02-03 05:00Z', '2031-02-03 05:30Z', '2031-02-03 05:00Z', '2031-02-03 05:30Z', 'Asia/Kolkata')
  returning id
)
insert into public.appointment_services (appointment_id, service_id)
select id, 'b0000000-0000-4000-8000-000000000001' from appointment;

insert into public.date_overrides (override_date, reason) values ('2031-02-04', 'private reason');

-- =============================================================================================
-- Anonymous visitor
-- =============================================================================================
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

select results_eq(
  $$select slug from public.services where slug like 'rls-%' order by slug$$,
  array['rls-active'],
  'anon sees active services only'
);
select is(
  (select count(*)::int from public.services where not is_active), 0,
  'anon cannot see any inactive service'
);
select is((select count(*)::int from public.weekly_availability), 7, 'anon can read the weekly schedule');
select is((select count(*)::int from public.site_settings), 1, 'anon can read public site settings');

select throws_ok($$select * from public.appointments$$, '42501', null, 'anon cannot read appointments');
select throws_ok($$select * from public.appointment_services$$, '42501', null, 'anon cannot read appointment services');
select throws_ok($$select * from public.appointment_events$$, '42501', null, 'anon cannot read audit history');
select throws_ok($$select * from public.admin_profiles$$, '42501', null, 'anon cannot read admin profiles');
select throws_ok($$select * from public.date_overrides$$, '42501', null, 'anon cannot read date overrides (private reasons)');
select throws_ok(
  $$insert into public.appointments (customer_name, phone_number, normalized_phone, appointment_start, appointment_end, blocked_start, blocked_end, timezone)
    values ('Anon', '+15555550199', '+15555550199', '2031-02-05 05:00Z', '2031-02-05 05:30Z', '2031-02-05 05:00Z', '2031-02-05 05:30Z', 'Asia/Kolkata')$$,
  '42501', null, 'anon cannot insert appointments directly'
);
select throws_ok(
  $$insert into public.services (name, slug, duration_minutes) values ('Anon', 'anon-service', 30)$$,
  '42501', null, 'anon cannot create services'
);
select throws_ok($$update public.site_settings set booking_horizon_days = 5$$, '42501', null, 'anon cannot change settings');
select throws_ok($$update public.weekly_availability set is_closed = false$$, '42501', null, 'anon cannot change the weekly schedule');
select throws_ok($$select private.is_admin()$$, '42501', null, 'anon cannot call private helpers');

-- =============================================================================================
-- Authenticated, but not an admin
-- =============================================================================================
reset role;
select set_config('request.jwt.claims',
  '{"sub":"a0000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
set local role authenticated;

select is(private.is_admin(), false, 'a regular user is not an admin');
select is((select count(*)::int from public.appointments), 0, 'a regular user sees no appointments');
select is((select count(*)::int from public.appointment_events), 0, 'a regular user sees no audit history');
select is((select count(*)::int from public.date_overrides), 0, 'a regular user sees no date overrides');
select is((select count(*)::int from public.admin_profiles), 0, 'a regular user sees no admin profiles');
select results_eq(
  $$select slug from public.services where slug like 'rls-%' order by slug$$,
  array['rls-active'],
  'a regular user sees active services only'
);
select throws_ok(
  $$insert into public.admin_profiles (id) values ('a0000000-0000-4000-8000-000000000003')$$,
  '42501', null, 'a user cannot promote themselves to admin'
);
select throws_ok(
  $$update public.admin_profiles set is_active = true$$,
  '42501', null, 'a user cannot modify admin profiles'
);
select throws_ok(
  $$insert into public.appointments (customer_name, phone_number, normalized_phone, appointment_start, appointment_end, blocked_start, blocked_end, timezone)
    values ('User', '+15555550199', '+15555550199', '2031-02-05 05:00Z', '2031-02-05 05:30Z', '2031-02-05 05:00Z', '2031-02-05 05:30Z', 'Asia/Kolkata')$$,
  '42501', null, 'a regular user cannot insert appointments'
);
select throws_ok(
  $$insert into public.weekly_availability_intervals (weekday, start_time, end_time) values (2, '06:00', '07:00')$$,
  '42501', null, 'a regular user cannot add working hours'
);
select results_eq(
  $$with changed as (update public.site_settings set booking_horizon_days = 5 returning 1) select count(*)::int from changed$$,
  array[0],
  'a regular user cannot update settings (no rows affected)'
);

-- Client-controlled claims must not grant admin rights.
reset role;
select set_config('request.jwt.claims',
  '{"sub":"a0000000-0000-4000-8000-000000000003","role":"authenticated","app_metadata":{"role":"admin"},"user_metadata":{"role":"admin","is_admin":true}}', true);
set local role authenticated;

select is(private.is_admin(), false, 'role claims in JWT metadata do not make a user an admin');
select is((select count(*)::int from public.appointments), 0, 'metadata role claims do not expose appointments');

-- =============================================================================================
-- Inactive admin
-- =============================================================================================
reset role;
select set_config('request.jwt.claims',
  '{"sub":"a0000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;

select is(private.is_admin(), false, 'an inactive admin is not treated as an admin');
select is((select count(*)::int from public.appointments), 0, 'an inactive admin sees no appointments');
select results_eq(
  $$with changed as (update public.services set display_order = 99 returning 1) select count(*)::int from changed$$,
  array[0],
  'an inactive admin cannot change services'
);

-- =============================================================================================
-- Active admin
-- =============================================================================================
reset role;
select set_config('request.jwt.claims',
  '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

select is(private.is_admin(), true, 'an active admin is recognised');
select is(
  (select private_admin_notes from public.appointments where id = 'c0000000-0000-4000-8000-000000000001'),
  'private admin note',
  'admins can read appointments including private notes'
);
select is(
  (select count(*)::int from public.services where slug like 'rls-%'), 2,
  'admins can see inactive services'
);
select is(
  (select count(*)::int from public.date_overrides where override_date = '2031-02-04'), 1,
  'admins can read date overrides'
);
select is((select count(*)::int from public.admin_profiles), 2, 'admins can list admin profiles');

select lives_ok(
  $$update public.appointments set status = 'confirmed' where id = 'c0000000-0000-4000-8000-000000000001'$$,
  'admins can confirm a pending appointment'
);
select is(
  (select actor_admin_id from public.appointment_events
    where appointment_id = 'c0000000-0000-4000-8000-000000000001' and event_type = 'status_changed'),
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'status changes record the acting admin'
);
select throws_ok(
  $$update public.appointments set status = 'pending' where id = 'c0000000-0000-4000-8000-000000000001'$$,
  'P0001', null, 'admins cannot bypass the status transition rules'
);

select throws_ok(
  $$insert into public.appointment_events (appointment_id, event_type) values ('c0000000-0000-4000-8000-000000000001', 'created')$$,
  '42501', null, 'admins cannot forge audit events'
);
select throws_ok(
  $$update public.appointment_events set event_type = 'created'$$,
  '42501', null, 'admins cannot edit audit events'
);
select throws_ok(
  $$delete from public.appointment_events$$,
  '42501', null, 'admins cannot delete audit events'
);
select throws_ok(
  $$delete from public.appointments where id = 'c0000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'admins cannot hard-delete appointments (cancel instead)'
);
select throws_ok(
  $$update public.appointment_services set service_name_snapshot = 'Edited'$$,
  '42501', null, 'admins cannot edit booked service snapshots'
);
select throws_ok(
  $$update public.admin_profiles set is_active = true where id = 'a0000000-0000-4000-8000-000000000002'$$,
  '42501', null, 'admin accounts are not managed through the API'
);

select lives_ok(
  $$insert into public.services (name, slug, duration_minutes) values ('RLS Admin Created', 'rls-admin-created', 45)$$,
  'admins can create services'
);
select results_eq(
  $$with changed as (update public.site_settings set booking_horizon_days = 30 returning 1) select count(*)::int from changed$$,
  array[1],
  'admins can update site settings'
);
select lives_ok(
  $$update public.weekly_availability set is_closed = false where weekday = 0$$,
  'admins can open Sunday (no hard-coded closures)'
);

reset role;

select * from finish();
rollback;
