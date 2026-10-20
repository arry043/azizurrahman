# Data Dictionary

> Generated types: `src/types/database.types.ts` (`npm run db:types`). Constraint names are listed so error handling and tests can reference them.
> **Visibility:** `Public` = readable by anonymous visitors · `Admin` = active admins only · `Server` = service role / triggers only.

## admin_profiles — Admin

| Column                      | Type        | Null | Default   | Constraints / notes                                      |
| --------------------------- | ----------- | ---- | --------- | -------------------------------------------------------- |
| `id`                        | uuid        | no   | —         | PK; FK → `auth.users(id)` ON DELETE CASCADE              |
| `display_name`              | text        | yes  | —         | `admin_profiles_display_name_length`: 1–80 chars trimmed |
| `role`                      | text        | no   | `'admin'` | `admin_profiles_role_valid`: in (`admin`)                |
| `is_active`                 | boolean     | no   | `true`    | `false` revokes all admin privileges immediately         |
| `created_at` / `updated_at` | timestamptz | no   | `now()`   | `updated_at` maintained by trigger                       |

## services — Public (active rows) / Admin

| Column                                           | Type        | Null | Default             | Constraints / notes                                                                  |
| ------------------------------------------------ | ----------- | ---- | ------------------- | ------------------------------------------------------------------------------------ |
| `id`                                             | uuid        | no   | `gen_random_uuid()` | PK                                                                                   |
| `name`                                           | text        | no   | —                   | `services_name_valid`: trimmed, 1–120 chars                                          |
| `slug`                                           | text        | no   | —                   | `services_slug_key` unique; `services_slug_format`: `^[a-z0-9]+(-[a-z0-9]+)*$`, ≤ 80 |
| `short_description`                              | text        | yes  | —                   | ≤ 280                                                                                |
| `description`                                    | text        | yes  | —                   | ≤ 10 000                                                                             |
| `image_url`                                      | text        | yes  | —                   | `https://…` or site-relative `/…`, ≤ 2048                                            |
| `duration_minutes`                               | integer     | no   | —                   | `services_duration_positive`: 1–720                                                  |
| `buffer_before_minutes` / `buffer_after_minutes` | integer     | no   | `0`                 | `services_buffers_non_negative`: 0–240                                               |
| `display_order`                                  | integer     | no   | `0`                 | Catalogue order (then name)                                                          |
| `is_active`                                      | boolean     | no   | **`false`**         | Only active services are public and bookable                                         |
| `created_at` / `updated_at`                      | timestamptz | no   | `now()`             |                                                                                      |

No price column (no payments in scope).

## weekly_availability — Public

| Column                      | Type        | Null | Default | Constraints / notes                                                     |
| --------------------------- | ----------- | ---- | ------- | ----------------------------------------------------------------------- |
| `weekday`                   | smallint    | no   | —       | PK; `weekly_availability_weekday_range` 0–6 (0 = Sunday … 6 = Saturday) |
| `is_closed`                 | boolean     | no   | `true`  | Closed regardless of intervals                                          |
| `created_at` / `updated_at` | timestamptz | no   | `now()` |                                                                         |

Exactly seven rows are inserted by the migration. Admins can update them but not insert or delete.

## weekly_availability_intervals — Public

| Column                      | Type        | Null | Default             | Constraints / notes                                     |
| --------------------------- | ----------- | ---- | ------------------- | ------------------------------------------------------- |
| `id`                        | uuid        | no   | `gen_random_uuid()` | PK                                                      |
| `weekday`                   | smallint    | no   | —                   | FK → `weekly_availability(weekday)` ON DELETE CASCADE   |
| `start_time` / `end_time`   | time        | no   | —                   | Local time; `weekly_intervals_valid_range`: end > start |
| `created_at` / `updated_at` | timestamptz | no   | `now()`             |                                                         |

`weekly_intervals_no_overlap`: no two intervals on the same weekday overlap (half-open).

## date_overrides — Admin

| Column                      | Type        | Null | Default             | Constraints / notes                                   |
| --------------------------- | ----------- | ---- | ------------------- | ----------------------------------------------------- |
| `id`                        | uuid        | no   | `gen_random_uuid()` | PK                                                    |
| `override_date`             | date        | no   | —                   | `date_overrides_override_date_key` unique; local date |
| `is_closed`                 | boolean     | no   | `true`              | `false` = custom hours from child intervals           |
| `reason`                    | text        | yes  | —                   | **Private**; ≤ 500                                    |
| `created_by`                | uuid        | yes  | `auth.uid()`        | FK → `admin_profiles(id)` ON DELETE SET NULL          |
| `created_at` / `updated_at` | timestamptz | no   | `now()`             |                                                       |

## date_override_intervals — Admin

| Column                      | Type        | Null | Default             | Constraints / notes                                                         |
| --------------------------- | ----------- | ---- | ------------------- | --------------------------------------------------------------------------- |
| `id`                        | uuid        | no   | `gen_random_uuid()` | PK                                                                          |
| `date_override_id`          | uuid        | no   | —                   | FK → `date_overrides(id)` ON DELETE CASCADE                                 |
| `start_time` / `end_time`   | time        | no   | —                   | `date_override_intervals_valid_range`; `date_override_intervals_no_overlap` |
| `created_at` / `updated_at` | timestamptz | no   | `now()`             |                                                                             |

## site_settings — Public read / Admin update

Singleton (`id boolean` PK, `site_settings_singleton` check `id = true`). **No secrets.**

| Column                                                                   | Type        | Null | Default           | Constraints / notes             |
| ------------------------------------------------------------------------ | ----------- | ---- | ----------------- | ------------------------------- |
| `min_advance_notice_minutes`                                             | integer     | no   | `1440` (proposed) | 0–43 200                        |
| `booking_horizon_days`                                                   | integer     | no   | `60` (proposed)   | 1–365                           |
| `slot_interval_minutes`                                                  | integer     | no   | `30` (proposed)   | 5–240                           |
| `public_phone` / `public_whatsapp`                                       | text        | yes  | —                 | E.164; NULL until verified (Q4) |
| `public_email`                                                           | text        | yes  | —                 | lower-case, basic format, ≤ 254 |
| `public_address`, `consultation_hours_text`, `whatsapp_message_template` | text        | yes  | —                 | ≤ 500 each                      |
| `created_at` / `updated_at`                                              | timestamptz | no   | `now()`           |                                 |

## appointments — Admin / Server

| Column                                  | Type                 | Null      | Default                               | Constraints / notes                                    |
| --------------------------------------- | -------------------- | --------- | ------------------------------------- | ------------------------------------------------------ |
| `id`                                    | uuid                 | no        | `gen_random_uuid()`                   | PK; internal only, never public                        |
| `public_reference`                      | text                 | no        | `private.generate_public_reference()` | Unique; `AZR-XXXXX-XXXXX`; immutable                   |
| `customer_name`                         | text                 | no        | —                                     | 1–120 chars trimmed                                    |
| `phone_number`                          | text                 | no        | —                                     | As entered; 5–32 chars                                 |
| `normalized_phone`                      | text                 | no        | —                                     | E.164 (`appointments_normalized_phone_e164`)           |
| `email`                                 | text                 | yes       | —                                     | Lower-case, format, ≤ 254                              |
| `preferred_contact_method`              | `contact_method`     | yes       | —                                     | `phone` · `whatsapp` · `email` (Q21)                   |
| `message`                               | text                 | yes       | —                                     | ≤ 1000                                                 |
| `appointment_start` / `appointment_end` | timestamptz          | no        | —                                     | end > start; ≤ 12 h                                    |
| `blocked_start` / `blocked_end`         | timestamptz          | no        | —                                     | Covers the consultation incl. buffers                  |
| `timezone`                              | text                 | no        | —                                     | Valid IANA zone (trigger, SQLSTATE `22023`)            |
| `local_date`                            | date                 | generated | —                                     | `(appointment_start AT TIME ZONE timezone)::date`      |
| `status`                                | `appointment_status` | no        | `'pending'`                           | Initial: pending or confirmed; transitions by trigger  |
| `reserves_capacity`                     | boolean              | generated | —                                     | `status IN (pending, confirmed, reschedule_requested)` |
| `private_admin_notes`                   | text                 | yes       | —                                     | **Admin-only**; ≤ 4000; never in public responses      |
| `created_at`                            | timestamptz          | no        | `now()`                               | Immutable                                              |
| `updated_at`                            | timestamptz          | no        | `now()`                               | Set by trigger                                         |

Constraints: `appointments_public_reference_key`, `appointments_public_reference_format`, `appointments_customer_name_length`, `appointments_phone_number_length`, `appointments_normalized_phone_e164`, `appointments_email_format`, `appointments_message_length`, `appointments_private_admin_notes_length`, `appointments_valid_time_range`, `appointments_blocked_range_covers_appointment`, `appointments_no_overlap` (exclusion), and the unique index `appointments_one_active_per_phone_per_day`.

## appointment_services — Admin / Server

| Column                                                             | Type        | Null | Default             | Constraints / notes                                              |
| ------------------------------------------------------------------ | ----------- | ---- | ------------------- | ---------------------------------------------------------------- |
| `id`                                                               | uuid        | no   | `gen_random_uuid()` | PK                                                               |
| `appointment_id`                                                   | uuid        | no   | —                   | FK → `appointments(id)` ON DELETE CASCADE                        |
| `service_id`                                                       | uuid        | no   | —                   | FK → `services(id)` ON DELETE RESTRICT; must be active at insert |
| `position`                                                         | smallint    | no   | `0`                 | ≥ 0; display order within the booking                            |
| `service_name_snapshot`                                            | text        | no   | from service        | 1–120                                                            |
| `duration_minutes_snapshot`                                        | integer     | no   | from service        | > 0                                                              |
| `buffer_before_minutes_snapshot` / `buffer_after_minutes_snapshot` | integer     | no   | from service        | ≥ 0                                                              |
| `created_at`                                                       | timestamptz | no   | `now()`             |                                                                  |

`appointment_services_unique_service`: a service appears at most once per appointment. Rows are immutable through the API.

## appointment_events — Admin read / Server write

| Column                           | Type                 | Null | Default             | Constraints / notes                                                            |
| -------------------------------- | -------------------- | ---- | ------------------- | ------------------------------------------------------------------------------ |
| `id`                             | uuid                 | no   | `gen_random_uuid()` | PK                                                                             |
| `appointment_id`                 | uuid                 | no   | —                   | FK → `appointments(id)` ON DELETE CASCADE                                      |
| `actor_admin_id`                 | uuid                 | yes  | —                   | FK → `admin_profiles(id)` ON DELETE SET NULL; NULL = system                    |
| `event_type`                     | text                 | no   | —                   | `created`, `status_changed`, `rescheduled`, `details_updated`, `notes_updated` |
| `previous_status` / `new_status` | `appointment_status` | yes  | —                   | Both required (and different) for `status_changed`                             |
| `metadata`                       | jsonb                | no   | `{}`                | JSON object ≤ 4 KB; field **names** only, never contact values or note text    |
| `created_at`                     | timestamptz          | no   | `clock_timestamp()` | Real event time (orders events within one transaction)                         |

## booking_idempotency_keys — Server only

| Column             | Type        | Null | Default             | Constraints / notes                                                             |
| ------------------ | ----------- | ---- | ------------------- | ------------------------------------------------------------------------------- |
| `id`               | uuid        | no   | `gen_random_uuid()` | PK                                                                              |
| `idempotency_key`  | text        | no   | —                   | `booking_idempotency_keys_key_unique`: unique; format `^[A-Za-z0-9_-]{16,128}$` |
| `request_hash`     | text        | no   | —                   | SHA-256 hash of normalized booking payload                                      |
| `response_payload` | jsonb       | no   | —                   | Cached JSON response for safe replay                                            |
| `created_at`       | timestamptz | no   | `now()`             |                                                                                 |
| `expires_at`       | timestamptz | no   | `now() + 24 hours`  | Expiration timestamp; indexed for cleanup                                       |

## appointment_verifications — Server only

| Column             | Type        | Null | Default             | Constraints / notes                                                 |
| ------------------ | ----------- | ---- | ------------------- | ------------------------------------------------------------------- |
| `id`               | uuid        | no   | `gen_random_uuid()` | PK                                                                  |
| `public_reference` | text        | no   | —                   | `AZR-...` reference code                                            |
| `token_hash`       | text        | no   | —                   | Salted SHA-256 hash of verification code; never stored in plaintext |
| `contact_channel`  | text        | no   | —                   | `phone` or `email`                                                  |
| `contact_hash`     | text        | no   | —                   | Salted SHA-256 hash of contact identifier                           |
| `attempts`         | integer     | no   | `0`                 | Number of failed validation attempts                                |
| `max_attempts`     | integer     | no   | `5`                 | Hard limit before token invalidation                                |
| `is_consumed`      | boolean     | no   | `false`             | Set to true on successful verification                              |
| `expires_at`       | timestamptz | no   | `now() + 15 mins`   | 15-minute challenge window                                          |
| `created_at`       | timestamptz | no   | `now()`             |                                                                     |

## booking_idempotency_keys — Server only

| Column             | Type        | Null | Default             | Constraints / notes                                                             |
| ------------------ | ----------- | ---- | ------------------- | ------------------------------------------------------------------------------- |
| `id`               | uuid        | no   | `gen_random_uuid()` | PK                                                                              |
| `idempotency_key`  | text        | no   | —                   | `booking_idempotency_keys_key_unique`: unique; format `^[A-Za-z0-9_-]{16,128}$` |
| `request_hash`     | text        | no   | —                   | SHA-256 hash of normalized booking payload                                      |
| `response_payload` | jsonb       | no   | —                   | Cached JSON response for safe replay                                            |
| `created_at`       | timestamptz | no   | `now()`             |                                                                                 |
| `expires_at`       | timestamptz | no   | `now() + 24 hours`  | Expiration timestamp; indexed for cleanup                                       |

## appointment_verifications — Server only

| Column             | Type        | Null | Default             | Constraints / notes                                                 |
| ------------------ | ----------- | ---- | ------------------- | ------------------------------------------------------------------- |
| `id`               | uuid        | no   | `gen_random_uuid()` | PK                                                                  |
| `public_reference` | text        | no   | —                   | `AZR-...` reference code                                            |
| `token_hash`       | text        | no   | —                   | Salted SHA-256 hash of verification code; never stored in plaintext |
| `contact_channel`  | text        | no   | —                   | `phone` or `email`                                                  |
| `contact_hash`     | text        | no   | —                   | Salted SHA-256 hash of contact identifier                           |
| `attempts`         | integer     | no   | `0`                 | Number of failed validation attempts                                |
| `max_attempts`     | integer     | no   | `5`                 | Hard limit before token invalidation                                |
| `is_consumed`      | boolean     | no   | `false`             | Set to true on successful verification                              |
| `expires_at`       | timestamptz | no   | `now() + 15 mins`   | 15-minute challenge window                                          |
| `created_at`       | timestamptz | no   | `now()`             |                                                                     |

## Enums

| Enum                 | Values                                                                  |
| -------------------- | ----------------------------------------------------------------------- |
| `appointment_status` | `pending`, `confirmed`, `reschedule_requested`, `declined`, `cancelled` |
| `contact_method`     | `phone`, `whatsapp`, `email`                                            |

## Private functions (not callable through the Data API)

| Function                                                  | Kind                                            | Purpose                                                |
| --------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| `private.is_admin()`                                      | SQL, `SECURITY DEFINER`, stable                 | Current JWT subject has an active `admin_profiles` row |
| `private.is_valid_timezone(text)`                         | SQL, stable                                     | IANA zone validation against `pg_timezone_names`       |
| `private.generate_public_reference()`                     | PL/pgSQL, volatile                              | Random `AZR-…` reference                               |
| `private.appointment_status_transition_allowed(from, to)` | SQL, immutable                                  | Transition table                                       |
| `private.set_updated_at()`                                | Trigger                                         | `updated_at` maintenance                               |
| `private.appointments_before_write()`                     | Trigger                                         | Timezone, initial status, immutability, transitions    |
| `private.appointments_audit()`                            | Trigger, `SECURITY DEFINER`                     | Writes `appointment_events`                            |
| `private.appointment_services_snapshot()`                 | Trigger, `SECURITY DEFINER`                     | Fills snapshots; rejects inactive services             |
| `private.assert_appointment_has_services()`               | Deferred constraint trigger, `SECURITY DEFINER` | ≥ 1 service per appointment at commit                  |
| `private.create_guest_booking(...)`                       | PL/pgSQL, `SECURITY DEFINER`                    | Atomic guest booking creation & idempotency replay     |

All functions use `SET search_path = ''`.
