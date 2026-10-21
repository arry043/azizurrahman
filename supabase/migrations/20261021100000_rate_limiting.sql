-- =============================================================================================
-- AZIZURRAHMAN · Migration 6 — Shared rate limiting across serverless instances
-- =============================================================================================

create table if not exists public.rate_limits (
  key text primary key,
  points integer not null default 1,
  expires_at timestamptz not null
);

comment on table public.rate_limits is
  'Shared rate limit buckets across serverless instances to prevent abuse and brute force.';

create index if not exists rate_limits_expires_idx on public.rate_limits (expires_at);

-- RLS & Grants
alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from anon, authenticated;
grant all on table public.rate_limits to service_role;

-- Rate limit increment RPC function
create or replace function private.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_expires_at timestamptz;
  v_current_points integer;
  v_allowed boolean;
begin
  -- Validate inputs
  if p_key is null or char_length(btrim(p_key)) = 0 then
    raise exception 'rate limit key cannot be null or empty' using errcode = '22023';
  end if;
  if p_limit is null or p_limit <= 0 then
    raise exception 'rate limit must be a positive integer' using errcode = '22023';
  end if;
  if p_window_seconds is null or p_window_seconds <= 0 then
    raise exception 'rate limit window must be a positive integer' using errcode = '22023';
  end if;

  -- Delete expired entry for this specific key
  delete from public.rate_limits
   where key = p_key
     and expires_at <= v_now;

  -- Opportunistic garbage collection of expired buckets across the table (~5% of calls, strictly bounded to 100 rows to prevent write lock stalls)
  if random() < 0.05 then
    delete from public.rate_limits
     where key in (
       select key
         from public.rate_limits
        where expires_at < v_now
        limit 100
     );
  end if;

  -- Attempt to insert a new bucket
  v_expires_at := v_now + (p_window_seconds || ' seconds')::interval;

  insert into public.rate_limits (key, points, expires_at)
  values (p_key, 1, v_expires_at)
  on conflict (key) do update
    set points = public.rate_limits.points + 1
  returning points, expires_at into v_current_points, v_expires_at;

  v_allowed := v_current_points <= p_limit;

  return jsonb_build_object(
    'allowed', v_allowed,
    'current_points', v_current_points,
    'limit', p_limit,
    'reset_at', extract(epoch from v_expires_at)::bigint,
    'retry_after', greatest(0, extract(epoch from (v_expires_at - v_now))::integer)
  );
end;
$$;

revoke all on function private.consume_rate_limit(text, integer, integer) from public;
grant execute on function private.consume_rate_limit(text, integer, integer) to service_role;

-- Dedicated cleanup function for background maintenance or scheduled tasks
create or replace function private.cleanup_expired_rate_limits(
  p_batch_size integer default 1000
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch integer := greatest(1, least(coalesce(p_batch_size, 1000), 5000));
  v_deleted integer;
begin
  with expired as (
    select key
      from public.rate_limits
     where expires_at < clock_timestamp()
     limit v_batch
  )
  delete from public.rate_limits
   where key in (select key from expired);

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function private.cleanup_expired_rate_limits(integer) from public;
grant execute on function private.cleanup_expired_rate_limits(integer) to service_role;
