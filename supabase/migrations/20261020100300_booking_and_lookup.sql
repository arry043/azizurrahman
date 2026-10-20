-- =============================================================================================
-- AZIZURRAHMAN · Migration 4 — guest booking RPC, idempotency keys, verification tokens
-- =============================================================================================

-- booking_idempotency_keys --------------------------------------------------------------------
create table public.booking_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null,
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  request_hash text not null,
  response_payload jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),

  constraint booking_idempotency_keys_key_unique unique (idempotency_key),
  constraint booking_idempotency_keys_key_format check (char_length(idempotency_key) between 16 and 128),
  constraint booking_idempotency_keys_hash_format check (char_length(request_hash) = 64)
);

comment on table public.booking_idempotency_keys is
  'Idempotency records for guest booking submissions to prevent duplicate bookings across retries/network drops.';

create index booking_idempotency_keys_expires_idx on public.booking_idempotency_keys (expires_at);

-- appointment_verifications -------------------------------------------------------------------
create table public.appointment_verifications (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  token_hash text not null,
  channel public.contact_method not null,
  contact_value_hash text not null,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  is_consumed boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),

  constraint appointment_verifications_attempts_range check (attempts between 0 and max_attempts),
  constraint appointment_verifications_token_hash_len check (char_length(token_hash) = 64),
  constraint appointment_verifications_contact_hash_len check (char_length(contact_value_hash) = 64)
);

comment on table public.appointment_verifications is
  'Hashed lookup/verification tokens for appointment status lookup. Raw secrets are never stored.';

create index appointment_verifications_token_hash_idx on public.appointment_verifications (token_hash);
create index appointment_verifications_appointment_idx on public.appointment_verifications (appointment_id);
create index appointment_verifications_expires_idx on public.appointment_verifications (expires_at);

-- RLS & Grants --------------------------------------------------------------------------------
alter table public.booking_idempotency_keys enable row level security;
alter table public.appointment_verifications enable row level security;

revoke all on table public.booking_idempotency_keys, public.appointment_verifications from anon, authenticated;
grant all on table public.booking_idempotency_keys, public.appointment_verifications to service_role;

-- create_guest_booking RPC --------------------------------------------------------------------
create or replace function private.create_guest_booking(
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
declare
  v_existing_payload jsonb;
  v_existing_hash text;
  v_appointment_id uuid;
  v_public_ref text;
  v_status public.appointment_status;
  v_created_at timestamptz;
  v_service_id uuid;
  v_pos smallint := 0;
  v_service_count integer;
  v_services_json jsonb;
  v_result jsonb;
begin
  -- 1. Check idempotency if key provided
  if p_idempotency_key is not null then
    select response_payload, request_hash
      into v_existing_payload, v_existing_hash
      from public.booking_idempotency_keys
      where idempotency_key = p_idempotency_key
        and expires_at > now();

    if found then
      if p_request_hash is not null and v_existing_hash <> p_request_hash then
        raise exception 'idempotency key reused with mismatched request parameters'
          using errcode = '23505';
      end if;
      return v_existing_payload;
    end if;
  end if;

  -- 2. Validate service_ids non-empty and all active
  if p_service_ids is null or cardinality(p_service_ids) = 0 then
    raise exception 'at least one service must be selected' using errcode = '23514';
  end if;

  select count(*) into v_service_count
    from public.services
    where id = any(p_service_ids)
      and is_active = true;

  if v_service_count <> cardinality(p_service_ids) then
    raise exception 'one or more selected services are inactive or invalid' using errcode = '23514';
  end if;

  -- 3. Insert appointment (triggers will validate timezone, initial status, and audit)
  insert into public.appointments (
    customer_name,
    phone_number,
    normalized_phone,
    email,
    preferred_contact_method,
    message,
    appointment_start,
    appointment_end,
    blocked_start,
    blocked_end,
    timezone,
    status
  ) values (
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
    'pending'
  )
  returning id, public_reference, status, created_at
  into v_appointment_id, v_public_ref, v_status, v_created_at;

  -- 4. Insert appointment_services snapshots
  foreach v_service_id in array p_service_ids loop
    insert into public.appointment_services (
      appointment_id,
      service_id,
      position
    ) values (
      v_appointment_id,
      v_service_id,
      v_pos
    );
    v_pos := v_pos + 1;
  end loop;

  -- 5. Fetch captured snapshots for the response
  select jsonb_agg(
    jsonb_build_object(
      'service_id', s.service_id,
      'service_name_snapshot', s.service_name_snapshot,
      'duration_minutes_snapshot', s.duration_minutes_snapshot,
      'position', s.position
    ) order by s.position
  ) into v_services_json
  from public.appointment_services s
  where s.appointment_id = v_appointment_id;

  -- 6. Construct safe receipt JSON
  v_result := jsonb_build_object(
    'appointment_id', v_appointment_id,
    'public_reference', v_public_ref,
    'customer_name', p_customer_name,
    'status', v_status,
    'appointment_start', p_appointment_start,
    'appointment_end', p_appointment_end,
    'timezone', p_timezone,
    'services', coalesce(v_services_json, '[]'::jsonb),
    'created_at', v_created_at
  );

  -- 7. Store idempotency record if key provided
  if p_idempotency_key is not null and p_request_hash is not null then
    insert into public.booking_idempotency_keys (
      idempotency_key,
      appointment_id,
      request_hash,
      response_payload
    ) values (
      p_idempotency_key,
      v_appointment_id,
      p_request_hash,
      v_result
    );
  end if;

  return v_result;
end;
$$;

revoke all on function private.create_guest_booking(
  text, text, text, text, public.contact_method, text,
  timestamptz, timestamptz, timestamptz, timestamptz, text, uuid[], text, text
) from public;

grant execute on function private.create_guest_booking(
  text, text, text, text, public.contact_method, text,
  timestamptz, timestamptz, timestamptz, timestamptz, text, uuid[], text, text
) to service_role;

