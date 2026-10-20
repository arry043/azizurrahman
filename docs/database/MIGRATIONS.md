# Migrations, Seeding & Database Operations

## Migration history

| Version          | File                                 | Contents                                                                                                                                                                             |
| ---------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `20261020100000` | `foundation_and_admin.sql`           | Extensions (`btree_gist`, `pgcrypto`), `private` schema, `set_updated_at`, `is_valid_timezone`, `admin_profiles`, `private.is_admin()`, admin RLS                                    |
| `20261020100100` | `services_availability_settings.sql` | `private.time_range`, `services`, `weekly_availability` (+ 7 rows), `weekly_availability_intervals`, `date_overrides`, `date_override_intervals`, `site_settings` (+ singleton), RLS |
| `20261020100200` | `appointments.sql`                   | Enums, reference generator, transition function, `appointments`, `appointment_services`, `appointment_events`, triggers, indexes, RLS                                                |
| `20261020100300` | `booking_and_lookup.sql`             | `public.booking_idempotency_keys`, `public.appointment_verifications`, and `private.create_guest_booking` atomic transaction RPC function with idempotency replay and RLS            |
| `20261020100300` | `booking_and_lookup.sql`             | `public.booking_idempotency_keys`, `public.appointment_verifications`, and `private.create_guest_booking` atomic transaction RPC function with idempotency replay and RLS            |

None of these have been applied to any remote project. They were applied and tested against a fresh **local** database only.

## Local workflow

Prerequisites: Docker running, Supabase CLI ≥ 2.117.

```bash
npm run db:start      # supabase start (first run pulls images)
npm run db:reset      # drop local DB, apply all migrations, load supabase/seed.sql
npm run db:lint       # plpgsql_check on all functions
npm run db:test       # pgTAP: supabase/tests/database/*.test.sql
npm run db:test:concurrency   # two-session race check for the booking constraints
npm run db:types      # regenerate src/types/database.types.ts from the local schema
npm run test:integration      # Data API RLS tests (see below for env vars)
npm run db:stop
```

Run the integration tests with the local keys printed by `npx supabase status -o env`:

```bash
eval "$(npx supabase status -o env | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=')"
NEXT_PUBLIC_SUPABASE_URL=$API_URL NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY \
  SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY npm run test:integration
```

To point the Next.js app at local Supabase, put the API URL and anon key in `.env.local`. The file is git-ignored.

### Creating a migration

```bash
npx supabase migration new short_description   # creates supabase/migrations/<timestamp>_short_description.sql
# write SQL; then
npm run db:reset && npm run db:lint && npm run db:test && npm run db:types
```

Rules:

- Never edit a migration that has been applied to any shared or remote database. Add a corrective migration.
- Every new `public` table needs: `enable row level security`, `revoke all … from anon, authenticated`, explicit grants and policies. `tests/unit/migrations.test.ts` fails otherwise.
- Every function needs `set search_path = ''`, and `SECURITY DEFINER` only when justified.
- Regenerate types and commit them with the migration. CI fails if they drift.

## Seed data

`supabase/seed.sql` runs only on `supabase db reset` (local). It contains:

- three `[DEV SAMPLE]` services (one inactive);
- a development weekly schedule: Mon–Sat 10:00–13:00 and 15:00–19:00, Sunday closed (editable example only);
- two date overrides relative to today (+7 closed, +10 custom hours);
- two fictional appointments (`+1 555 01xx` numbers, `example.com` emails) in `Asia/Kolkata`.

It creates **no** admin users or passwords, and is never applied to production. Override and appointment dates are relative to the day of the reset, so the sample stays in the future.

## Changing a booking policy

The proposed rules are encoded in specific places. When the client decides:

| Change                                                     | Migration to write                                                                                                                         | Also update                                                                |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Different capacity-reserving statuses (BR-14)              | Drop/re-add the `reserves_capacity` generated column with the new expression (this rebuilds `appointments_no_overlap` and the daily index) | `src/lib/booking/status.ts` (a test enforces the match), BUSINESS_RULES.md |
| Drop the daily identity rule (BR-13)                       | `drop index public.appointments_one_active_per_phone_per_day;`                                                                             | `mapDatabaseError`, docs                                                   |
| Allow concurrent appointments / multiple providers (BR-02) | Drop `appointments_no_overlap`; add a provider column and re-create the exclusion with `provider_id with =`                                | Availability engine                                                        |
| Different status transitions (BR-16)                       | `create or replace function private.appointment_status_transition_allowed …`                                                               | `ALLOWED_STATUS_TRANSITIONS` (test-enforced)                               |

Before adding a stricter rule to a table with data, query for existing violations first, or the migration will fail.

## Remote environments (not yet created)

```bash
npx supabase login
npx supabase link --project-ref <ref>        # development/staging project first
npx supabase db push --dry-run               # review what will run
npx supabase db push
```

Production precautions:

- Push to staging first and run the pgTAP suite against it (`supabase test db --linked`, if a disposable staging project is acceptable).
- Take or confirm a backup (or point-in-time recovery) **before** `db push` to production.
- Apply dashboard-only settings: sign-up disabled, password policy, exposed schemas = `public` only.
- Never run `seed.sql` or `db reset` against production.
- Never push migrations to production from a developer machine without the client's authorisation (Q18).

## Backup and recovery assumptions

- Backup frequency, retention and point-in-time recovery depend on the Supabase plan and add-ons. Confirm the current terms on Supabase's pricing page when choosing the plan. As a rule of thumb, paid plans include daily backups and PITR is a paid add-on, but this has not been verified for this project. **The plan is not yet chosen (Q18)**, so recovery capability is unconfirmed.
- Schema is fully reproducible from `supabase/migrations/`; data is not. Recovery of booking data depends on the plan's backups.
- Before launch: decide the plan, document restore steps, and test a restore into a non-production project.
- Retention purges (Q19) will delete appointments via the service role. `appointment_services` and `appointment_events` cascade with them by design.
