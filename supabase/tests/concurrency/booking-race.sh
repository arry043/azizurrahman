#!/usr/bin/env bash
# Concurrency check for the booking constraints (local Supabase only).
#
# Two independent sessions try to reserve conflicting appointments at the same time. Session A
# holds its transaction open; session B must block on the constraint and fail once A commits.
# Run: npm run db:test:concurrency   (requires `supabase start`)
set -euo pipefail

CONTAINER="${SUPABASE_DB_CONTAINER:-supabase_db_azizurrahman}"
PSQL=(docker exec -i "$CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -qAt)
SERVICE_ID="00000000-0000-4000-8000-0000000000c1"

cleanup() {
  "${PSQL[@]}" >/dev/null <<SQL
delete from public.appointments where normalized_phone in ('+15555550901', '+15555550902', '+15555550903');
delete from public.services where id = '$SERVICE_ID';
SQL
}
trap cleanup EXIT
cleanup

"${PSQL[@]}" >/dev/null <<SQL
insert into public.services (id, name, slug, duration_minutes, is_active)
values ('$SERVICE_ID', 'Concurrency check', 'concurrency-check', 30, true);
SQL

book_sql() { # phone, utc_start, hold_seconds
  cat <<SQL
begin;
with a as (
  insert into public.appointments (customer_name, phone_number, normalized_phone, appointment_start,
    appointment_end, blocked_start, blocked_end, timezone)
  values ('Race', '$1', '$1', '$2', timestamptz '$2' + interval '30 minutes', '$2',
    timestamptz '$2' + interval '30 minutes', 'Asia/Kolkata')
  returning id)
insert into public.appointment_services (appointment_id, service_id) select id, '$SERVICE_ID' from a;
select pg_sleep($3);
commit;
SQL
}

race() { # label, phone_a, start_a, phone_b, start_b, expected_sqlstate_text
  local label=$1
  book_sql "$2" "$3" 2 | "${PSQL[@]}" >/dev/null &
  local a_pid=$!
  sleep 0.5
  local b_out
  if b_out=$(book_sql "$4" "$5" 0 | "${PSQL[@]}" 2>&1); then
    wait "$a_pid"
    echo "FAIL  $label — second booking unexpectedly succeeded"
    return 1
  fi
  wait "$a_pid"
  if grep -q "$6" <<<"$b_out"; then
    echo "PASS  $label — second session rejected ($6)"
  else
    echo "FAIL  $label — unexpected error: $b_out"
    return 1
  fi
}

race "same slot, different phones" \
  +15555550901 "2032-03-01 05:00Z" +15555550902 "2032-03-01 05:15Z" "appointments_no_overlap"
race "same phone, same local date, different times" \
  +15555550903 "2032-03-02 05:00Z" +15555550903 "2032-03-02 09:00Z" "appointments_one_active_per_phone_per_day"
