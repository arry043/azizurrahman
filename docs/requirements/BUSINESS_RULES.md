# Business Rules — Scheduling & Booking Policy

> **Status:** Every rule below is a **proposal** unless its approval status says otherwise. Proposals are not client-approved production policy.
> When the client decides, update the _Approval status_ column, record the date and approver, and follow the _Implementation impact_ to change the code/schema.
> **Related:** [Open questions](OPEN_QUESTIONS.md) · [Schema](../database/SCHEMA.md) · [PRD §5](../PRD.md#5-appointment-calendar-and-scheduling)

## Status legend

| Status                | Meaning                                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Confirmed**         | Explicitly requested by the client (order letter) or the brief.                                                   |
| **Awaiting approval** | Proposed default. May be implemented as a _development default_ where marked, but must be approved before launch. |
| **Method pending**    | A choice between options is still required.                                                                       |
| **Pending**           | No safe default; implementation must not depend on a value until decided.                                         |

## Policy table

| #     | Rule                                   | Proposed default                                                                                              | Approval status                                               | Implementation impact                                                                                   | Implemented in Phases 0–2?        | Safe to defer?                  |
| ----- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------- |
| BR-01 | Initial appointment status             | `pending` until an admin confirms                                                                             | Awaiting approval (order letter requires request ≠ confirmed) | `appointments.status` default `pending`; transitions trigger                                            | **Yes** — DB default              | No — needed by Phase 6          |
| BR-02 | Provider capacity                      | One appointment at a time (single provider)                                                                   | Awaiting approval                                             | Exclusion constraint `appointments_no_overlap`                                                          | **Yes** — dev default, see note A | No — before Phase 6             |
| BR-03 | Multiple services per appointment      | Allowed                                                                                                       | Confirmed (brief)                                             | `appointment_services` one-to-many                                                                      | **Yes**                           | —                               |
| BR-04 | Appointment duration                   | Sum of selected service durations                                                                             | Awaiting approval                                             | Booking RPC computes `appointment_end`; schema stores both consultation and blocked ranges              | Schema only                       | Until Phase 5                   |
| BR-05 | Buffers                                | Each service may define before/after buffers; the occupied ("blocked") range includes buffers                 | Awaiting approval                                             | `blocked_start`/`blocked_end` columns; booking RPC chooses how buffers combine                          | Schema only                       | Until Phase 5                   |
| BR-06 | Weekly closed days                     | Configurable per weekday; **no weekday is hard-coded closed**. Dev seed closes Sunday as an editable example. | Awaiting approval (which days)                                | `weekly_availability.is_closed`                                                                         | **Yes**                           | Hours must be set before launch |
| BR-07 | Working intervals / breaks             | Multiple non-overlapping intervals per weekday (e.g. 10:00–13:00, 15:00–19:00)                                | Awaiting approval                                             | `weekly_availability_intervals` with exclusion constraint                                               | **Yes**                           | —                               |
| BR-08 | Date overrides                         | A date override takes precedence over the weekly schedule; may close a date or set custom hours               | Confirmed (order letter: "block unavailable periods")         | `date_overrides` + `date_override_intervals`                                                            | **Yes**                           | —                               |
| BR-09 | Override reopening a closed weekday    | Allowed when the admin sets explicit custom hours                                                             | Awaiting approval                                             | Availability engine (Phase 5) honours override intervals even on a closed weekday; admin UI may gate it | Schema supports it                | Until Phase 5                   |
| BR-10 | Minimum advance notice                 | 24 hours (1440 minutes)                                                                                       | Awaiting approval                                             | `site_settings.min_advance_notice_minutes`                                                              | **Yes** — proposed value stored   | Until Phase 5                   |
| BR-11 | Booking horizon                        | 60 days                                                                                                       | Awaiting approval                                             | `site_settings.booking_horizon_days`                                                                    | **Yes** — proposed value stored   | Until Phase 5                   |
| BR-12 | Slot interval                          | 30 minutes between candidate start times                                                                      | Awaiting approval                                             | `site_settings.slot_interval_minutes`                                                                   | **Yes** — proposed value stored   | Until Phase 5                   |
| BR-13 | Daily booking identity                 | One capacity-reserving appointment per normalised phone per local date; other dates allowed                   | Awaiting approval                                             | Partial unique index `appointments_one_active_per_phone_per_day`                                        | **Yes** — dev default, see note A | No — before Phase 6             |
| BR-14 | Which statuses reserve capacity        | `pending`, `confirmed`, `reschedule_requested` reserve; `declined`, `cancelled` release                       | Awaiting approval                                             | Generated column `appointments.reserves_capacity` drives both BR-02 and BR-13                           | **Yes**                           | No — before Phase 6             |
| BR-15 | Cancelled / declined booking           | Releases the slot and the daily limit                                                                         | Awaiting approval                                             | Follows from BR-14                                                                                      | **Yes**                           | —                               |
| BR-16 | Status transitions                     | See [Status transitions](#status-transitions)                                                                 | Awaiting approval                                             | Trigger `appointments_guard_status_transition`                                                          | **Yes**                           | —                               |
| BR-17 | Lookup security                        | Appointment reference + OTP **or** secure one-time link; never contact detail alone                           | Method pending                                                | Phase 7 adds token-hash/OTP storage                                                                     | No — deliberately deferred        | Until Phase 7                   |
| BR-18 | Consultation timezone                  | Client-approved IANA timezone. Dev default `Asia/Kolkata` (mockup shows "Indian Standard Time")               | Pending                                                       | `CONSULTATION_TIMEZONE` env; `appointments.timezone` stores the zone used                               | Validation only                   | No — before Phase 5             |
| BR-19 | Email notifications                    | Optional; enabled after provider + domain approval                                                            | Pending (provider)                                            | Phase 12 adds notification log                                                                          | No                                | Until Phase 12                  |
| BR-20 | Phone normalisation                    | E.164; numbers without a country code use a configured default country                                        | Default country pending                                       | `normalizePhone()` + DB format check on `normalized_phone`                                              | **Yes**                           | —                               |
| BR-21 | Cancellation / rescheduling by visitor | Through secure verified link/OTP only; cutoff to be defined                                                   | Pending                                                       | Phase 7                                                                                                 | No                                | Until Phase 7                   |
| BR-22 | Schedule changes vs existing bookings  | Never silently cancel; warn admin and require explicit resolution                                             | Confirmed (PRD)                                               | Overrides do not touch `appointments`; Phase 10 UI warns                                                | **Yes** (no cascade)              | —                               |
| BR-23 | Data retention                         | Client-approved retention period                                                                              | Pending                                                       | Future purge job; FKs designed so purging an appointment removes its services/events                    | No                                | Before launch                   |

### Note A — rules enforced as development defaults

BR-02 (capacity) and BR-13 (daily identity) are enforced by **database constraints** now, rather than only in a future endpoint. We did this deliberately:

- Integrity rules that must survive concurrent requests belong in the database. Constraints are race-free, whereas application checks are not.
- Both constraints depend on the status set in BR-14 through one generated column. A cancelled or declined booking therefore never blocks a later one, which avoids the "naive unique index" problem.
- Relaxing a rule later is a small forward migration (`drop index` / `alter table … drop constraint`). Adding a rule to a table that already holds conflicting data is much harder.

If the client rejects or changes either rule, follow [MIGRATIONS.md → Changing a booking policy](../database/MIGRATIONS.md#changing-a-booking-policy).

## Status model

| Status                 | Meaning                                          | Reserves capacity (BR-14, proposed) | Terminal |
| ---------------------- | ------------------------------------------------ | ----------------------------------- | -------- |
| `pending`              | Request received; awaiting admin decision        | Yes                                 | No       |
| `confirmed`            | Admin accepted the appointment                   | Yes                                 | No       |
| `reschedule_requested` | A new time is being arranged; original slot held | Yes                                 | No       |
| `declined`             | Admin declined the request                       | No                                  | Yes      |
| `cancelled`            | Appointment cancelled                            | No                                  | Yes      |

## Status transitions

Proposed. The database enforces them in `private.appointment_status_transition_allowed()`.

| From \ To                | pending | confirmed | reschedule_requested | declined | cancelled |
| ------------------------ | ------- | --------- | -------------------- | -------- | --------- |
| **pending**              | —       | ✅        | ✅                   | ✅       | ✅        |
| **confirmed**            | ❌      | —         | ✅                   | ❌       | ✅        |
| **reschedule_requested** | ❌      | ✅        | —                    | ✅       | ✅        |
| **declined**             | ❌      | ❌        | ❌                   | —        | ❌        |
| **cancelled**            | ❌      | ❌        | ❌                   | ❌       | —         |

Rationale: terminal states are final so audit history stays meaningful. Re-activating a declined or cancelled request would need a fresh capacity check, so it is modelled as a new booking. If the client wants admins to be able to reopen bookings, change the transition function in a new migration.

## Availability precedence (for Phase 5)

1. A past date, or a date beyond the booking horizon, is unavailable.
2. A `date_overrides` row for that local date takes precedence:
   - `is_closed = true` closes the date.
   - `is_closed = false` makes its `date_override_intervals` the working hours for that date. With no intervals, the date is effectively closed.
3. Otherwise use `weekly_availability` for the weekday. `is_closed = true` closes it; otherwise its intervals apply. Closed weekdays may keep their intervals so that reopening restores them.
4. Apply minimum advance notice and slot interval.
5. Subtract the blocked ranges of appointments where `reserves_capacity = true`.
6. Re-check everything inside the booking transaction. The database constraints are the final guard.

## Timezone semantics

- The consultation timezone is an IANA name supplied through `CONSULTATION_TIMEZONE`. It is a deployment setting, not something an admin can edit, because changing it shifts the meaning of every configured hour. Whether it should be editable in the admin is [Q7](OPEN_QUESTIONS.md).
- Weekly and override intervals are **local wall-clock times** (`time` without zone) in the consultation timezone.
- Override dates are **local calendar dates** (`date`), not UTC timestamps.
- Appointments store absolute instants (`timestamptz`), the timezone used, and a generated `local_date`. The daily rule uses `local_date`.
- Intervals cannot cross midnight (`end_time > start_time`; `24:00` is allowed as end of day).
