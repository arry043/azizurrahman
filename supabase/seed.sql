-- =============================================================================================
-- AZIZURRAHMAN · LOCAL DEVELOPMENT SEED — NOT CLIENT-APPROVED CONTENT
--
-- Loaded by `supabase db reset` (local only). Never run against production.
--   * Services are fictional placeholders labelled [DEV SAMPLE].
--   * Weekly hours, overrides and timezone (Asia/Kolkata) are development defaults, NOT the
--     client's schedule (docs/requirements/OPEN_QUESTIONS.md Q5, Q7, Q10).
--   * Appointments use fictional names and +1 555 01xx numbers reserved for fiction.
--   * No admin users or passwords are created. See docs/database/RLS_POLICIES.md for how to
--     provision a local admin.
-- Dates for overrides/appointments are relative to the day the seed runs.
-- =============================================================================================

-- Services ------------------------------------------------------------------------------------
insert into public.services
  (id, name, slug, short_description, description, duration_minutes,
   buffer_before_minutes, buffer_after_minutes, display_order, is_active)
values
  ('00000000-0000-4000-8000-000000000101', '[DEV SAMPLE] Short consultation', 'dev-sample-short-consultation',
   'Development placeholder — not client-approved content.',
   'Development placeholder used to exercise the catalogue and booking schema. Replace with client-approved services.',
   30, 0, 0, 10, true),
  ('00000000-0000-4000-8000-000000000102', '[DEV SAMPLE] Standard consultation', 'dev-sample-standard-consultation',
   'Development placeholder — not client-approved content.',
   'Development placeholder with an after-buffer to exercise blocked-time calculations.',
   60, 0, 10, 20, true),
  ('00000000-0000-4000-8000-000000000103', '[DEV SAMPLE] Archived service', 'dev-sample-archived-service',
   'Inactive development placeholder — must not appear publicly.',
   null,
   45, 0, 0, 30, false)
on conflict (id) do nothing;

-- Weekly schedule (development default: Mon–Sat 10:00–13:00 and 15:00–19:00; Sunday closed) ---
update public.weekly_availability set is_closed = (weekday = 0);

insert into public.weekly_availability_intervals (weekday, start_time, end_time)
select d, t.start_time, t.end_time
from generate_series(0, 6) as d
cross join (values (time '10:00', time '13:00'), (time '15:00', time '19:00')) as t (start_time, end_time)
on conflict do nothing;

-- Date overrides ------------------------------------------------------------------------------
insert into public.date_overrides (id, override_date, is_closed, reason)
values
  ('00000000-0000-4000-8000-000000000201', current_date + 7, true, '[DEV SAMPLE] One-off closure'),
  ('00000000-0000-4000-8000-000000000202', current_date + 10, false, '[DEV SAMPLE] Custom hours')
on conflict (id) do nothing;

insert into public.date_override_intervals (date_override_id, start_time, end_time)
values ('00000000-0000-4000-8000-000000000202', time '11:00', time '14:00');

-- Appointments (each statement inserts the appointment and its services together so the
-- deferred "at least one service" check passes at commit) --------------------------------------
with appointment as (
  insert into public.appointments
    (id, customer_name, phone_number, normalized_phone, email, preferred_contact_method, message,
     appointment_start, appointment_end, blocked_start, blocked_end, timezone, status)
  values
    ('00000000-0000-4000-8000-000000000301', 'Test Visitor One', '+1 555 0100', '+15555550100',
     'visitor.one@example.com', 'whatsapp', '[DEV SAMPLE] Fictional booking.',
     ((current_date + 3) + time '10:00') at time zone 'Asia/Kolkata',
     ((current_date + 3) + time '11:30') at time zone 'Asia/Kolkata',
     ((current_date + 3) + time '10:00') at time zone 'Asia/Kolkata',
     ((current_date + 3) + time '11:40') at time zone 'Asia/Kolkata',
     'Asia/Kolkata', 'pending')
  on conflict (id) do nothing
  returning id
)
insert into public.appointment_services (appointment_id, service_id, position)
select appointment.id, s.service_id, s.position
from appointment
cross join (values
  ('00000000-0000-4000-8000-000000000101'::uuid, 0),
  ('00000000-0000-4000-8000-000000000102'::uuid, 1)
) as s (service_id, position);

with appointment as (
  insert into public.appointments
    (id, customer_name, phone_number, normalized_phone, appointment_start, appointment_end,
     blocked_start, blocked_end, timezone, status)
  values
    ('00000000-0000-4000-8000-000000000302', 'Test Visitor Two', '(555) 0101', '+15555550101',
     ((current_date + 4) + time '15:00') at time zone 'Asia/Kolkata',
     ((current_date + 4) + time '15:30') at time zone 'Asia/Kolkata',
     ((current_date + 4) + time '15:00') at time zone 'Asia/Kolkata',
     ((current_date + 4) + time '15:30') at time zone 'Asia/Kolkata',
     'Asia/Kolkata', 'confirmed')
  on conflict (id) do nothing
  returning id
)
insert into public.appointment_services (appointment_id, service_id)
select appointment.id, '00000000-0000-4000-8000-000000000101'::uuid
from appointment;
