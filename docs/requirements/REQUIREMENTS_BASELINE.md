# Requirements Baseline

> **Status:** Baseline v1.0 (2026-10-20) — derived from [`docs/PRD.md`](../PRD.md), the client's Website Development Order Letter (`docs/AZIZURRAHMAN_Refined_Website_Development_Order.pdf`) and the supplied mobile UI references.
> **Related:** [Business rules](BUSINESS_RULES.md) · [Open questions](OPEN_QUESTIONS.md) · [Content checklist](CONTENT_CHECKLIST.md) · [Integrations](INTEGRATIONS.md)

## How to read this document

- Every requirement has a stable identifier (`FR-xxx` functional, `NFR-xxx` non-functional). Reference these IDs in issues, PRs and tests.
- **Source** — where the requirement comes from: `Order` (client order letter), `PRD`, `UI` (supplied mockups), `Brief` (implementation brief for Phases 0–2).
- **Status** — `Confirmed` (explicitly requested by the client), `Proposed` (recommended default awaiting approval — see [BUSINESS_RULES.md](BUSINESS_RULES.md)), `Pending` (blocked on a client decision — see [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md)).
- **Phase** — the implementation-plan phase that delivers the requirement. "0–2 delivers" lists what the current phases put in place.

## Requirement summary

| ID      | Requirement                                                                | Source                  | Status                        | Delivering phase | Phases 0–2 delivers                                                      |
| ------- | -------------------------------------------------------------------------- | ----------------------- | ----------------------------- | ---------------- | ------------------------------------------------------------------------ |
| FR-001  | Public service catalogue                                                   | Order, PRD §4.3         | Confirmed (content pending)   | 4, 11            | `services` table, public read RLS, ordering index                        |
| FR-002  | Guest appointment booking (no account)                                     | Order §3, PRD §4.5      | Confirmed                     | 5, 6             | `appointments` schema, constraints; no public insert path yet            |
| FR-003  | Multi-service appointments                                                 | Brief, PRD §4.3         | Confirmed                     | 6                | `appointment_services` with booking-time snapshots                       |
| FR-004  | Secure appointment lookup                                                  | Order §3, PRD §3.2      | Confirmed (method pending)    | 7                | Unguessable `public_reference`; no anonymous read of appointments        |
| FR-005  | Admin appointment management                                               | Order §3, PRD §6.2      | Confirmed                     | 8, 9             | Admin RLS, status enum, transition guard, audit trigger                  |
| FR-006  | Recurring weekly availability                                              | Order §3, PRD §5.3      | Confirmed (hours pending)     | 5, 10            | `weekly_availability` + intervals (Sunday is data, not code)             |
| FR-007  | Date-specific availability overrides                                       | Order §3, PRD §5.4      | Confirmed                     | 5, 10            | `date_overrides` + intervals                                             |
| FR-008  | Appointment receipt (print / PDF / image)                                  | Brief, PRD §4.6         | Confirmed                     | 7                | Receipt-safe fields separated from private notes                         |
| FR-009  | Contact integrations (WhatsApp / phone / email links)                      | Order §2, §4            | Confirmed (details pending)   | 4, 12            | Nullable contact columns in `site_settings`                              |
| FR-010  | Email notifications                                                        | Order §3, PRD §12.1     | Pending (provider)            | 12               | Documented only; no tables yet                                           |
| FR-011  | Admin authentication (no public registration)                              | Order §3, PRD §3.1      | Confirmed                     | 8                | `admin_profiles`, `private.is_admin()`, sign-up disabled in local config |
| FR-012  | Public pages: Home, About, Services, Service detail, Book, Contact, Lookup | Order §2, PRD §4        | Confirmed (content pending)   | 4                | App Router shell + branded home placeholder                              |
| FR-013  | Daily booking identity rule                                                | Brief, PRD §5.6         | Proposed                      | 6                | Status-aware partial unique index (proposed default)                     |
| FR-014  | No double-booking of a slot                                                | Order §3                | Confirmed                     | 6                | Exclusion constraint over reserved time ranges                           |
| FR-015  | Status visibility (submitted ≠ confirmed)                                  | Order §3                | Confirmed                     | 6, 7             | `pending` initial status, constrained status enum                        |
| FR-016  | Admin audit history                                                        | PRD §6.2                | Confirmed                     | 9                | `appointment_events` written by trigger, read-only for admins            |
| FR-017  | Approved site settings (contact details, booking limits)                   | Order §4, §5            | Confirmed                     | 11               | Typed singleton `site_settings` table                                    |
| NFR-001 | Mobile-first, desktop-excellent responsive UX                              | Order, Plan §2          | Confirmed                     | 3+               | Design tokens, container utility, responsive shell                       |
| NFR-002 | Server-side booking validation                                             | Order §3, PRD §5.5      | Confirmed                     | 5, 6             | DB constraints/triggers that cannot be bypassed by the browser           |
| NFR-003 | Least-privilege database access                                            | PRD §11                 | Confirmed                     | 2                | RLS on every table, explicit grants, private helper schema               |
| NFR-004 | Accessibility and performance                                              | Order §5, PRD §7.6, §13 | Confirmed                     | 3, 13            | Semantic shell, skip link, focus styles, reduced motion                  |
| NFR-005 | Secrets never reach the browser                                            | PRD §11                 | Confirmed                     | 1                | `server-only` env + service-role modules, static test                    |
| NFR-006 | Explicit timezone semantics                                                | PRD §5.5                | Confirmed (zone pending)      | 2, 5             | `timestamptz` instants + stored IANA zone + derived local date           |
| NFR-007 | Privacy and data minimisation                                              | Order §6                | Confirmed (retention pending) | 2, 13            | Length limits, no sensitive fields, private notes isolated               |
| NFR-008 | Reproducible engineering workflow                                          | Brief                   | Confirmed                     | 1                | Lint, typecheck, format, tests, build, CI                                |
| NFR-009 | No fabricated client content                                               | Order §6                | Confirmed                     | All              | Placeholders only; dev seed data clearly marked                          |

## Acceptance criteria

### FR-001 — Public service catalogue

- Only services with `is_active = true` are returned to anonymous visitors.
- Services are listed by `display_order`, then name.
- Each service has a unique, URL-safe slug used by `/services/[slug]`.
- Service names, descriptions and imagery are published only after client approval ([CONTENT_CHECKLIST.md](CONTENT_CHECKLIST.md)).

### FR-002 — Guest appointment booking

- A visitor can submit a booking without creating an account.
- The server (not the browser) validates services, date, time, availability and the daily rule before creating the record.
- A new booking starts as `pending` (proposed) and is never presented as confirmed until an admin confirms it.
- The visitor receives an unguessable public reference on success.

### FR-003 — Multi-service appointments

- One appointment links to one or more distinct active services.
- Each link stores the service name, duration and buffers **as they were at booking time**; later edits to the service do not change historical bookings.
- Durations are taken from the database, never from client input.

### FR-004 — Secure appointment lookup

- Appointment details are never revealed from a phone number, email or reference alone.
- The verification method (OTP or one-time link) is approved before implementation ([OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) Q16).
- Lookup responses are generic, rate-limited and exclude private admin notes.

### FR-005 — Admin appointment management

- Only an authenticated user with an **active** `admin_profiles` row can read or change appointments.
- Status changes follow the allowed transitions in [BUSINESS_RULES.md](BUSINESS_RULES.md#status-transitions); invalid transitions are rejected by the database.
- Every creation, status change and reschedule writes an audit event with the acting admin.

### FR-006 — Recurring weekly availability

- Each weekday (0 = Sunday … 6 = Saturday) has exactly one configuration row and zero or more non-overlapping working intervals.
- Any weekday, including Sunday, can be opened or closed by an admin; nothing is hard-coded.
- Schedule changes never silently cancel existing appointments.

### FR-007 — Date-specific overrides

- At most one override per local calendar date.
- An override either closes the date or defines custom intervals, and takes precedence over the weekly schedule.
- The private reason is visible only to admins.

### FR-008 — Appointment receipt

- Shows reference, status, services, date, time and timezone; never private notes or verification secrets.
- Print, PDF and image exports render the approved layout (Phase 7).

### FR-009 — Contact integrations

- WhatsApp uses `https://wa.me/<E.164 digits>?text=<URL-encoded>`; phone uses `tel:`; email uses `mailto:`.
- Only client-verified contact details are published.

### FR-010 — Email notifications

- Sent only after the related database change commits; failure never rolls back a booking.
- Enabled only after the provider, sender domain and budget are approved.

### FR-011 — Admin authentication

- Public sign-up is disabled in every environment.
- Admin accounts are provisioned privately; a user cannot grant themselves admin rights.
- Deactivating an admin (`is_active = false`) immediately removes database privileges.

### FR-012 — Public pages

- All listed pages exist, are responsive and contain only approved content.
- Admin, receipt and lookup pages are `noindex`.

### FR-013 — Daily booking identity rule (proposed)

- At most one capacity-reserving appointment per normalised phone number per local calendar date.
- Bookings on other dates are allowed; cancelled/declined bookings release the limit.
- Enforced by the database so concurrent requests cannot both succeed.

### FR-014 — No double-booking

- Two capacity-reserving appointments can never overlap in time (one-provider assumption).
- Enforced by a database exclusion constraint, which is safe under concurrency.

### FR-015 — Status visibility

- Allowed statuses: `pending`, `confirmed`, `declined`, `reschedule_requested`, `cancelled`.
- UI copy and notifications reflect the stored status.

### FR-016 — Audit history

- Audit records cannot be created, edited or deleted through the public or admin APIs; they are written by database triggers.
- Event metadata excludes unnecessary personal data.

### FR-017 — Site settings

- Settings hold non-secret values only; secrets stay in server environment variables.
- Only active admins can update settings.

### NFR-001 — Mobile-first, desktop-excellent

- Layouts are designed first for < 640 px, then deliberately composed for 640–1023 px and ≥ 1024 px.
- Shared design tokens drive colour, typography, radius and spacing.

### NFR-002 — Server-side booking validation

- Every booking rule is enforced by the server and/or database. Disabled UI controls are not a security control.

### NFR-003 — Least-privilege database access

- RLS is enabled on every table in the exposed `public` schema.
- Anonymous users can read only active services, weekly opening hours and public site settings.
- Helper functions live in a non-exposed `private` schema with a fixed `search_path`.

### NFR-004 — Accessibility and performance

- Target WCAG 2.2 AA: semantic landmarks, skip link, visible focus, sufficient contrast, reduced-motion support.
- Informational pages are server-rendered with minimal client JavaScript.

### NFR-005 — Secrets never reach the browser

- `SUPABASE_SERVICE_ROLE_KEY` is read only in modules marked `server-only` and never prefixed `NEXT_PUBLIC_`.
- An automated test fails if a client component references server-only modules or secret variables.

### NFR-006 — Explicit timezone semantics

- Absolute instants are stored as `timestamptz`; each appointment stores the IANA timezone used and a derived local date.
- The consultation timezone is configured explicitly (`CONSULTATION_TIMEZONE`) and never inferred from the host.

### NFR-007 — Privacy and data minimisation

- The booking form collects only name, phone, optional email, preferred contact method and a short optional message.
- No sensitive medical, financial or family fields.

### NFR-008 — Reproducible engineering workflow

- `npm run lint`, `typecheck`, `format:check`, `test` and `build` run independently and in CI.

### NFR-009 — No fabricated client content

- Biography, credentials, service copy, contact details and translations are published only after approval. Development seed data is labelled `[DEV SAMPLE]`.

## Out of scope (initial release)

Per PRD §2.2: public user accounts, payments, native apps, automated WhatsApp Business messaging, video consultations, live chat, calendar sync, multi-staff scheduling, and publishing unapproved content.

## Out of scope for Phases 0–2 specifically

Public page content (Phase 4), the availability engine and calendar (Phase 5), the booking endpoint/RPC (Phase 6), receipt and lookup (Phase 7), admin login and dashboard UI (Phases 8–11), email (Phase 12).
