-- notification_logs ----------------------------------------------------------------------------
-- Append-only audit and idempotency record of outbound communications (Phase 12).
-- Written server-side via service role. Readable by authenticated administrators only.
-- Never readable or writable by anon.

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp', 'sms')),
  template text not null check (template in (
    'booking_request_received',
    'appointment_confirmed',
    'appointment_declined',
    'appointment_cancelled',
    'appointment_rescheduled'
  )),
  recipient text not null,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  provider_message_id text,
  attempt_count integer not null default 1 check (attempt_count >= 1),
  last_error_code text,
  last_error_message text,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

comment on table public.notification_logs is
  'Outbound notification audit log (Phase 12). Populated server-side. Never exposes private secrets or tokens.';

create index notification_logs_appointment_id_idx on public.notification_logs (appointment_id);
create index notification_logs_created_at_idx on public.notification_logs (created_at desc);

alter table public.notification_logs enable row level security;

revoke all on table public.notification_logs from anon, authenticated;

grant select on table public.notification_logs to authenticated;
grant all on table public.notification_logs to service_role;

create policy "Admins can view notification logs"
  on public.notification_logs for select to authenticated
  using ((select private.is_admin()));

