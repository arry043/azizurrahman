# AZIZURRAHMAN — Complete Implementation Plan

> **Project:** AZIZURRAHMAN Website & Appointment Booking System  
> **Document:** Phased Implementation Plan  
> **Version:** 1.0 — Planning baseline  
> **Core stack:** Next.js App Router, TypeScript, Tailwind CSS, Supabase PostgreSQL, Supabase Auth  
> **Design principle:** Mobile-first, desktop-excellent — one coherent design system, deliberately composed for both small and large screens.

---

## Current Status (updated 2026-10-20)

| Phase | Status | Notes |
|---|---|---|
| 0 — Discovery & requirements | **Documentation complete; client approvals outstanding** | See [requirements/](requirements/REQUIREMENTS_BASELINE.md). Decisions in [OPEN_QUESTIONS.md](requirements/OPEN_QUESTIONS.md) remain open. |
| 1 — Project foundation | **Complete** | Next.js 16 App Router, strict TS, Tailwind v4 tokens, ESLint/Prettier, Vitest, CI. Preview deployment not yet created (needs hosting account, Q18). |
| 2 — Supabase schema & migrations | **Complete (local)** | Migrations, RLS and pgTAP tests verified against local Supabase. No remote project exists yet. See [database/](database/SCHEMA.md). |
| 3 — Design system & responsive UX | **Complete** | Tokenized CSS variables, typography pairing (Cormorant Garamond + Inter), accessible UI primitives (buttons, inputs, cards, dialogs, alerts, states), responsive header with mobile drawer, footer, service cards, contact actions. |
| 4 — Public website pages | **Complete** | Home, About, Services catalogue, Service detail by slug, Book appointment entry, Contact, Appointment lookup shell, 404/loading/error states. Verified against local Supabase with active-only RLS queries. |
| 5+ | Not started | Availability & Calendar Engine |

Deviations from the original plan: `IMPLEMENTATION_PLAN.md` was not created separately. This file stays the single plan of record. Two proposed booking rules (single-provider overlap and the daily phone limit) are already enforced as status-aware database constraints; see [BUSINESS_RULES.md, Note A](requirements/BUSINESS_RULES.md#note-a--rules-enforced-as-development-defaults).

---

## 1. Product Goal

Build a premium, responsive website for AZIZURRAHMAN where visitors can explore approved services, contact the provider through WhatsApp/phone/email, and request an appointment without creating an account. A protected admin dashboard will manage services, appointments, weekly availability, recurring closed weekdays, and date-specific exceptions.

The system must enforce booking rules on the server and in the database—not only in the browser. A visitor must not be able to access another person's private appointment details merely by knowing their phone number, email, or appointment ID.

## 2. Non-Negotiable Product Principles

1. **Mobile-first, not mobile-only:** design and test the mobile experience first, then deliberately compose the tablet and desktop experiences rather than simply stretching the mobile layout.
2. **Premium desktop UX:** desktop must feel purpose-designed, spacious, polished, and efficient—not like a phone screen enlarged.
3. **One design system:** mobile, tablet, desktop, public pages, booking flow, and admin dashboard share tokens and component behavior.
4. **Server is the source of truth:** all booking, availability, authorization, duplicate prevention, and status rules are validated server-side.
5. **No public user accounts:** visitors can book as guests. Only authorized administrators sign in.
6. **Clear appointment status:** submitted/pending is not the same as confirmed. The UI and notifications must reflect the actual status.
7. **No unapproved claims/content:** the client must approve profile text, qualifications, contact details, translations, and service descriptions.
8. **Accessible and resilient:** forms, calendar, navigation, errors, and exports work with keyboard, screen readers, slow connections, and common mobile browsers.

---

## 3. Technology Stack

| Area | Choice | Implementation notes |
|---|---|---|
| Web application | Next.js App Router + TypeScript | Server Components for content-first pages; Client Components only where interaction is needed. |
| Styling | Tailwind CSS | Use semantic design tokens and reusable responsive components. |
| UI components | Accessible reusable component layer | Buttons, fields, dialogs, cards, calendar primitives, tables, badges, menus. |
| Database | Supabase PostgreSQL | Migrations tracked in Git; constraints, indexes, transactions and RLS. |
| Admin authentication | Supabase Auth | Admin accounts provisioned privately; no public sign-up. |
| Server data access | Server-only Supabase clients and validated server operations | Never expose service-role credentials to the browser. |
| Validation | Zod or equivalent | Validate inputs at the server boundary; share safe schemas where appropriate. |
| Email | Resend or client-approved provider | Optional; requires sender-domain/provider setup. |
| WhatsApp | `wa.me` click-to-chat | Prefilled message only; visitor still sends it. Business API automation is separate scope. |
| PDF/print | Dedicated receipt view + print CSS / selected PDF implementation | Cross-device output testing required. |
| Image receipt | Client-side image export library selected during implementation | Verify logo, fonts, clipping and Arabic/Urdu shaping if applicable. |
| Hosting | Vercel + Supabase | Separate development/preview and production configuration. |
| Testing | Unit + integration + E2E + manual visual QA | Test scheduling edge cases and concurrent bookings. |

### Recommended repository layout

```text
src/
  app/
    (public)/
      page.tsx
      about/page.tsx
      services/page.tsx
      services/[slug]/page.tsx
      book/page.tsx
      appointments/lookup/page.tsx
      appointments/[publicRef]/page.tsx
      contact/page.tsx
    admin/
      login/page.tsx
      (protected)/
        page.tsx
        appointments/page.tsx
        appointments/[id]/page.tsx
        calendar/page.tsx
        services/page.tsx
        settings/page.tsx
    api/
      availability/route.ts
      appointments/route.ts
      appointments/lookup/route.ts
      admin/appointments/[id]/route.ts
      admin/availability/route.ts
  components/
    ui/
    layout/
    services/
    booking/
    calendar/
    receipt/
    admin/
  lib/
    supabase/
    auth/
    validation/
    booking/
    availability/
    notifications/
    export/
  types/
  styles/
supabase/
  migrations/
  seed.sql
tests/
  unit/
  integration/
  e2e/
```

---

# 4. Phase-by-Phase Implementation Plan

## Phase 0 — Discovery, Requirements Lock & Client Approvals

**Goal:** Resolve business rules and gather approved content before implementation.

### Tasks
- [ ] Confirm final list of public pages and service categories.
- [ ] Collect final logo assets in the best available quality and confirm permitted usage.
- [ ] Collect approved biography, service descriptions, images, qualifications, and any testimonials.
- [ ] Confirm phone number in international format, WhatsApp number, email, consultation hours, and public address (if any).
- [ ] Confirm supported languages and obtain approved translations. Do not publish unreviewed religious copy.
- [ ] Confirm consultation timezone using an explicit IANA timezone.
- [ ] Confirm service duration and whether selected service durations are summed.
- [ ] Confirm whether one booking can contain multiple services.
- [ ] Confirm weekly opening hours, recurring closed weekdays (Sunday is editable, not hard-coded), breaks, and date overrides.
- [ ] Confirm minimum advance notice and maximum booking horizon.
- [ ] Confirm appointment capacity per time slot and whether multiple staff/resources exist (initial assumption: one provider, one appointment at a time).
- [ ] Confirm daily identity rule: proposed default is one active appointment per normalized phone number per local calendar date.
- [ ] Confirm whether pending appointments reserve capacity.
- [ ] Confirm status workflow: proposed default is `pending` until an admin confirms.
- [ ] Confirm cancellation/rescheduling rules and whether a cancelled/declined booking releases the daily limit.
- [ ] Choose appointment lookup verification: OTP or secure one-time link; appointment ID/contact alone is not sufficient.
- [ ] Decide whether email notifications are included in the first release and approve provider/charges.
- [ ] Confirm domain, hosting ownership, recurring charges, maintenance, warranty, and support arrangements.

### Deliverables
- Approved scope and content checklist.
- Signed-off booking policy table.
- Integration decisions and access dependencies.
- Open questions recorded before build begins.

### Exit criteria
No critical booking rule is left to developer guesswork. Any remaining TBD is explicitly accepted as a temporary default.

---

## Phase 1 — Project Foundation & Engineering Standards

**Goal:** Create a maintainable, deployable Next.js project with consistent code quality.

### Tasks
- [ ] Create the Next.js App Router project with TypeScript.
- [ ] Configure Tailwind CSS and CSS variables/design tokens.
- [ ] Configure ESLint, Prettier, strict TypeScript, and consistent import/path aliases.
- [ ] Create the repository structure described above.
- [ ] Add environment variable validation and `.env.example`.
- [ ] Add shared error handling, safe logging, and not-found/error boundaries.
- [ ] Set up Git branches and a clear commit convention.
- [ ] Configure a basic CI workflow for lint, type-check, tests, and production build.
- [ ] Create local, preview/staging, and production environment notes.
- [ ] Add a README with setup, scripts, migrations, and deployment instructions.
- [ ] Set up a preview deployment with no production secrets.

### Deliverables
- Working app shell.
- Repeatable local setup.
- Lint/type-check/build pipeline.
- Environment and repository documentation.

### Exit criteria
A clean clone can be installed, linted, type-checked, tested, and built using documented steps.

---

## Phase 2 — Supabase Setup, Database Schema & Migrations

**Goal:** Establish the secure relational data model before booking UI is connected.

### Proposed entities
- `admin_profiles`
- `services`
- `weekly_availability`
- `availability_breaks` (if multiple intervals/breaks are needed)
- `date_overrides`
- `appointments`
- `appointment_services`
- `appointment_events`
- `notification_logs` or `notification_jobs` (if notifications are enabled)
- `site_settings` for non-secret public settings

### Tasks
- [ ] Create separate Supabase projects or isolated environments for development and production.
- [ ] Define schema and SQL migrations in the repository.
- [ ] Add primary keys, foreign keys, check constraints, indexes, and uniqueness rules.
- [ ] Store absolute timestamps consistently and define local-date/time semantics using the approved timezone.
- [ ] Store a unique, unguessable public appointment reference.
- [ ] Store a hash—not the raw value—of any private lookup token.
- [ ] Snapshot booked service name/duration/buffer in `appointment_services` so later service edits do not rewrite booking history.
- [ ] Define allowed appointment statuses and state transitions.
- [ ] Create admin role/profile mapping tied to Supabase Auth user IDs.
- [ ] Enable RLS on all relevant tables exposed through Supabase APIs.
- [ ] Write least-privilege RLS policies and test both allowed and denied operations.
- [ ] Add seed data for development services and example weekly availability.
- [ ] Document migration application and rollback/recovery expectations.
- [ ] Ensure no service-role key is included in client-side bundles.

### Deliverables
- Version-controlled database migrations.
- Seed data.
- Data dictionary and access policy notes.
- RLS tests/checklist.

### Exit criteria
Schema migrations apply cleanly and public users cannot read or mutate private appointment/admin data directly.

---

## Phase 3 — Design System & Responsive UX Foundation

**Goal:** Build a consistent premium UI that is excellent on mobile and desktop.

### Brand palette

| Token | Hex | Intended use |
|---|---|---|
| Primary emerald | `#07553D` | Primary actions, active navigation, key headings on light backgrounds |
| Green | `#16804A` | Hover/active states, positive indicators |
| Deep forest | `#032F25` | Dark hero sections, drawer or navigation surfaces |
| Gold | `#C6A45A` | Decorative rules, borders, restrained highlights |
| Dark gold | `#9A742D` | Gold accents on light surfaces; verify contrast for small text |
| Ivory | `#FBF5E8` | Main warm background and appointment letter |
| Cream | `#F2E8D2` | Cards and secondary surfaces |
| White | `#FFFFFF` | Form surfaces and high-clarity content areas |
| Primary text | `#23302A` | Body text on light backgrounds |
| Muted text | `#6A706B` | Metadata and secondary copy |
| Border | `#D9CFB9` | Dividers and card outlines |
| Error | `#B42318` | Error messages |
| Warning | `#9A6700` | Attention/pending states with accessible contrast |

Saffron, white, and green can appear as restrained details inspired by the supplied logo. Emerald, gold, and ivory remain the core system.

### Component tasks
- [x] Create tokens for color, typography, spacing, radius, shadows, and breakpoints.
- [x] Define heading/body font pairing; use Arabic/Urdu-capable fonts if those languages are approved.
- [x] Build buttons, links, fields, selects, checkboxes, cards, status labels, alerts, dialogs, dropdowns, loading skeletons, and empty states.
- [x] Create public header, mobile navigation drawer, desktop navigation, footer, breadcrumbs, and page container.
- [x] Build reusable service cards and contact CTA blocks.
- [x] Define focus, hover, pressed, disabled, loading, success, and error states.
- [x] Respect reduced-motion preferences.
- [x] Establish image optimization and alt-text conventions.

### Mobile-first requirements
- Single-column content where appropriate.
- Comfortable touch targets and readable type.
- Compact, clear navigation with a visible booking CTA.
- Calendar interaction that does not require precise tiny taps.
- Forms that avoid unnecessary typing and preserve values on errors.

### Desktop-specific requirements
Desktop must not be a stretched mobile page. Compose it intentionally:
- [x] Use a centered content grid with a deliberate maximum width and generous whitespace.
- [x] Use multi-column service layouts where content benefits from comparison.
- [x] Use a richer hero composition with controlled imagery, text width, and a clear CTA hierarchy.
- [x] Use a persistent or clearly visible desktop navigation pattern; keep booking/contact actions easy to reach.
- [x] For booking, use a two-column layout when space allows: calendar/slot selection on one side and a sticky appointment summary on the other.
- [x] Keep the calendar large enough to scan comfortably; never compress day cells to fit a narrow sidebar.
- [ ] On admin desktop, use a sidebar + top bar + spacious content canvas; use readable tables, filters, bulk-safe actions, and clear detail panels. (Deferred to Phase 8+ admin dashboard).
- [x] Keep body line lengths comfortable; do not allow paragraphs to span the entire monitor.
- [x] Use subtle hover states and keyboard focus—not hover-only functionality.
- [x] Use responsive image crops and balanced typography rather than scaling mobile assets indiscriminately.
- [x] Use empty space intentionally; avoid both cramped mobile-style cards and oversized, low-information desktop cards.

### Responsive behavior
| Viewport | Design behavior |
|---|---|
| Mobile, under 640px | Single-column layout, compact header/drawer, stacked booking steps, touch-friendly calendar and forms |
| Tablet, 640–1023px | Balanced grids, wider calendar, optional side-by-side summary where it remains comfortable |
| Desktop, 1024px and above | Purpose-designed page grid, desktop navigation, multi-column service content, booking split view, admin sidebar/data tables |
| Large desktop | Constrain content width, preserve line length, use whitespace and imagery deliberately; do not stretch text or cards edge-to-edge |

### Deliverables
- Tokenized design system.
- Reusable component library.
- Responsive page shells.
- Desktop and mobile layout specifications or reviewed mockups.

### Exit criteria
Core components are visually consistent, keyboard accessible, and reviewed at mobile, tablet, standard desktop, and large desktop sizes before page implementation is considered complete.

---

## Phase 4 — Public Website Pages

**Goal:** Implement the public-facing experience using approved content.

### Pages
- [x] Home
- [x] About
- [x] Services listing
- [x] Service detail by slug
- [x] Book appointment entry
- [x] Contact
- [x] Appointment lookup
- [x] Not-found and error states

### Home
- [x] Brand hero with approved logo and concise introduction.
- [x] Primary Book Appointment CTA.
- [x] Secondary WhatsApp and Call actions.
- [x] Service highlights and approved trust/experience information.
- [x] Responsive content sections and footer.

### About
- [x] Approved biography and credentials only.
- [x] Approved imagery and language variants.
- [x] Booking/contact CTA.
- [x] No invented qualifications, fabricated testimonials, or guaranteed outcomes.

### Services
- [x] Render only active/published services.
- [x] Show name, summary, approved image/icon, and detail link.
- [x] Support the configured display order.
- [x] Add accessible loading, empty, and error states.
- [x] Add clear booking CTAs from listing and detail pages.

### Contact
- [x] `wa.me` link with URL-encoded prefilled message.
- [x] `tel:` link with approved phone number.
- [x] `mailto:` link with approved email.
- [x] Display consultation hours and address only if verified and approved.
- [x] Clearly distinguish contacting the provider from creating a booking.

### Deliverables
All approved public pages implemented and responsive.

### Exit criteria
Pages work on mobile and desktop, have approved content, and do not expose private booking/admin data.

---

## Phase 5 — Availability & Calendar Engine

**Goal:** Implement the rules that determine which dates and times can be booked.

### Availability rules
- [x] Past dates are unavailable according to the configured consultation timezone.
- [x] On the current date, elapsed time slots are unavailable.
- [x] Recurring weekly schedule controls each weekday; Sunday is data-driven and editable.
- [x] Date-specific overrides can close a day or define custom hours.
- [x] If approved, a date override can explicitly reopen a normally closed weekday.
- [x] Support breaks and multiple working intervals if required.
- [x] Enforce booking horizon and minimum advance notice.
- [x] Calculate total service duration and buffers from server-owned service data.
- [x] Ensure the full appointment fits inside an open interval.
- [x] Exclude unavailable, blocked, and already-reserved slots.
- [x] Admin schedule changes do not silently cancel existing bookings.
- [x] Warn admins if a schedule change conflicts with existing appointments.

### Calendar UI
- [x] Current month shown by default.
- [x] Navigation to allowed future months.
- [x] Clear available, selected, closed, past, and fully booked states.
- [x] Accessible day labels and keyboard navigation.
- [x] Time slots refresh when the selected date changes.
- [x] Selected services remain selected when browsing dates.
- [x] Loading, empty, error, and retry states.
- [x] Timezone visible to the visitor.

### Technical tasks
- [x] Implement a shared server-side availability service.
- [x] Return only public availability summaries, never private appointment records.
- [x] Add unit tests for timezone/date boundaries, recurring rules, overrides, durations, and capacity.
- [x] Ensure booking submission always rechecks availability, even if the calendar response was cached.
- [x] Define a concurrency-safe database strategy for slot capacity and overlapping appointments.

### Deliverables
Availability service, calendar API, public calendar UI, unit and integration tests.

### Exit criteria
Every displayed slot follows the approved policy, and a manipulated client request cannot book a closed or past slot.

---

## Phase 6 — Guest Booking & Appointment Creation

**Goal:** Allow a visitor to request an appointment without an account.

### Booking form
- [x] Select one or more active services.
- [x] Select date and available time.
- [x] Show service names, total duration, date, time, timezone, and any approved fees (if fees exist).
- [x] Collect name and phone; email optional unless client approves otherwise.
- [x] Provide preferred contact method if required.
- [x] Include a short optional message with length limits and privacy guidance.
- [x] Add clear consent/privacy notice.
- [x] Prevent duplicate submissions from double clicks/reloads.
- [x] Provide field-level validation and preserve entered values after safe validation errors.

### Server booking operation
- [x] Validate and normalize contact details.
- [x] Verify service IDs are active and derive duration/pricing from trusted database data.
- [x] Recalculate the appointment interval server-side.
- [x] Recheck date, time, schedule, capacity, daily identity limit, and status policy.
- [x] Use a transaction/locking or constraint strategy to avoid concurrent double-booking.
- [x] Create appointment and appointment-service snapshots atomically.
- [x] Generate an unguessable public appointment reference.
- [x] Create an audit event for initial booking.
- [x] Return only safe receipt fields.
- [x] Apply rate limiting and bot protection appropriate to abuse risk.

### Proposed daily booking rule
One active appointment per normalized phone number per local calendar date; the visitor may book on other dates. One appointment can include multiple services. Confirm the exact active statuses with the client. If people use different contact details, the system cannot reliably infer that they are the same person without verification.

### Status workflow
Proposed initial status is `pending` until the admin accepts it. Never display “confirmed” merely because the request was submitted.

### Deliverables
Working booking flow, server operation, database transaction, error handling, and tests.

### Exit criteria
Valid booking creates one record; invalid, closed, duplicate, or concurrent-conflicting attempts are rejected with a clear message.

---

## Phase 7 — Appointment Receipt, Lookup & Export

**Goal:** Let the visitor retain and securely retrieve their own appointment information.

### Receipt
- [x] Show brand logo and AZIZURRAHMAN name.
- [x] Show public appointment ID, current status, services, date, time, timezone, and approved contact instructions.
- [x] Show submitted/pending/confirmed state accurately.
- [x] Offer Print, Download PDF, and Download Image actions.
- [x] Use a dedicated print layout without navigation and unnecessary controls.
- [x] Avoid exposing private admin notes or lookup secrets.
- [x] Explain that a downloaded copy may become outdated if the admin later changes the appointment.

### Lookup
- [x] Provide appointment ID plus an approved verification method.
- [x] Implement OTP or secure one-time link only after provider and policy are selected.
- [x] Expire tokens/codes, limit attempts/resends, and avoid storing raw verification secrets.
- [x] Use generic responses to reduce appointment enumeration.
- [x] Do not reveal private booking data from phone/email alone.
- [x] Mark receipt/lookup pages `noindex` and prevent sensitive data from leaking into analytics/logs.

### Export
- [x] Test PDF on common mobile and desktop browsers.
- [x] Test image export with loaded fonts/logo and long text.
- [x] Verify clipping, print margins, logo fidelity, and Arabic/Urdu shaping if enabled.
- [x] Provide browser Print as fallback if download generation fails.

### Deliverables
Receipt page, lookup/verification flow, PDF/print/image export.

### Exit criteria
Visitors can access only authorized appointment details and produce readable receipts across supported devices.

---

## Phase 8 — Admin Authentication & Authorization

**Goal:** Protect every administrative route and operation.

### Tasks
- [ ] Configure Supabase Auth for administrator sign-in.
- [ ] Disable public admin registration.
- [ ] Provision admin accounts through an approved private process.
- [ ] Build admin login, loading, error, and sign-out states.
- [ ] Protect admin layouts and server operations.
- [ ] Verify admin role server-side for every protected query/mutation.
- [ ] Ensure RLS policies match server authorization.
- [ ] Prevent public visitors from querying admin data directly.
- [ ] Configure secure session handling using supported Supabase SSR patterns.
- [ ] Document admin access revocation and credential handling.

### Deliverables
Protected admin shell and verified access controls.

### Exit criteria
Unauthenticated users and non-admin accounts cannot access admin pages or invoke admin APIs directly.

---

## Phase 9 — Admin Dashboard: Appointment Management

**Goal:** Give the admin a clear operational view of appointment requests.

### Dashboard overview
- [ ] Counts for pending, confirmed, upcoming, declined, and cancelled appointments.
- [ ] Upcoming appointment list and recent activity.
- [ ] Shortcuts to appointments, calendar, services, and settings.

### Appointment list/detail
- [ ] Search by public appointment ID, name, phone, or email.
- [ ] Filter by date range, status, and service.
- [ ] Sort by date/time and creation time.
- [ ] Paginate large result sets.
- [ ] View service snapshots, contact details, schedule, and visitor message.
- [ ] Confirm, decline, request reschedule, or cancel using allowed state transitions.
- [ ] Add private admin notes that never appear in public responses/receipts.
- [ ] Record actor, timestamp, old/new status, and event in an audit trail.
- [ ] Warn before destructive or consequential actions.
- [ ] Ensure notifications are attempted only after the status change commits.

### Desktop UX requirements
- Use a clear sidebar/topbar structure with a spacious main canvas.
- Use readable data tables with strong column hierarchy and restrained status badges.
- Filters should remain easy to locate; on small screens, convert tables to stacked cards or a deliberate horizontally scrollable view.
- Appointment details should use a readable detail panel/page rather than squeezing everything into a dense table.
- Avoid tiny text and action icons without accessible labels.

### Deliverables
Admin dashboard, appointment table/detail, status actions, audit history.

### Exit criteria
Admin can manage the full appointment lifecycle and all changes are authorized and auditable.

---

## Phase 10 — Admin Dashboard: Availability & Calendar Management

**Goal:** Let the admin control when bookings can be accepted.

### Tasks
- [ ] Build a weekly schedule editor for open/closed weekdays and working intervals.
- [ ] Add breaks or multiple intervals if required.
- [ ] Build a monthly admin calendar.
- [ ] Add one-off date closure and custom-hours override.
- [ ] Allow a specific date to reopen a recurring closed day only if the approved policy permits it.
- [ ] Show closure type and existing appointment conflicts.
- [ ] Require explicit confirmation before closing a date that already has appointments.
- [ ] Never silently cancel or reschedule existing bookings.
- [ ] Show a preview of public availability for a selected date.
- [ ] Validate intervals and prevent overlapping/invalid ranges.
- [ ] Revalidate schedule on save and write an audit event.
- [ ] Refresh public availability after successful changes.

### Deliverables
Weekly schedule editor, date override editor, admin calendar, conflict warnings.

### Exit criteria
Admin can close a single day or recurring weekday and the public calendar consistently reflects the rule.

---

## Phase 11 — Admin Dashboard: Service & Site Settings

**Goal:** Allow authorized management of the public service catalogue and approved settings.

### Services
- [ ] Create, edit, publish/unpublish, archive, and reorder services.
- [ ] Manage name, slug, summary, full description, image/icon, duration, buffer, and active state.
- [ ] Validate slugs and prevent duplicate identifiers.
- [ ] Ensure existing bookings preserve the service name/duration snapshot from booking time.
- [ ] Prevent inactive services from being newly booked.

### Site settings
- [ ] Manage approved public contact information if included in scope.
- [ ] Configure timezone, booking horizon, advance notice, and capacity.
- [ ] Manage approved WhatsApp prefilled message templates.
- [ ] Keep provider keys/secrets outside the database settings table.
- [ ] Add a clear confirmation step for high-impact changes.

### Deliverables
Service management and approved site settings.

### Exit criteria
Public service pages reflect saved changes and historical bookings remain intact.

---

## Phase 12 — Email Notifications & Contact Integrations

**Goal:** Add approved communication channels without compromising booking reliability.

### Email, if approved
- [ ] Configure provider account and verified sender domain.
- [ ] Create branded booking-received, confirmed, declined, cancelled, and rescheduled templates as applicable.
- [ ] Include appointment ID, services, date/time/timezone, current status, and secure link where appropriate.
- [ ] Send only after the database transaction succeeds.
- [ ] Log delivery attempt/result and retry transient failures safely.
- [ ] Do not roll back a booking if email fails.
- [ ] Test invalid address, provider failure, rate limit, and retry behavior.

### WhatsApp and phone
- [ ] Use verified international-format number.
- [ ] URL-encode prefilled WhatsApp message text.
- [ ] Confirm mobile and desktop WhatsApp behavior.
- [ ] Use `tel:` and `mailto:` links.
- [ ] State clearly that opening WhatsApp does not send the message automatically.
- [ ] Keep automated WhatsApp Business API outside the initial scope unless separately approved.

### Deliverables
Working direct-contact links and, if included, email notifications.

### Exit criteria
Links open correctly, and notification failure does not lose bookings or misrepresent status.

---

## Phase 13 — SEO, Accessibility, Performance & Privacy

**Goal:** Prepare the website for public use and reduce avoidable quality risks.

### SEO
- [ ] Page-specific title and meta description.
- [ ] Canonical URLs, sitemap, robots.txt, favicon, and social preview metadata.
- [ ] Semantic headings and meaningful link labels.
- [ ] Add structured data only where accurate and appropriate.
- [ ] `noindex` admin and private appointment pages.
- [ ] Do not publish unverified address, hours, qualifications, reviews, or claims.

### Accessibility
- [ ] Check text contrast, focus visibility, labels, semantic landmarks, and keyboard operation.
- [ ] Ensure calendar cells announce date and availability.
- [ ] Never use color alone to communicate state.
- [ ] Support reduced motion and zoom/text enlargement.
- [ ] Add useful alt text to meaningful images.
- [ ] Test RTL and non-Latin script rendering if those languages are enabled.

### Performance
- [ ] Optimize and responsively serve images.
- [ ] Keep informational pages lightweight and avoid unnecessary client JavaScript.
- [ ] Use appropriate loading states and pagination.
- [ ] Avoid caching personalized/private appointment responses.
- [ ] Recheck booking availability server-side regardless of any cache.
- [ ] Measure real deployed performance; do not promise a Lighthouse score before testing.

### Privacy and abuse prevention
- [ ] Add a client-approved privacy notice and data-retention policy.
- [ ] Minimize personal data collected and logged.
- [ ] Rate-limit booking, lookup, OTP, and resend endpoints.
- [ ] Use generic lookup responses to reduce enumeration.
- [ ] Review dependency/security updates and production headers.
- [ ] Define backup and restore procedures.

### Deliverables
SEO configuration, accessibility review, performance review, privacy/security checklist.

### Exit criteria
No known critical accessibility/privacy/security issue remains unresolved without explicit acceptance.

---

## Phase 14 — QA, Automated Testing & User Acceptance Testing

**Goal:** Verify all core journeys and edge cases before production.

### Unit tests
- [ ] Past-date and current-day slot rules.
- [ ] Timezone and date-boundary behavior.
- [ ] Weekly availability and date override precedence.
- [ ] Duration/buffer calculation for multiple services.
- [ ] Daily identity and status-based booking limits.
- [ ] Allowed appointment status transitions.
- [ ] Input normalization and validation.

### Integration tests
- [ ] Booking transaction and appointment-service snapshots.
- [ ] Concurrent requests attempting the same slot.
- [ ] Concurrent requests attempting the same phone/date rule.
- [ ] RLS: public visitor vs admin permissions.
- [ ] Date closure with existing appointments.
- [ ] Admin status changes and audit events.
- [ ] Lookup verification and expiry.
- [ ] Notification failure and retry behavior, if enabled.

### End-to-end tests
- [ ] Visitor browses services and books one service.
- [ ] Visitor books multiple services in one appointment.
- [ ] Past date, closed Sunday, closed override, and full slot are blocked.
- [ ] Successful booking shows correct pending/confirmed state.
- [ ] Visitor prints/downloads receipt as PDF and image.
- [ ] Visitor lookup cannot expose another user's appointment.
- [ ] Admin signs in, searches, filters, and updates status.
- [ ] Admin closes a date and public availability updates.
- [ ] Admin edits a service and the public catalogue updates.
- [ ] WhatsApp/call/email links behave correctly.
- [ ] Mobile and desktop layouts work at supported breakpoints.

### Manual visual QA
- [ ] iOS Safari and Android Chrome.
- [ ] Desktop Chrome, Firefox and Safari where available.
- [ ] Narrow viewport, tablet, standard desktop and large desktop.
- [ ] Long service names, long messages, form errors, loading states and empty states.
- [ ] Keyboard-only use, visible focus, zoom and screen-reader labels.
- [ ] PDF/image export layout and any Arabic/Urdu/Hindi text.

### Exit criteria
All critical booking, authorization, privacy, and availability tests pass. Remaining defects are documented and explicitly accepted.

---

## Phase 15 — Production Deployment & Launch

**Goal:** Launch with correct configuration, tested data rules, and an operational handover.

### Tasks
- [ ] Create/verify production Supabase project and apply migrations.
- [ ] Review RLS policies and production permissions.
- [ ] Configure production environment variables securely.
- [ ] Provision admin account(s) privately and verify sign-in.
- [ ] Configure production domain and HTTPS.
- [ ] Configure email provider/sender domain if enabled.
- [ ] Confirm timezone, working hours, services, recurring closures, booking limits, and contact details.
- [ ] Confirm the privacy notice and client-approved content.
- [ ] Test complete production-like booking flow.
- [ ] Verify production error logs and notification logs.
- [ ] Confirm backups and document restoration limitations.
- [ ] Document rollback/deployment recovery steps.
- [ ] Remove test data and disable test-only routes/configuration.
- [ ] Obtain client sign-off before public announcement.

### Deliverables
Production site, production database, secure admin access, launch checklist, recovery notes.

### Exit criteria
All launch-critical checks pass and the client approves the release.

---

## Phase 16 — Handover, Documentation & Post-Launch Stabilization

**Goal:** Ensure the client can operate the website and the team can maintain it.

### Tasks
- [ ] Deliver admin user guide for appointments, statuses, services, weekly hours, and date overrides.
- [ ] Document deployment, environment variables, migrations, and troubleshooting.
- [ ] Document domain, hosting, database, email provider, ownership, and recurring charges.
- [ ] Document backup/restore process and who is responsible for it.
- [ ] Explain pending vs confirmed booking states and how to handle conflicting appointments.
- [ ] Provide test summary and known limitations.
- [ ] Agree support window, warranty, response expectations, and future change process.
- [ ] Monitor launch issues and fix agreed defects during the stabilization window.

### Deliverables
Admin guide, technical handover, test summary, access/ownership handover, support terms.

### Exit criteria
Client understands routine operations and the ownership/support boundaries are documented.

---

# 5. Cross-Phase Technical Rules

## 5.1 Appointment status model

Proposed states:

- `pending` — request received, awaiting admin decision.
- `confirmed` — accepted by admin.
- `declined` — rejected; no longer reserves capacity.
- `reschedule_requested` — being considered; original slot remains reserved until resolved unless client approves otherwise.
- `cancelled` — cancelled; no longer reserves capacity after cancellation commits.

All transitions must be validated server-side and recorded in an audit history. Final status policy requires client approval.

## 5.2 Availability precedence

1. Past/invalid date → unavailable.
2. Date-specific override → takes precedence over recurring weekday rules.
3. Otherwise use recurring weekday schedule.
4. Apply breaks, booking horizon, advance notice, and slot capacity.
5. Account for bookings whose statuses reserve capacity.
6. Recheck everything transactionally when the booking is submitted.

## 5.3 Security rules

- RLS enabled on relevant tables.
- Server-side admin authorization on every protected operation.
- Service-role keys and provider secrets remain server-only.
- No appointment lookup based only on phone/email or predictable IDs.
- Verification tokens are high entropy, expire, and are rate-limited.
- Public endpoints expose availability summaries, not private appointment records.
- Logs must avoid unnecessary personal data and secrets.
- Booking integrity is enforced by transactions/constraints, not frontend state.

## 5.4 Suggested environment variables

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server only
RESEND_API_KEY=                  # optional, server only
APPOINTMENT_LOOKUP_SECRET=       # server only
NEXT_PUBLIC_SITE_URL=
CONSULTATION_TIMEZONE=           # client-approved IANA timezone
```

Do not commit real secrets. Validate required environment variables at application startup/build where appropriate.

---

# 6. Desktop UX Acceptance Checklist

Desktop quality is a first-class requirement. Do not treat it as a final CSS pass.

- [ ] Home page has a deliberate desktop hero composition with clear visual hierarchy and a balanced text/image relationship.
- [ ] Navigation is comfortable at desktop width and booking/contact CTAs remain obvious.
- [ ] Service cards use a sensible grid with consistent card heights and readable descriptions.
- [ ] Content has a maximum width; long paragraphs do not stretch across the full screen.
- [ ] Booking uses a spacious calendar and a separate summary panel when viewport permits.
- [ ] Calendar day cells remain large and scannable; no compressed mobile calendar.
- [ ] Admin dashboard uses sidebar/topbar navigation and a readable content canvas.
- [ ] Appointment table supports useful filters, search, pagination, and responsive detail views.
- [ ] Hover effects are subtle and never required to discover essential actions.
- [ ] Focus states, keyboard support, contrast, and accessible labels remain correct.
- [ ] Large screens use whitespace and imagery intentionally rather than enlarging every element.
- [ ] Mobile and desktop both have polished loading, error, empty, success, and disabled states.
- [ ] QA covers at least a narrow mobile viewport, tablet, 1366px-class laptop, and a large desktop viewport.

---

# 7. Final Acceptance Criteria

The initial release is complete when:

1. All agreed public pages and service listing/detail pages are live.
2. Visitors can book without creating an account.
3. The calendar prevents past dates and follows recurring availability/date overrides.
4. Multi-service duration and capacity rules are correct.
5. Duplicate daily booking and concurrent double-booking protections are enforced server-side.
6. Booking status is accurate and admin actions are auditable.
7. Appointment lookup uses the approved secure verification method.
8. Receipt print/PDF/image exports work on supported devices.
9. Admin can manage appointments, services, weekly hours, recurring closures, and one-off date overrides.
10. WhatsApp/call/email links work with verified client contact details; optional email notifications work if included.
11. Mobile and desktop UX pass responsive and accessibility QA.
12. RLS, server authorization, rate limits, and privacy controls have been tested.
13. Production deployment, migrations, backup notes, and rollback steps are documented.
14. Client-approved content, business rules, ownership, support, and recurring third-party costs are confirmed.
15. Client completes acceptance review and approves launch.

---

# 8. Client Decisions to Lock Before Coding the Scheduling Engine

| Decision | Recommended default | Must be approved |
|---|---|---|
| Appointment confirmation | New booking starts as `pending`; admin confirms | Yes |
| Provider capacity | One appointment at a time | Yes |
| Service duration | Sum selected service durations plus buffers | Yes |
| Minimum advance notice | 24 hours | Yes |
| Booking horizon | 60 days | Yes |
| Sunday | Recurring closed day, editable in admin | Yes |
| Date override | May reopen a normally closed weekday if explicitly set | Yes |
| Daily identity rule | One active booking per normalized phone per local date | Yes |
| Pending booking capacity | Pending and confirmed reserve capacity | Yes |
| Cancelled/declined bookings | Do not count toward daily limit | Yes |
| Lookup | Appointment ID plus OTP or secure one-time link | Select method/provider |
| Timezone | Explicit client-approved IANA timezone | Yes |
| Email notifications | Optional; enable after provider/domain setup | Yes |
| WhatsApp automation | Click-to-chat only in initial release | Yes |
| Languages | English by default; additional languages only with approved translations | Yes |
| Data retention | Client-approved retention policy | Yes |

---

## 9. Implementation Order at a Glance

1. Discovery and policy approval
2. Project foundation and CI
3. Supabase schema, migrations, RLS
4. Design system and responsive shells
5. Public pages
6. Availability engine and calendar
7. Guest booking transaction
8. Receipt, secure lookup and exports
9. Admin authentication
10. Appointment management dashboard
11. Availability/calendar administration
12. Service and site settings
13. Email/contact integrations
14. SEO, accessibility, performance and privacy
15. Automated QA and UAT
16. Production deployment
17. Handover and stabilization

**Recommended development rule:** complete and test each phase's exit criteria before moving to the next dependent phase. In particular, lock the booking policies and database integrity strategy before polishing the booking UI.
