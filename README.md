# AZIZURRAHMAN

Mobile-first public website with guest appointment booking and a protected admin dashboard for AZIZURRAHMAN. Built by Marvel's Techworks.

> **Status (2026-10-20):** Phases 0–2 done. Requirements are baselined (client approvals outstanding). The Next.js foundation and the Supabase schema, RLS and migrations are implemented and tested locally. No public pages, booking flow or admin UI yet. No remote environments exist. See [the implementation plan](docs/AZIZURRAHMAN_Implementation_Plan.md#current-status-updated-2026-10-20).

## Tech stack

| Area            | Choice                                                                  |
| --------------- | ----------------------------------------------------------------------- |
| Framework       | Next.js 16 (App Router, Cache Components, Turbopack), React 19          |
| Language        | TypeScript 5 (strict, `noUncheckedIndexedAccess`)                       |
| Styling         | Tailwind CSS v4 with CSS-variable design tokens (`src/app/globals.css`) |
| Database / Auth | Supabase PostgreSQL 17 + Supabase Auth (admins only)                    |
| Migrations      | Supabase CLI, SQL in `supabase/migrations/`                             |
| Validation      | Zod 4                                                                   |
| Tests           | Vitest (unit, static, Data API integration) + pgTAP (database)          |
| Quality         | ESLint 9 (`eslint-config-next`), Prettier 3 (+ Tailwind plugin)         |
| CI              | GitHub Actions (`.github/workflows/ci.yml`)                             |
| Hosting target  | Vercel (or any Node.js host for Next.js)                                |

## Prerequisites

- Node.js ≥ 22.12 and npm
- Docker (for local Supabase)
- Supabase CLI ≥ 2.117 (`brew install supabase/tap/supabase`, or use `npx supabase`)

## Getting started

```bash
npm install
cp .env.example .env.local           # fill in values; never commit .env.local
npm run db:start                     # local Supabase (Docker)
npm run db:reset                     # apply migrations + development seed
npx supabase status                  # copy API URL + anon key into .env.local
npm run dev                          # http://localhost:3000
```

The app builds and serves its current pages with **no** environment variables set. Supabase variables are validated only when code that needs them runs.

## Environment variables

See [`.env.example`](.env.example) and [INTEGRATIONS.md](docs/requirements/INTEGRATIONS.md#environment-variables).

| Variable                                                    | Scope                          | Needed from                                   |
| ----------------------------------------------------------- | ------------------------------ | --------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (RLS-protected)         | Database-backed pages (Phase 4+)              |
| `SUPABASE_SERVICE_ROLE_KEY`                                 | **Server only** — bypasses RLS | Booking operation (Phase 6)                   |
| `NEXT_PUBLIC_SITE_URL`                                      | Public                         | Defaults to `http://localhost:3000`           |
| `CONSULTATION_TIMEZONE`                                     | Server                         | Scheduling (Phase 5), pending client approval |
| `RESEND_API_KEY`                                            | **Server only**, optional      | Email (Phase 12)                              |
| `APPOINTMENT_LOOKUP_SECRET`                                 | **Server only**                | Secure lookup (Phase 7)                       |

## Scripts

| Command                           | What it does                                                                                                           |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `npm run dev` / `build` / `start` | Next.js dev server / production build / serve the build                                                                |
| `npm run lint`                    | ESLint                                                                                                                 |
| `npm run typecheck`               | `next typegen` + `tsc --noEmit`                                                                                        |
| `npm run format` / `format:check` | Prettier write / check                                                                                                 |
| `npm test`                        | Vitest unit + static tests (no database needed)                                                                        |
| `npm run test:integration`        | Data API RLS tests against local Supabase (needs env, see [MIGRATIONS.md](docs/database/MIGRATIONS.md#local-workflow)) |
| `npm run check`                   | format:check → lint → typecheck → test → build                                                                         |
| `npm run db:start` / `db:stop`    | Start/stop local Supabase                                                                                              |
| `npm run db:reset`                | Recreate the local DB from migrations + seed                                                                           |
| `npm run db:lint`                 | Lint database functions (fails on warnings)                                                                            |
| `npm run db:test`                 | pgTAP schema, constraint and RLS suites                                                                                |
| `npm run db:test:concurrency`     | Two-session booking race check                                                                                         |
| `npm run db:types`                | Regenerate `src/types/database.types.ts`                                                                               |

## Project structure

```text
src/
  app/                    App Router: root layout, (public) route group, error/404 boundaries, icons
  components/layout/      Header, footer, brand mark
  components/ui/          Button styles, ornament
  config/site.ts          Verified site facts only (no unapproved content)
  lib/env/                Env validation — public.ts (browser-safe) / server.ts (server-only)
  lib/supabase/           server.ts (session), public.ts (anon, cacheable), service-role.ts (privileged)
  lib/booking/status.ts   Status/transition policy mirrored from SQL (test-enforced)
  lib/validation/         Phone/email/slug/timezone normalisation
  lib/errors.ts           Error codes, safe public errors, DB-constraint → error mapping
  lib/logger.ts           Structured logging with PII/secret redaction
  types/                  Generated Supabase types + domain aliases
supabase/
  config.toml             Local config (public sign-up disabled)
  migrations/             Versioned SQL — source of truth for the schema
  seed.sql                Local development seed ([DEV SAMPLE] data only)
  tests/database/         pgTAP suites
  tests/concurrency/      Race-condition check
tests/
  unit/                   Vitest unit + static checks (security boundaries, migrations, tokens)
  integration/            Data API RLS tests
docs/                     PRD, plan, requirements, database docs
```

Later-phase directories (booking, calendar, receipt, admin, notifications, export) will be added when those phases start; see the [plan](docs/AZIZURRAHMAN_Implementation_Plan.md).

## Database and migrations

- Schema overview: [docs/database/SCHEMA.md](docs/database/SCHEMA.md)
- Columns and constraints: [docs/database/DATA_DICTIONARY.md](docs/database/DATA_DICTIONARY.md)
- Access control: [docs/database/RLS_POLICIES.md](docs/database/RLS_POLICIES.md)
- Workflow, seeding, remote push, backups: [docs/database/MIGRATIONS.md](docs/database/MIGRATIONS.md)

## Deployment overview

1. Create separate Supabase projects for staging and production (client-owned; see Q18). Disable public sign-up and expose only the `public` schema.
2. `supabase link` + `supabase db push` to staging, then (with authorisation and a backup) production.
3. Create the Vercel project, set environment variables per environment (preview → staging DB, production → production DB), and deploy.
4. Provision admin users privately ([RLS_POLICIES.md](docs/database/RLS_POLICIES.md#provisioning-and-revoking-admins)).

Nothing has been deployed yet.

## Security notes

- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. It is read only in `src/lib/env/server.ts` and used only by `src/lib/supabase/service-role.ts`; both are `server-only`. Tests enforce this.
- Never prefix a secret with `NEXT_PUBLIC_`. `.env*` files are git-ignored except `.env.example`.
- RLS is enabled on every table. Visitors can read only active services, weekly hours and public settings. Appointments, overrides, audit history and admin profiles are inaccessible to them.
- Admin authorization relies on `admin_profiles` (active rows), never on JWT claims. There is no public sign-up.
- Booking integrity (no overlaps, daily phone limit, status transitions, service snapshots, audit) is enforced in PostgreSQL, not just the UI.
- Never publish unapproved biography, credentials, services, contact details or translations ([CONTENT_CHECKLIST.md](docs/requirements/CONTENT_CHECKLIST.md)).

## Documentation

| Document                                                            | Purpose                                         |
| ------------------------------------------------------------------- | ----------------------------------------------- |
| [PRD](docs/PRD.md)                                                  | Product requirements                            |
| [Implementation plan](docs/AZIZURRAHMAN_Implementation_Plan.md)     | Phases and status                               |
| [Requirements baseline](docs/requirements/REQUIREMENTS_BASELINE.md) | FR/NFR IDs and acceptance criteria              |
| [Business rules](docs/requirements/BUSINESS_RULES.md)               | Booking policy proposals and approval status    |
| [Open questions](docs/requirements/OPEN_QUESTIONS.md)               | Client decisions needed                         |
| [Content checklist](docs/requirements/CONTENT_CHECKLIST.md)         | Client-fillable content list                    |
| [Integrations](docs/requirements/INTEGRATIONS.md)                   | Hosting, Supabase, email, WhatsApp, credentials |
| [Database docs](docs/database/SCHEMA.md)                            | Schema, dictionary, RLS, migrations             |
