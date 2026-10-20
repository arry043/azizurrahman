# Row Level Security & Access Control

> Verified by `supabase/tests/database/03_rls.test.sql` (role-switched pgTAP), `tests/integration/rls-api.test.ts` (real Data API with the anon key) and the static checks in `tests/unit/migrations.test.ts`.

## Actors

| Actor               | Database role                          | How identified                                                                                                                                                            |
| ------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public visitor      | `anon`                                 | Anon/publishable key, no session                                                                                                                                          |
| Signed-in non-admin | `authenticated`                        | Valid Supabase session whose user has no **active** `admin_profiles` row. Public sign-up is disabled, so this should only occur for deactivated or mis-provisioned users. |
| Administrator       | `authenticated` + `private.is_admin()` | `admin_profiles.id = auth.uid()` **and** `is_active`                                                                                                                      |
| Trusted server      | `service_role`                         | `SUPABASE_SERVICE_ROLE_KEY`, server-only. **Bypasses RLS.**                                                                                                               |

Authorization never reads role claims from the JWT (`app_metadata`, `user_metadata`) or any client-supplied field. A test confirms that a token claiming `"role": "admin"` in metadata gets nothing.

## Defence in depth

1. **Grants.** Supabase grants every new `public` table to `anon` and `authenticated` by default. Each migration revokes those grants and re-grants only what is needed. Tables with no `anon` grant return `42501 permission denied` before RLS is even consulted.
2. **RLS.** Enabled on every `public` table. Policies are role-scoped (`TO anon` / `TO authenticated`) and admin checks use `(select private.is_admin())`, evaluated once per statement.
3. **Private schema.** Helper functions live in `private`, which is not exposed through the Data API and has no `anon` usage privilege. `is_admin()` is `SECURITY DEFINER` with `search_path = ''`, so policies can consult `admin_profiles` without recursion and without granting callers direct access.
4. **Triggers.** Status transitions, snapshots and audit events are enforced in the database and apply to every caller, including admins.

## Policy matrix

| Table                           | anon                     | authenticated (non-admin) | active admin                        | service_role |
| ------------------------------- | ------------------------ | ------------------------- | ----------------------------------- | ------------ |
| `admin_profiles`                | —                        | — (0 rows)                | SELECT                              | ALL          |
| `services`                      | SELECT where `is_active` | SELECT where `is_active`  | SELECT all, INSERT, UPDATE, DELETE¹ | ALL          |
| `weekly_availability`           | SELECT                   | SELECT                    | SELECT, UPDATE                      | ALL          |
| `weekly_availability_intervals` | SELECT                   | SELECT                    | SELECT, INSERT, UPDATE, DELETE      | ALL          |
| `date_overrides`                | —                        | — (0 rows)                | SELECT, INSERT, UPDATE, DELETE      | ALL          |
| `date_override_intervals`       | —                        | — (0 rows)                | SELECT, INSERT, UPDATE, DELETE      | ALL          |
| `site_settings`                 | SELECT                   | SELECT                    | SELECT, UPDATE                      | ALL          |
| `appointments`                  | —                        | — (0 rows)                | SELECT, INSERT², UPDATE³            | ALL          |
| `appointment_services`          | —                        | — (0 rows)                | SELECT, INSERT                      | ALL          |
| `appointment_events`            | —                        | — (0 rows)                | SELECT                              | ALL          |
| `booking_idempotency_keys`      | —                        | — (0 rows)                | — (0 rows)                          | ALL          |
| `appointment_verifications`     | —                        | — (0 rows)                | — (0 rows)                          | ALL          |
| `booking_idempotency_keys`      | —                        | — (0 rows)                | — (0 rows)                          | ALL          |
| `appointment_verifications`     | —                        | — (0 rows)                | — (0 rows)                          | ALL          |

"—" means no grant: the request fails with `42501`. "0 rows" means a grant exists but RLS filters every row.

¹ Only services never booked (`appointment_services.service_id` is `ON DELETE RESTRICT`).
² Admin-created appointments must include services in the same transaction (deferred check), so in practice through an RPC (Phase 6/9).
³ Subject to the status-transition trigger; `public_reference`, `id` and `created_at` are immutable.

Deliberately absent:

- **No anon access to appointments in any form.** No broad SELECT policy "to make lookup easy". Lookup will be a verified server operation (Phase 7).
- **No anon INSERT on appointments.** Public booking will be a validated server operation (Phase 6). See below.
- **No INSERT/UPDATE/DELETE on `admin_profiles` via the API**, for anyone. Nobody can self-promote or re-activate.
- **No UPDATE/DELETE on `appointment_events` or `appointment_services`**: audit history and booked snapshots are immutable through the API.
- **No DELETE on `appointments`** for admins: cancel instead. Retention purges are a privileged, deliberate operation.

## Data classification

| Data                                                         | Classification                                       | Where it may appear                                              |
| ------------------------------------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------- |
| Active services, weekly hours, `site_settings`               | Public                                               | Anywhere                                                         |
| Inactive services                                            | Admin                                                | Admin UI                                                         |
| Date override existence (open/closed)                        | Public **via controlled availability API** (Phase 5) | Calendar                                                         |
| Date override `reason`                                       | Private                                              | Admin UI only                                                    |
| Appointment reference, status, services, date/time, timezone | Visitor-private                                      | Receipt / verified lookup for that visitor                       |
| Name, phone, email, message                                  | Personal data                                        | Admin UI; the visitor's own verified lookup                      |
| `private_admin_notes`                                        | Admin-only                                           | Admin UI only; never in receipts, exports, emails or public APIs |
| `appointment_events`                                         | Admin-only                                           | Admin UI only                                                    |

`src/types/domain.ts` defines `PublicService` and `PublicAppointmentReceipt` as explicit allow-lists for public responses.

## Future public booking — security boundary (Phase 6)

Public booking must not be opened up through table policies. Two acceptable designs:

1. **Server route + service-role client** (`src/lib/supabase/service-role.ts`): the route validates input with Zod, rate-limits, applies bot protection, and calls a booking SQL function in one transaction. The service role bypasses RLS, so **the server code is the security boundary**. It must only ever pass validated values and must return only `PublicAppointmentReceipt` fields.
2. **`SECURITY DEFINER` RPC executable by `anon`**: validates everything in SQL and returns only receipt fields. This still needs rate limiting in front of it.

Either way, durations come from `services` via the snapshot trigger, timestamps are recomputed server-side, and the overlap and daily-limit constraints are the final race-safe guard.

## Provisioning and revoking admins

There is no sign-up path. `enable_signup = false` in `supabase/config.toml`; for remote projects, disable sign-ups in the dashboard (see [INTEGRATIONS.md](../requirements/INTEGRATIONS.md)).

**Provision (local or remote):**

1. Create the user: Dashboard → Authentication → Users → _Add user_ (or _Invite_). Locally you can use the Auth admin API with the local service-role key.
2. Grant admin, using the SQL editor (runs as `postgres`):

   ```sql
   insert into public.admin_profiles (id, display_name)
   select id, 'Display Name' from auth.users where email = 'admin@example.com';
   ```

**Revoke immediately:** `update public.admin_profiles set is_active = false where id = '…';`. This takes effect on the next request, even with a still-valid session. Optionally ban or delete the auth user too (deleting cascades the profile; audit events keep `actor_admin_id = NULL`).

Phase 8 will add server-side session checks (`proxy.ts` / data access layer) on top of RLS. Hiding admin routes is never the control.

## Function privileges

| Function                                          | EXECUTE granted to              | Notes                                     |
| ------------------------------------------------- | ------------------------------- | ----------------------------------------- |
| `private.is_admin()`                              | `authenticated`, `service_role` | `SECURITY DEFINER`; revoked from `PUBLIC` |
| `private.generate_public_reference()`             | `authenticated`, `service_role` | Used as a column default                  |
| `private.appointment_status_transition_allowed()` | `authenticated`, `service_role` | Pure function                             |
| Trigger functions                                 | (revoked from `PUBLIC`)         | Invoked only by triggers                  |

`supabase db lint` (plpgsql_check) reports no issues.
