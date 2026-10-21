-- Expose create_guest_booking, consume_rate_limit, and cleanup_expired_rate_limits
-- in the public schema for service_role PostgREST access.
-- Explicitly revokes all execution permissions from public, anon, and authenticated so public visitors
-- cannot call them directly through the Data API (RLS / access boundary preservation).

create or replace function public.create_guest_booking(
  p_customer_name text,
  p_phone_number text,
  p_normalized_phone text,
  p_email text,
  p_preferred_contact_method public.contact_method,
  p_message text,
  p_appointment_start timestamptz,
  p_appointment_end timestamptz,
  p_blocked_start timestamptz,
  p_blocked_end timestamptz,
  p_timezone text,
  p_service_ids uuid[],
  p_idempotency_key text default null,
  p_request_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.create_guest_booking(
    p_customer_name,
    p_phone_number,
    p_normalized_phone,
    p_email,
    p_preferred_contact_method,
    p_message,
    p_appointment_start,
    p_appointment_end,
    p_blocked_start,
    p_blocked_end,
    p_timezone,
    p_service_ids,
    p_idempotency_key,
    p_request_hash
  );
end;
$$;

revoke all on function public.create_guest_booking(
  text, text, text, text, public.contact_method, text,
  timestamptz, timestamptz, timestamptz, timestamptz, text, uuid[], text, text
) from public, anon, authenticated;

grant execute on function public.create_guest_booking(
  text, text, text, text, public.contact_method, text,
  timestamptz, timestamptz, timestamptz, timestamptz, text, uuid[], text, text
) to service_role;

create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.consume_rate_limit(
    p_key,
    p_limit,
    p_window_seconds
  );
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

create or replace function public.cleanup_expired_rate_limits(
  p_batch_size integer default 1000
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.cleanup_expired_rate_limits(p_batch_size);
end;
$$;

revoke all on function public.cleanup_expired_rate_limits(integer) from public, anon, authenticated;
grant execute on function public.cleanup_expired_rate_limits(integer) to service_role;
