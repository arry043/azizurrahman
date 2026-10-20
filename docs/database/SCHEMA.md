# Database Schema

> Source of truth: `supabase/migrations/`. This document explains the design; the
> [data dictionary](DATA_DICTIONARY.md) lists every column, and [RLS_POLICIES.md](RLS_POLICIES.md) covers access.
> PostgreSQL 17 (Supabase). Last updated 2026-10-20 (Phase 2).

## Entity overview

```text
auth.users ─1:1─ admin_profiles
                      │ (actor / creator, ON DELETE SET NULL)
                      ├──────────────┬──────────────────────────┐
                      ▼              ▼                          ▼
              date_overrides   appointment_events ◄──N:1── appointments ──1:N──► appointment_services ──N:1──► services
                      │                                                            (snapshots)        (RESTRICT)
                      ▼
          date_override_intervals

weekly_availability (7 fixed rows) ──1:N──► weekly_availability_intervals

site_settings (singleton)
```

| Table                           | Purpose                                                  | Public (anon) access  |
| ------------------------------- | -------------------------------------------------------- | --------------------- |
| `admin_profiles`                | Maps auth users to authorised, active administrators     | None                  |
| `services`                      | Service catalogue                                        | Read active rows      |
| `weekly_availability`           | Open/closed flag per weekday (0 = Sunday … 6 = Saturday) | Read                  |
| `weekly_availability_intervals` | Working intervals per weekday (supports breaks)          | Read                  |
| `date_overrides`                | Closure or custom hours for one local date               | None (private reason) |
| `date_override_intervals`       | Custom hours for an override                             | None                  |
| `appointments`                  | Guest appointment requests and their status              | None                  |
| `appointment_services`          | Services in an appointment, with booking-time snapshots  | None                  |
| `appointment_events`            | Append-only audit trail                                  | None                  |
| `site_settings`                 | Non-secret public and booking settings                   | Read                  |

Not created yet, on purpose: notification tables (Phase 12, pending provider decision) and lookup-token/OTP storage (Phase 7, pending the method). Their intended shapes are in [INTEGRATIONS.md](../requirements/INTEGRATIONS.md) and [OPEN_QUESTIONS.md](../requirements/OPEN_QUESTIONS.md) Q16.

## Schemas

| Schema       | Exposed via Data API | Contents                                                                                                      |
| ------------ | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `public`     | Yes                  | Application tables and enums. Every table has RLS and explicit grants.                                        |
| `private`    | **No**               | Helper functions (`is_admin`, triggers, validation) and the `time_range` type. `anon` has no usage privilege. |
| `extensions` | n/a                  | `btree_gist`, `pgcrypto`.                                                                                     |

## Status model

`appointment_status` enum: `pending`, `confirmed`, `reschedule_requested`, `declined`, `cancelled`.

- New rows must start as `pending` (guest requests) or `confirmed` (an admin booking directly).
- Transitions are enforced by the `appointments_guard_status_transition` trigger using `private.appointment_status_transition_allowed()`. The table is in [BUSINESS_RULES.md](../requirements/BUSINESS_RULES.md#status-transitions). `declined` and `cancelled` are terminal.
- `reserves_capacity` is a **stored generated column**: `status in ('pending', 'confirmed', 'reschedule_requested')`. It is the single definition used by both booking constraints. This status set is a proposal (BR-14).
- The application mirror in `src/lib/booking/status.ts` is checked against the SQL by `tests/unit/booking-status.test.ts`.

## Availability model and precedence

1. A `date_overrides` row for the local date wins. `is_closed = true` closes the date. `is_closed = false` uses its `date_override_intervals`; with none, the date is effectively closed.
2. Otherwise `weekly_availability.is_closed` for the weekday. When open, its `weekly_availability_intervals` are the working hours.
3. The Phase 5 engine then applies the booking horizon, minimum notice and slot interval (`site_settings`), and subtracts the blocked ranges of appointments with `reserves_capacity`.

Notes:

- No weekday is hard-coded closed. The seven `weekly_availability` rows are created **closed** by the migration (safe default: nothing is bookable until configured). The development seed opens Monday–Saturday.
- Closed weekdays keep their intervals, so reopening restores the previous hours.
- Intervals are half-open `[start, end)` local times. Overlaps within a weekday or override are rejected by exclusion constraints; adjacent intervals (`09:00–12:00`, `12:00–13:00`) are allowed. They cannot cross midnight; `24:00` means end of day.
- Changing the schedule or adding overrides **never** modifies `appointments` (no triggers or cascades between them). Conflicts are surfaced to the admin in Phase 10.
- Whether an override may reopen a normally closed weekday is pending (BR-09). The schema allows it.

## Timezone semantics

| Data                                                      | Type                         | Meaning                                            |
| --------------------------------------------------------- | ---------------------------- | -------------------------------------------------- |
| `weekly_availability_intervals.start_time/end_time`       | `time`                       | Local wall-clock time in the consultation timezone |
| `date_overrides.override_date`                            | `date`                       | Local calendar date (not a UTC instant)            |
| `appointments.appointment_start/end`, `blocked_start/end` | `timestamptz`                | Absolute instants (stored as UTC)                  |
| `appointments.timezone`                                   | `text` (validated IANA name) | Zone used when the booking was made                |
| `appointments.local_date`                                 | `date`, generated            | `(appointment_start AT TIME ZONE timezone)::date`  |

The consultation timezone comes from `CONSULTATION_TIMEZONE` (server env), pending client approval (Q7). Storing it per appointment keeps historical bookings unambiguous if the setting ever changes. `local_date` is what the daily identity rule uses, so "the same day" always means the local calendar day. For example, 00:15 IST belongs to the IST date even though it is the previous day in UTC; this case is covered by pgTAP.

## Appointment times and buffers

- `appointment_start`/`appointment_end` is the consultation shown to the visitor.
- `blocked_start`/`blocked_end` is the time the provider is occupied, including buffers. A check constraint enforces `blocked_start ≤ appointment_start < appointment_end ≤ blocked_end`, and the consultation is at most 12 hours.
- How durations and buffers combine for multi-service bookings (BR-04/BR-05) is computed by the booking operation (Phase 6) from the `appointment_services` snapshots, never from client input.

## Service snapshots

`appointment_services` stores `service_name_snapshot`, `duration_minutes_snapshot` and both buffer snapshots. The `appointment_services_fill_snapshot` trigger copies them from `services` on insert and **overwrites any values supplied by the caller**. It also rejects inactive services. Editing or archiving a service afterwards does not change existing bookings. `service_id` is `ON DELETE RESTRICT`: a booked service can only be archived (`is_active = false`).

Each appointment must include at least one service. This is enforced by deferred constraint triggers (`appointments_require_service`, `appointment_services_keep_at_least_one`) that check at **commit**, so the appointment and its services must be written in the same transaction. Phase 6 will do this in a single RPC.

## Concurrency and integrity

| Rule                                                          | Mechanism                                                                                                                       | Why it is race-safe                                                                                  |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| No double-booking (single provider, BR-02 — proposed)         | `appointments_no_overlap`: `EXCLUDE USING gist (tstzrange(blocked_start, blocked_end, '[)') WITH &&) WHERE (reserves_capacity)` | PostgreSQL makes a concurrent conflicting insert wait for the first transaction, then raises `23P01` |
| One active booking per phone per local day (BR-13 — proposed) | Partial unique index `appointments_one_active_per_phone_per_day (normalized_phone, local_date) WHERE reserves_capacity`         | Unique-index insertion is serialised, so the loser raises `23505`                                    |
| Cancelled/declined release both                               | Both predicates use `reserves_capacity`                                                                                         | Status change updates the generated column, which removes the row from both partial structures       |
| Valid status transitions                                      | BEFORE UPDATE trigger                                                                                                           | Runs inside the same transaction as the update                                                       |
| Audit completeness                                            | AFTER INSERT/UPDATE trigger (security definer)                                                                                  | Cannot be skipped by API callers; written in the same transaction                                    |

Verified by `supabase/tests/database/02_constraints.test.sql` and the two-session race script `supabase/tests/concurrency/booking-race.sh`.

The Phase 6 booking operation should still re-check availability (opening hours, overrides, notice, horizon) inside its transaction. The constraints are the final guard, not the whole policy. `src/lib/errors.ts → mapDatabaseError()` turns `23P01`/`23505` on these constraint names into `SLOT_UNAVAILABLE` / `DAILY_LIMIT_REACHED`.

Capacity above one, or multiple providers, would need a provider/resource column added to the exclusion constraint. See Q12.

## Indexes

| Index                                                                                 | Purpose                                                    |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `services_slug_key` (unique)                                                          | Lookup by slug; uniqueness                                 |
| `services_active_display_order_idx` (partial, active)                                 | Public catalogue ordering                                  |
| `appointments_public_reference_key` (unique)                                          | Receipt/lookup by reference                                |
| `appointments_no_overlap` (GiST, partial)                                             | Overlap prevention; time-range queries                     |
| `appointments_one_active_per_phone_per_day` (unique, partial)                         | Daily identity rule                                        |
| `appointments_start_idx`, `appointments_status_start_idx`                             | Admin lists, upcoming appointments by status               |
| `appointments_local_date_idx`                                                         | Admin calendar by day                                      |
| `appointments_phone_date_idx`, `appointments_email_idx`                               | Admin search across all statuses                           |
| `appointments_created_at_idx`                                                         | Recent-activity lists                                      |
| `appointment_services_unique_service`, `appointment_services_service_id_idx`          | FK lookups both ways; no duplicate service per appointment |
| `appointment_events_appointment_created_idx`, `appointment_events_actor_admin_id_idx` | Audit timeline; FK                                         |
| `weekly_intervals_no_overlap`, `date_override_intervals_no_overlap` (GiST)            | Overlap prevention; FK lookups                             |
| `date_overrides_override_date_key` (unique), `date_overrides_created_by_idx`          | One override per date; FK                                  |

## Public appointment reference

`AZR-XXXXX-XXXXX`, 10 Crockford base32 characters (50 random bits) from `pgcrypto`, generated by `private.generate_public_reference()` and constrained by format and uniqueness. It is unpredictable but is **not** an authorization token. Lookup will additionally require OTP or a secret link (Phase 7). Internal UUIDs are never used as public identifiers.

## Outstanding schema decisions

| Decision                                                            | Affects                                            | Ref         |
| ------------------------------------------------------------------- | -------------------------------------------------- | ----------- |
| Final capacity-reserving statuses                                   | `reserves_capacity` expression                     | BR-14 / Q14 |
| Keep or change the daily identity rule (phone only? include email?) | Partial unique index                               | BR-13 / Q13 |
| Single provider vs multiple                                         | Exclusion constraint                               | BR-02 / Q12 |
| Lookup method (OTP vs link)                                         | New table for token hashes / OTP attempts          | BR-17 / Q16 |
| Email notifications                                                 | `notification_logs` table                          | BR-19 / Q17 |
| Retention period                                                    | Purge job (cascades are already designed for it)   | BR-23 / Q19 |
| Admin-editable timezone?                                            | Possibly move timezone from env to `site_settings` | Q7          |
