# AZIZURRAHMAN — Technical Product Requirements Document

> **Version:** 1.0 — Draft for scope approval  
> **Prepared for:** AZIZURRAHMAN  
> **Delivery team:** Marvel’s Techworks  
> **Product type:** Public website + guest appointment booking + protected admin dashboard  
> **Core stack:** Next.js, TypeScript, Tailwind CSS, Supabase PostgreSQL  
> **Status:** Technical baseline proposed; business rules marked TBD require client approval

**Visual direction:** Emerald Green · Gold · Ivory · Restrained Saffron/White/Green

---

AZIZURRAHMAN

TECHNICAL PRODUCT REQUIREMENTS DOCUMENT

Mobile-first personal website, service catalogue and appointment booking system

| Document field | Value |
| --- | --- |
| Version | 1.0 — Draft for scope approval |
| Prepared for | AZIZURRAHMAN |
| Delivery team | Marvel’s Techworks |
| Product type | Public website + guest appointment booking + protected admin dashboard |
| Core stack | Next.js, TypeScript, Tailwind CSS, Supabase PostgreSQL |
| Status | Technical baseline proposed; business rules marked TBD require client approval |

Visual direction: Emerald Green • Gold • Ivory • Restrained Saffron/White/Green

## Document Control

| Item | Details |
| --- | --- |
| Purpose | Define the product scope, UX, architecture, data model, booking rules, security, testing, and launch criteria. |
| Primary audience | Client, product owner, designer, frontend/backend developer, QA, and deployment owner. |
| Source baseline | Client-provided mobile UI reference and AZIZURRAHMAN Website Development Order Letter. |
| Change control | Any change to booking policies, integrations, scope, or commercial terms must be approved before implementation. |
| Status language | Confirmed = explicitly requested; Proposed = recommended default; TBD = client decision required. |

### Related documents

| Document | Purpose |
| --- | --- |
| [Implementation plan](AZIZURRAHMAN_Implementation_Plan.md) | Phase-by-phase delivery plan and current phase status. |
| [Requirements baseline](requirements/REQUIREMENTS_BASELINE.md) | Traceable FR/NFR identifiers with acceptance criteria. |
| [Business rules](requirements/BUSINESS_RULES.md) | Scheduling policy table, status transitions, approval status. |
| [Open questions](requirements/OPEN_QUESTIONS.md) | Client decisions still required. |
| [Content checklist](requirements/CONTENT_CHECKLIST.md) | Client-fillable content and asset checklist. |
| [Integrations](requirements/INTEGRATIONS.md) | Hosting, Supabase, email, WhatsApp, DNS and credentials. |
| [Database docs](database/SCHEMA.md) | Implemented schema, data dictionary, RLS policies, migrations. |

## Contents

- 1. Executive summary and goals
- 2. Scope and out of scope
- 3. Users, roles and permissions
- 4. Product pages and user journeys
- 5. Appointment calendar and scheduling rules
- 6. Admin dashboard
- 7. Design system and responsive UX
- 8. Technical stack and architecture
- 9. Database schema and data integrity
- 10. API/server operations
- 11. Security, privacy and accessibility
- 12. Notifications and exports
- 13. SEO, performance and observability
- 14. Testing and acceptance criteria
- 15. Deployment, environments and operations
- 16. Phases, deliverables, risks and decisions
## 1. Executive Summary

AZIZURRAHMAN is a mobile-first public website for presenting an approved profile and spiritual consultation services. Visitors can browse services, contact the provider through WhatsApp/phone/email, and submit appointment requests without creating an account. A protected admin dashboard enables authorized staff to manage services, recurring availability, date-specific closures, and appointment statuses.

The appointment experience is a core feature, not a simple contact form. It includes a premium monthly calendar, past-date prevention, recurring closed weekdays (for example, Sundays), date overrides, time-slot availability, multi-service booking, duplicate-booking rules, booking receipts, appointment lookup, and print/PDF/image export.

The site must not claim a request is confirmed until the configured confirmation process is completed. The default proposed workflow is manual admin confirmation.

### 1.1 Product goals

- Deliver a premium, trustworthy, mobile-first experience aligned with the supplied AZIZURRAHMAN logo and reference screens.
- Let visitors discover services and request appointments with minimal friction and no account registration.
- Give the admin reliable control over weekly schedules, individual dates, time slots, and appointment outcomes.
- Prevent past-date selection, overlapping appointments, double-booking, and bypass of booking limits.
- Allow visitors to retain a receipt and securely retrieve appointment information later.
- Keep implementation and maintenance proportionate to a small application.
### 1.2 Success measures

| Measure | Target / acceptance approach |
| --- | --- |
| Booking completion | A valid visitor can submit a booking on mobile and desktop without account creation. |
| Availability integrity | Concurrent submissions cannot reserve the same capacity/slot beyond configured limits. |
| Admin control | Admin can close a weekday or one date and the public calendar reflects it. |
| Status clarity | Request and confirmation states are visibly distinct in UI, email (if enabled), and receipt. |
| Privacy | A visitor cannot retrieve another visitor’s private appointment details using an unverified lookup. |
| Responsive quality | Core flows work at narrow mobile, tablet, laptop, and desktop breakpoints. |

## 2. Scope

### 2.1 In scope

- Responsive public website: Home, About, Services, Service Details, Book Appointment, Contact.
- Service catalogue managed by admin, including active/inactive status, descriptions, display order, and duration metadata.
- Guest booking for one or more services in a single appointment.
- Monthly calendar with past dates disabled, weekly recurring rules, date-specific overrides, and available time slots.
- Booking receipt with unique appointment ID, print layout, PDF download, and image export.
- Appointment lookup by appointment ID and/or contact detail, with verification before exposing personal data.
- Protected admin login and dashboard for appointments, service management, availability, and basic site settings.
- WhatsApp click-to-chat with URL-encoded prefilled text, phone click-to-call, and email click-to-compose.
- Email acknowledgement/status notification if a provider is configured and approved.
- Basic SEO, accessibility, spam prevention, secure data handling, deployment, QA, and handover.
### 2.2 Out of scope for initial release

- Public user accounts, profiles, password reset, or a user dashboard.
- Online payments, deposits, invoicing, or payment gateway integration.
- Native iOS/Android applications.
- Automated WhatsApp Business messaging unless separately approved and configured with an eligible provider.
- Video consultations, live chat, telephony integration, or third-party calendar synchronization.
- Advanced analytics, CRM, multi-branch scheduling, multiple staff calendars, or complex resource allocation.
- Publishing unapproved biography, qualifications, testimonials, religious claims, or contact details.
### 2.3 Scope boundaries

WhatsApp/phone/email actions are direct communication links. They do not create an appointment record unless the visitor uses the booking flow. A booking acknowledgement is not the same as admin confirmation. Domain, hosting, email provider, third-party charges, warranty, support, and source-code transfer terms must be agreed in the quotation/contract.

## 3. Users, Roles and Permissions

| Role | Capabilities | Restrictions |
| --- | --- | --- |
| Public visitor | Browse published pages/services; select service(s), date/time; submit booking; view own receipt; request appointment lookup; use contact links. | No admin access; cannot query the appointments table directly; must pass verification before seeing private booking details. |
| Admin | Sign in; view all appointment records; change status; manage availability, services, approved public content and settings. | Must be authenticated and authorized server-side; no public registration. |
| System/service role | Perform trusted server-side booking transactions and configured notifications. | Secrets stay server-side; privileged database credentials must never be sent to the browser. |

### 3.1 Authentication model

Only administrators require an account. Use Supabase Auth for admin authentication, with admin users provisioned by an authorized owner rather than public self-registration. Enforce authorization on every protected server operation and database query. Hiding an admin link is not access control.

### 3.2 Public appointment lookup

Do not reveal appointment data solely because a person enters a phone number or email address. Recommended flow: appointment ID plus a one-time verification code sent to the contact channel, or a high-entropy private lookup token. The client must approve the chosen verification method, provider, expiry, resend limits, and cost. Return generic responses where appropriate to reduce account/booking enumeration.

## 4. Public Website and User Journeys

### 4.1 Home

- Use the supplied logo without altering Arabic/English spelling or design unless written approval is given.
- Premium hero section with brief approved introduction, service highlights, and prominent Book an Appointment CTA.
- Secondary WhatsApp and Call actions with verified client contact information.
- Service cards and concise credibility information only when client-approved.
- Responsive navigation, language selector if translations are supplied, and footer with approved contact/legal links.
### 4.2 About

- Approved biography, religious education, qualifications, experience, languages, and images only.
- No invented credentials, fabricated reviews, guaranteed supernatural outcomes, or guaranteed cures.
- CTA to book or contact.
### 4.3 Services and Service Details

- List active services in admin-configured order, with image/icon, name, summary, and details.
- Initial service categories may include Dua & Wazifa, Taweez-related services, Quranic Guidance, Spiritual Consultation, Family & Marriage Guidance, and Rohani Guidance, subject to client approval.
- Service detail pages must use approved content and clearly present the booking CTA.
- Visitors can select multiple eligible services in one appointment.
### 4.4 Contact

- Use only verified phone/WhatsApp/email, address, and consultation hours.
- Optional map/directions link only after the client approves the exact public address.
- Provide accessible direct-call, email, and WhatsApp actions.
### 4.5 Booking journey

1. Visitor chooses one or more active services.
1. The application loads the current calendar availability and applicable booking rules.
1. Visitor selects an allowed date and available time slot.
1. The application displays a summary of services, date, time, and calculated duration.
1. Visitor enters name, phone, optional email, preferred contact channel, and optional short message.
1. Server validates input, service state, date/time, availability, capacity, daily identity rule, and duplicate/conflicting bookings atomically.
1. On success, the server creates a booking ID and the UI shows a receipt with the correct status.
1. Visitor can print/download the receipt and, where configured, receive email acknowledgement.
1. Admin reviews and changes status. Status changes appear in the admin record and are communicated through configured channels.
### 4.6 Appointment receipt

- Display brand logo, AZIZURRAHMAN name, appointment ID, submitted/confirmed status, service names, date, time, timezone, and contact instructions.
- Include only necessary personal details; avoid exposing unnecessary information on a shareable document.
- Offer Print, Download PDF, and Download Image actions.
- Use a print-specific layout without website navigation or action buttons.
- Receipt status must reflect the latest server-confirmed status; a downloaded copy may become outdated after later admin changes.
## 5. Appointment Calendar and Scheduling

### 5.1 Calendar UI requirements

- Show the current month by default and allow navigation to permitted future months.
- Never allow selection of dates earlier than the current date in the configured consultation timezone.
- On the current date, hide or disable time slots that have already passed, respecting minimum advance notice.
- Visually distinguish available, selected, unavailable/closed, fully booked, and past dates using color plus labels/icons—not color alone.
- Show loading, error, no availability, and retry states.
- Preserve selected services when changing dates; refresh times when the date changes.
- Use accessible keyboard navigation, visible focus, semantic labels, and sufficiently large touch targets.
- Show the consultation timezone clearly near time-slot selection and on receipts.
### 5.2 Availability rule precedence

1. Past date or invalid date: unavailable.
1. Date-specific override: takes precedence over recurring weekday rules for that date.
1. If no date override exists, apply recurring weekday rules and working hours.
1. Apply breaks, blocked periods, booking horizon, advance notice, and slot capacity.
1. Subtract confirmed appointments and any other statuses that reserve capacity according to the approved policy.
1. Recheck all rules in the server-side booking transaction immediately before creating a booking.
The client must approve whether a date override can reopen a normally closed weekday. Recommended behavior: yes, a date-specific override can explicitly open a normally closed day, but only within configured custom hours and without conflicting bookings.

### 5.3 Weekly recurring availability

- Admin configures each weekday as open/closed and, when open, sets one or more time ranges.
- Sunday can be configured as a recurring closed day; it should not be hard-coded as a permanent rule.
- Support breaks or multiple intervals if required, e.g. 09:00–12:00 and 14:00–18:00.
- Changes apply to future availability calculations. Do not silently cancel existing appointments.
- If a new schedule conflicts with existing appointments, warn the admin and require an explicit resolution.
### 5.4 Date-specific overrides

- Admin selects a date and chooses Closed, Custom Hours, or Reopen (if permitted by policy).
- Optional private reason/note is visible only to authorized admins and must not appear publicly.
- Support one-off closures for travel, personal commitments, holidays, or other unavailability.
- Require confirmation when closing a date that already contains appointments.
- The UI must show recurring closure and override indicators in the admin calendar.
### 5.5 Time-slot generation

- Generate candidate slots from the working intervals and configured slot interval/duration.
- For multi-service appointments, calculate total duration from selected services plus required buffers, unless an explicit override policy is approved.
- A slot is available only if the full appointment duration fits in an open interval and does not overlap a conflicting reservation.
- Use server-side canonical timestamps and the configured timezone; store timestamps consistently in UTC and retain the local appointment date/time semantics needed for scheduling.
- Recompute availability on the server when booking is submitted; client-side disabled buttons are not sufficient.
- Prevent concurrent requests from exceeding slot/day capacity using a database transaction, exclusion/unique constraints where applicable, or a carefully designed locking strategy.
### 5.6 Booking frequency / identity policy

Proposed rule from project discussion: one appointment per normalized phone number per local calendar date; multiple appointments on other dates are allowed. A single appointment may contain multiple services. If the same person uses different contact details, the system cannot reliably identify them as the same person without verification.

The client must decide whether a cancelled or declined booking releases the daily limit. Recommended: only active/pending/confirmed bookings count toward the daily limit; declined and cancelled bookings do not. The database operation must implement the chosen statuses consistently.

### 5.7 Status model

| Status | Meaning | Reserves slot? (proposed) |
| --- | --- | --- |
| pending | Request received; awaiting admin decision. | Yes, to avoid overselling; confirm policy. |
| confirmed | Admin accepted the appointment. | Yes. |
| declined | Admin declined the request. | No. |
| reschedule_requested | A reschedule is being considered. | Original slot remains reserved until resolved; confirm policy. |
| cancelled | Appointment cancelled. | No, once cancellation is committed. |

### 5.8 Cancellation/rescheduling

- Admin can cancel or reschedule from the dashboard with confirmation and an audit entry.
- Public cancellation/rescheduling should require a secure, expiring verification link or OTP; do not rely on appointment ID alone.
- When rescheduling, check the target slot and daily limit before committing, and avoid an intermediate state that loses the original booking.
- Notify visitor by configured email/WhatsApp channel only after the status update succeeds.
- Define a client-approved cancellation cutoff/policy before launch.
## 6. Admin Dashboard

### 6.1 Dashboard overview

- Counts for pending, confirmed, upcoming, and cancelled appointments.
- Upcoming appointment list and recent activity.
- Quick links to calendar, appointments, services, and settings.
### 6.2 Appointment management

- Search by appointment ID, name, phone, or email; restrict results to authenticated admins.
- Filter by date range, status, and service; sort by date/time and created time.
- View full booking details and the list of selected services.
- Confirm, decline, request rescheduling, cancel, or update booking according to allowed state transitions.
- Record status changes, actor, timestamp, and optional internal note.
- Show clear warnings before changing availability that conflicts with existing bookings.
### 6.3 Availability management

- Monthly calendar with past dates visually distinct and no accidental edits to historical dates.
- Weekly schedule editor, recurring closed days, opening hours, breaks, and slot settings.
- Date override editor for closed dates/custom hours/reopening exceptions.
- Optional daily capacity and advance-booking limits.
- Preview the public availability result for a chosen date.
- All changes saved through validated server operations and reflected on the public calendar.
### 6.4 Services/content/settings

- Create/edit/archive services, set display order, publish/unpublish, descriptions, images, and durations.
- Manage approved public profile text and verified contact details if CMS-like editing is included in final scope.
- Configure timezone, working hours, appointment duration, booking horizon, and contact action templates.
- Admin notes must remain private and must not be included in public API responses or exports.
## 7. Design System and Visual Theme

### 7.1 Brand direction

Use the client-supplied AZIZURRAHMAN logo as the primary brand asset. Preserve the logo's Arabic and English spelling/design. The UI should match the supplied mobile references: premium Islamic editorial styling, emerald green, gold detailing, warm ivory panels, ornamental geometry used sparingly, readable type, generous spacing, and rounded cards.

### 7.2 Proposed color tokens

| Token | Hex | Usage |
| --- | --- | --- |
| Primary / Emerald | #07553D | Primary buttons, active navigation, headings on light surfaces. |
| Primary hover / Green | #16804A | Hover/active states, positive indicators, selected controls. |
| Deep forest | #032F25 | Dark hero sections, drawer/navigation background. |
| Gold | #C6A45A | Borders, dividers, decorative rules, premium highlights. |
| Gold dark | #9A742D | Gold text/icons on light backgrounds; avoid low-contrast small text. |
| Ivory | #FBF5E8 | Main page background and appointment letter. |
| Cream surface | #F2E8D2 | Cards, panels, secondary surfaces. |
| White | #FFFFFF | Forms and high-clarity content surfaces. |
| Text primary | #23302A | Body text on light backgrounds. |
| Text muted | #6A706B | Supporting copy and metadata. |
| Border | #D9CFB9 | Subtle outlines and separators. |
| Error | #B42318 | Validation and failure states. |
| Warning | #9A6700 | Pending/attention states with accessible contrast. |
| Success | #16804A | Successful operations and confirmed status. |

Saffron, white, and green accents may be used in restrained decorative elements inspired by the supplied logo; they should not overwhelm the emerald/gold/ivory system.

### 7.3 Typography

- Use a refined serif display face for major editorial headings where it remains readable; use a clean sans-serif for UI, forms, tables, and body copy.
- Use a suitable Arabic/Urdu-capable font for Arabic-script content and test shaping, line height, and RTL rendering.
- Hindi/Devanagari and Urdu translations must be supplied or approved by the client; do not machine-invent religious copy and publish it without review.
- Use responsive type scales, clear hierarchy, and comfortable line height; avoid decorative fonts for long content.
### 7.4 Component styling

- Buttons: emerald filled primary CTA, ivory/outlined secondary action, visible focus and disabled states.
- Cards: warm cream/ivory surface, thin beige/gold border, modest radius, restrained shadow.
- Calendar: square/soft-rounded day cells, selected emerald fill, availability indicator, disabled past/closed states.
- Forms: labeled fields, clear required/optional markers, inline errors, persistent values after validation failure.
- Navigation: compact mobile header, accessible drawer, active state in emerald; do not hide critical booking CTA.
- Use Islamic geometric motifs and lantern-like decorative elements as background accents only; preserve readability and performance.
### 7.5 Responsive behavior

| Breakpoint | Expected behavior |
| --- | --- |
| Mobile < 640px | Primary design target; single-column forms/cards, compact calendar, touch-friendly controls, accessible drawer. |
| Tablet 640–1023px | Balanced two-column sections where useful; calendar and form may sit side-by-side when space permits. |
| Desktop ≥ 1024px | Constrained content width, richer hero composition, service grid, admin sidebar and data table. |

### 7.6 Accessibility

- Target WCAG 2.2 AA where practical: text contrast, keyboard operation, focus visibility, labels, semantic headings, and screen-reader announcements.
- Do not use color alone to communicate available/closed/selected status.
- Calendar days must have accessible names including full date and availability status.
- Honor reduced-motion preferences and avoid essential content in decorative images.
- Provide alt text for meaningful images and empty alt text for decorative assets.
## 8. Technology Stack and Architecture

| Layer | Technology / choice | Rationale |
| --- | --- | --- |
| Web framework | Next.js App Router + TypeScript | Public pages, server rendering, route handlers/server actions, metadata and cohesive codebase. |
| Styling | Tailwind CSS + reusable components | Consistent design tokens and responsive implementation. |
| Database | Supabase PostgreSQL | Relational booking data, transactions, constraints and availability queries. |
| Admin auth | Supabase Auth | Managed admin authentication; no public account system. |
| Authorization | PostgreSQL RLS + server-side authorization | Least-privilege data access. |
| Validation | Zod or equivalent schema validation | Shared input schemas and predictable error handling. |
| Email | Resend or approved SMTP provider (optional until configured) | Booking acknowledgement and status notifications. |
| WhatsApp | wa.me click-to-chat; optional approved Business API later | No paid API required for a user-initiated chat link. |
| PDF | Server/client PDF generation selected during implementation | Printable appointment letter with reliable layout. |
| Image export | Client-side DOM/canvas rendering library selected during implementation | Save receipt as PNG/JPEG; test fonts and logo rendering. |
| Hosting | Vercel + Supabase | Convenient deployment and managed database. |
| Monitoring | Host logs plus error reporting if approved | Diagnose booking failures and production incidents. |

### 8.1 High-level architecture

The browser renders public pages and the interactive calendar. Public reads should expose only published services and availability summaries. Booking creation, appointment lookup verification, admin actions, and status changes go through trusted server-side handlers. Those handlers validate requests and execute a transactional database operation. Supabase PostgreSQL stores the source of truth. Optional email notifications are sent only after the database transaction succeeds.

| Component | Responsibilities |
| --- | --- |
| Public UI | Pages, calendar interaction, service selection, booking form, receipt, print/export controls. |
| Next.js server layer | Input validation, rate limiting hooks, booking transaction calls, appointment lookup verification, admin authorization, notifications. |
| Supabase Auth | Admin sign-in/session management. |
| PostgreSQL | Services, recurring rules, overrides, appointments, appointment-service links, audit history. |
| Notification provider | Email delivery when configured; failures logged without losing the saved appointment. |
| Deployment platform | HTTPS, environment configuration, build/deploy pipeline, logs. |

### 8.2 Suggested repository structure

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
      appointments/[publicToken]/page.tsx
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
    calendar/
    booking/
    services/
    admin/
    layout/
    ui/
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

### 8.3 Rendering and caching

- Render public informational pages server-side or statically where content allows.
- Do not cache personalized appointment responses, admin data, or verification endpoints in shared caches.
- Availability can be cached briefly only if booking submission always performs a fresh transactional recheck.
- Revalidate service/public content after admin edits; ensure stale client state cannot bypass server rules.
## 9. Database Design

> **Implementation note (Phase 2, 2026-10-20):** the physical schema now lives in `supabase/migrations/` and is documented in [database/SCHEMA.md](database/SCHEMA.md) and [database/DATA_DICTIONARY.md](database/DATA_DICTIONARY.md). Where the logical table below differs (e.g. `weekly_availability.is_closed` plus a separate intervals table instead of `is_open/start_time/end_time`; `notification_*` and lookup-token storage deferred), the database docs are authoritative.

The following is the proposed logical schema. Exact SQL types, indexes, RLS policies, status transitions, and constraints must be reviewed in migration design. All timestamps should be stored consistently; use timestamptz for absolute instants and an explicitly configured IANA timezone (for example, Asia/Kolkata only after client approval) for local scheduling.

| Table | Important fields | Notes |
| --- | --- | --- |
| admin_profiles | user_id (auth FK), role, created_at | Role/authorization metadata; no public signup. |
| services | id, slug, name, summary, description, image_path, duration_minutes, buffer_minutes, active, sort_order, created_at, updated_at | Only active services can be booked; preserve booked snapshots if a service changes later. |
| weekly_availability | id, weekday, is_open, start_time, end_time, effective_from, effective_until | Allow multiple intervals per weekday if required; unique/effective-date policy must be defined. |
| availability_breaks | id, weekday or rule_id, start_time, end_time | Optional breaks inside working hours. |
| date_overrides | id, local_date, mode, custom intervals, private_note, created_by, updated_at | Unique override per date or a well-defined multi-interval structure. |
| appointments | id, public_appointment_id, lookup_token_hash, name, normalized_phone, email, preferred_contact, local_date, starts_at, ends_at, timezone, status, message, created_at, updated_at | Never expose internal DB UUID or private token hash unnecessarily. |
| appointment_services | appointment_id, service_id, service_name_snapshot, duration_snapshot, buffer_snapshot, position | One appointment can contain many services; snapshots preserve what was booked. |
| appointment_events | id, appointment_id, actor_user_id, event_type, from_status, to_status, private_note, created_at | Audit trail; private notes admin-only. |
| notification_jobs/logs | id, appointment_id, channel, event_type, status, provider_ref, attempts, last_error, created_at | Optional; never store secrets or excessive personal data in logs. |
| site_settings | key, public_value, updated_by, updated_at | Keep secrets out of this table; separate public settings from server secrets. |

### 9.1 Data integrity and indexes

- Unique index on public_appointment_id; IDs should be unguessable and not derived from sequential database IDs.
- Indexes on appointments(local_date, starts_at), appointments(status, starts_at), normalized_phone, lowercased email where applicable, and appointment-service foreign keys.
- Foreign keys and check constraints for valid durations, valid intervals, and permitted status values.
- Use a transaction/locking or constraint strategy to prevent overlapping appointments when capacity is one.
- Enforce the daily identity rule transactionally, with a normalized identity and status set approved by the client.
- Never rely on a frontend query to enforce uniqueness or availability.
- Use migrations checked into source control; avoid production schema changes made only through the dashboard.
### 9.2 Data retention

The client must approve how long booking records, audit events, and notification logs are retained and how deletion/export requests are handled. Collect only information needed to manage the appointment. Avoid requesting sensitive medical, financial, or family information in the booking form.

## 10. API and Server Operations

| Operation | Access | Expected behavior |
| --- | --- | --- |
| GET /api/availability?month=YYYY-MM | Public, rate-limited | Return public day/slot availability only; no private booking details. |
| GET /api/services | Public | Return active, published service fields only. |
| POST /api/appointments | Public, rate-limited + bot checks | Validate fields, availability, daily rule, capacity, then create atomically and return public receipt data. |
| POST /api/appointments/lookup | Public, rate-limited | Start verification or validate a secure token; never enumerate bookings by raw contact alone. |
| GET /api/appointments/[publicRef] | Token/verification required | Return only the permitted appointment receipt fields. |
| GET /api/admin/appointments | Admin | Filter/search/paginate appointment records. |
| PATCH /api/admin/appointments/[id] | Admin | Validate allowed status transition and record audit event. |
| GET/PUT /api/admin/availability | Admin | Read/update recurring rules, date overrides, and capacity settings. |
| GET/POST/PATCH /api/admin/services | Admin | Manage service catalogue with validation. |

### 10.1 Error contract

- Use consistent error codes for validation, unavailable slot, duplicate daily booking, verification required, rate limit, unauthorized, and server error.
- Return field-level validation errors where safe; do not expose stack traces, SQL, secret values, or internal identifiers.
- If the slot becomes unavailable between selection and submission, explain that availability changed and ask the user to choose another slot.
- If notification delivery fails after booking creation, keep the appointment saved and show the booking ID; retry/log notification separately.
## 11. Security, Privacy and Abuse Prevention

- Enable RLS on all tables exposed through Supabase APIs; default deny and grant only required access.
- Keep Supabase service-role keys, email API keys, and signing secrets server-only. Never prefix secrets with NEXT_PUBLIC_.
- Enforce admin role checks on server routes and mutations, not only in UI middleware/navigation.
- Use secure session cookies via supported Supabase SSR patterns; protect state-changing requests and validate origins as appropriate.
- Validate and normalize all inputs on the server; enforce length limits and escape rendered user content.
- Rate-limit booking, lookup, OTP/resend, and contact endpoints; use CAPTCHA/bot protection where abuse risk warrants it.
- Use generic lookup errors and expiring, one-time verification tokens; store token hashes rather than raw tokens.
- Minimize personal data in URLs, analytics, logs, exports, and error messages.
- Use HTTPS in production, secure headers, dependency updates, backups, and documented restore procedures.
- Restrict admin access, provision accounts manually, and provide a way to revoke access.
- Do not send user messages or private admin notes to third-party AI or analytics services.
### 11.1 Privacy notice

Before launch, provide a privacy notice explaining the information collected, purposes, retention, service providers, and contact route for privacy requests. Legal obligations depend on the operator, users, and jurisdiction; the client should review the final notice and compliance requirements.

### 11.2 Threat cases to test

- Public visitor attempts to query appointment rows directly through Supabase.
- Visitor changes appointment ID/token to access another record.
- Repeated lookup attempts enumerate phone numbers or booking references.
- Two requests attempt to book the same slot simultaneously.
- Visitor submits a past date, inactive service, manipulated duration, or blocked time.
- Unauthenticated user invokes admin APIs directly.
- Admin changes availability after a visitor has opened the booking form.
- HTML/script payload is entered into name/message fields.
- Email provider fails or rate limits notification delivery.
## 12. Notifications, WhatsApp and Exports

### 12.1 Email

- Optional provider: Resend or an approved SMTP service; configure verified sending domain and DNS.
- Booking submission acknowledgement must say request received and display the status accurately.
- Admin confirmation/decline/cancellation/reschedule notifications are sent after the database update succeeds.
- Use templates with brand styling, appointment ID, date/time/timezone, service names, status, and secure manage/view link where applicable.
- Email failure must not roll back an already-created appointment; log and retry safely.
- Avoid placing unnecessary sensitive details in email subject lines or unsecured links.
### 12.2 WhatsApp and phone

- Click-to-chat uses a verified international-format phone number and URL-encoded prefilled message.
- Opening WhatsApp does not mean the message was sent; the visitor must send it in WhatsApp.
- Use tel: links for calls and mailto: links for email composition.
- Automated WhatsApp notifications require a separate approved WhatsApp Business API/provider, templates, consent and possible charges; not included by default.
### 12.3 PDF/image/print export

- Use a dedicated receipt component with print CSS and predictable dimensions.
- PDF should be generated from the approved receipt layout and support common mobile/desktop viewers.
- PNG/JPEG export should wait for fonts/images to load and be tested for logo fidelity, clipping, and script rendering.
- Provide fallback Print if browser export fails.
- Do not place verification secrets or admin-only notes on receipt exports.
## 13. SEO, Performance and Reliability

### 13.1 SEO

- Unique page titles, meta descriptions, canonical URLs, clean slugs, sitemap.xml, robots.txt, and appropriate indexing settings.
- Open Graph/social metadata and favicon using approved logo asset.
- Use semantic HTML and descriptive headings; add structured data only where accurate and appropriate.
- Do not publish unverified address, opening hours, credentials, reviews, or service claims.
- Noindex private appointment lookup/receipt pages and all admin pages; prevent sensitive content from entering search indexes.
### 13.2 Performance

- Optimize supplied images and serve responsive modern formats where supported.
- Avoid unnecessary client-side JavaScript on informational pages; keep calendar interactivity scoped to booking components.
- Use loading states and pagination for admin records.
- Measure Core Web Vitals after deployment; proposed target: good LCP/INP/CLS under real-world conditions, without guaranteeing a score before measurement.
- Lazy-load below-the-fold imagery and avoid heavy decorative video/animation.
### 13.3 Reliability and backup

- Use managed database backups appropriate to the selected Supabase plan and document restoration limitations.
- Keep migrations, seed data, and deployment instructions in version control.
- Log booking transaction failures and notification delivery outcomes without exposing personal data.
- Document a rollback plan for application deployment and a recovery plan for accidental data changes.
## 14. Testing and Acceptance Criteria

### 14.1 Functional acceptance

- Visitor can browse all approved pages and only active services appear as bookable.
- Visitor can select one or multiple services and see the correct summary/duration.
- Past dates are not selectable; today's elapsed slots are unavailable.
- Recurring closed days appear unavailable across future months.
- A date-specific closure overrides the recurring schedule; approved reopen/custom-hours behavior works as configured.
- Only available time slots are displayed; unavailable/full slots cannot be booked.
- Booking request validates all data on the server and returns a unique appointment ID.
- Daily booking rule works for normalized contact identity and approved statuses.
- Concurrent attempts cannot exceed slot/day capacity.
- Receipt displays correct status and can be printed/downloaded as PDF and image.
- Appointment lookup requires approved verification and reveals only authorized details.
- Admin can search/filter/view appointments and perform allowed status transitions.
- Admin can edit weekly availability, close a single date, reopen a date if permitted, and manage services.
- WhatsApp, call, and email links use approved contact details and correct URL encoding.
- Email failure does not lose a saved appointment.
### 14.2 Security acceptance

- No public endpoint returns the full appointments table.
- RLS and server authorization prevent unauthenticated admin reads/writes.
- Lookup endpoints resist brute force and enumeration through rate limits, generic responses, and verification.
- No secret is included in client bundles or public environment variables.
- Booking constraints are enforced server-side and transactionally.
- Private admin notes and logs are not exposed to visitors.
### 14.3 Responsive and accessibility QA

- Test current major browsers on iOS Safari, Android Chrome, and desktop Chrome/Firefox/Safari where available.
- Test narrow viewport, long service names, large text, keyboard-only interaction, and screen-reader labels.
- Verify calendar states are distinguishable without color and that touch targets are comfortable.
- Verify print/PDF/image output on mobile and desktop, including non-Latin scripts if enabled.
### 14.4 Test levels

| Level | Coverage |
| --- | --- |
| Unit | Date rules, timezone boundaries, slot generation, duration calculation, validation, status transition rules. |
| Integration | Database transaction, duplicate prevention, RLS, admin mutations, verification and notification queue/logging. |
| End-to-end | Complete visitor booking, admin confirmation, lookup, export, closure, and cancellation/reschedule flows. |
| Manual QA | Visual parity, mobile usability, print/export rendering, contact link behavior, and content approval. |

## 15. Deployment and Operations

### 15.1 Environments

| Environment | Rules |
| --- | --- |
| Local | Local Next.js development; Supabase local or isolated development project; fake/test notification provider. |
| Preview/staging | Separate non-production Supabase project or isolated schema; test data only; preview secrets restricted. |
| Production | Production Supabase project, verified domain, HTTPS, real provider keys only after client approval, backups and monitoring configured. |

### 15.2 Environment variables (examples)

Names should be finalized in implementation. Public URL/anon key are not secrets by themselves but must still be paired with correct RLS. Service role and provider keys must remain server-only.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server only
RESEND_API_KEY=                  # optional, server only
APPOINTMENT_LOOKUP_SECRET=       # server only
NEXT_PUBLIC_SITE_URL=
CONSULTATION_TIMEZONE=           # client-approved IANA timezone
```

### 15.3 Launch checklist

- Client approves content, service descriptions, logo usage, translations, contact details, address and hours.
- Client approves timezone, appointment duration, weekly hours, Sunday policy, booking horizon, advance notice, daily identity rule, cancellation policy and confirmation workflow.
- Production database migrations and RLS policies reviewed; admin account provisioned securely.
- Email domain/provider verified if email notifications are enabled; test delivery and failure handling.
- Domain ownership, HTTPS, redirects, sitemap, robots, favicon and metadata checked.
- Backups and restore procedure documented; admin handover guide delivered.
- End-to-end booking, admin actions, lookup verification, concurrency, export and responsive tests pass.
- Client signs off on final scope, pricing, support, warranty and ownership terms.
## 16. Delivery Phases and Deliverables

| Phase | Work | Exit criteria |
| --- | --- | --- |
| 1. Discovery & approvals | Confirm policies, approved content, contacts, timezone, integrations, scope. | Open decisions recorded and signed off. |
| 2. Foundation | Next.js setup, design tokens, Supabase project, migrations, admin auth, RLS. | Build passes; access boundaries tested. |
| 3. Public site | Home/About/Services/Details/Contact, responsive navigation, brand styling. | Approved visual/content review passes. |
| 4. Scheduling engine | Recurring rules, date overrides, slot generation, multi-service durations, transactional booking. | Calendar and concurrency tests pass. |
| 5. Booking receipt & lookup | Public reference, verification flow, print/PDF/image export. | Privacy and export acceptance tests pass. |
| 6. Admin dashboard | Appointments, statuses, service CRUD, calendar/availability, settings. | Admin end-to-end tests pass. |
| 7. Notifications & QA | Email integration if approved, contact links, regression, accessibility, security and mobile QA. | All critical/high defects resolved or accepted in writing. |
| 8. Deployment & handover | Production deployment, backups, documentation, credentials/access handover. | Client accepts launch checklist and deliverables. |

### 16.1 Handover deliverables

- Production website and agreed public pages.
- Admin dashboard and credentials delivered through a secure channel.
- Database schema/migrations and deployment configuration in the agreed repository.
- Brief admin guide for appointments, service editing, recurring closures and date overrides.
- Test summary and known limitations.
- Documented domain/hosting/provider ownership, recurring charges, backup/restore notes, warranty and support terms.
## 17. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Ambiguous identity for one-booking-per-day rule | Use normalized phone as agreed identity; explain limits when different contact details are used; consider verification. |
| Race condition/double-booking | Transactional server-side booking, database constraints/locking, concurrency tests. |
| Admin closes a day with existing bookings | Warn, require explicit resolution, retain audit trail, never silently cancel. |
| Lookup exposes personal data | OTP or secure token, expiry, rate limits, generic errors, no direct table access. |
| Email delivery failure | Save booking first, separate notification retry/logging, show receipt ID regardless. |
| Unapproved or inaccurate religious/profile content | Client approval required before publication; avoid fabricated credentials/results. |
| Third-party integration cost/availability | List recurring and per-message charges separately; obtain approval before enabling. |
| Timezone or daylight/date boundary bug | Explicit IANA timezone, canonical server logic, boundary tests, clear timezone display. |
| Export rendering differs by device | Use dedicated print layout and cross-device PDF/image tests; retain browser print fallback. |

## 18. Decisions Required Before Implementation

The core stack and high-level product scope are agreed in principle. The following policies were discussed but remain proposed defaults until the client confirms them.

| Decision | Recommended default | Status |
| --- | --- | --- |
| Appointment duration | Per-service duration; sum selected services plus configured buffers. | Confirm |
| Minimum advance notice | 24 hours, or another client-selected value. | Confirm |
| Booking horizon | 60 days ahead. | Confirm |
| Capacity | One appointment at a time. | Confirm |
| Confirmation | Manual admin confirmation; submitted request remains pending. | Confirm |
| Daily identity rule | One active booking per normalized phone per local date. | Confirm |
| Sunday | Recurring closed day initially, editable by admin. | Confirm |
| Date override | Specific-date rule can reopen recurring closed weekday if explicitly set. | Confirm |
| Cancelled/declined booking | Does not count against daily limit; pending/confirmed do. | Confirm |
| Lookup security | Appointment ID plus OTP or secure one-time link. | Select provider/method |
| Timezone | Client-approved IANA timezone; do not assume solely from hosting location. | Confirm |
| Email | Resend or approved provider; enabled only after credentials/domain setup. | Confirm |
| WhatsApp automation | Click-to-chat only in initial release; Business API excluded. | Confirm |
| Languages | English plus Urdu/Hindi only if approved translations are supplied. | Confirm |
| Public profile/content | All details supplied and approved by client. | Client dependency |
| Domain, support, warranty | Set in written quotation and agreement. | Commercial approval |

## 19. Definition of Done

- All agreed pages and booking/admin flows are implemented and responsive.
- The database and API enforce availability, identity, status, and access rules server-side.
- Recurring weekly closure and date-specific exceptions are reflected consistently in public and admin calendars.
- No critical/high security or booking integrity issue remains open without written acceptance.
- Client-approved content, contact details, timezone, policies, and integrations are configured.
- Automated tests and agreed manual QA pass; deployment and rollback steps are documented.
- Admin guide, access handover, backup/restore information, third-party charges, and support terms are provided.
- Client reviews and approves the production release.
## Appendix A — Requirement Traceability

| Requirement source | PRD coverage |
| --- | --- |
| Supplied visual references | Section 7: palette, premium Islamic styling, mobile-first layouts, service cards, consultation/contact actions. |
| Client core requirements | Sections 2–6: services, public pages, no visitor account, admin appointment records, contact links. |
| Appointment calendar discussion | Section 5: past-date restriction, recurring weekly closures, date overrides, slots, capacity and concurrency. |
| Website Development Order Letter | Sections 4, 6, 11, 13, 14, 15 and 16: approved content, status clarity, privacy, security, SEO, testing, notifications, handover and charges. |

## Appendix B — Important Implementation Notes

- This PRD is a technical planning baseline, not a signed commercial agreement.
- Do not hard-code Sunday as closed; model it as editable recurring availability data.
- Do not rely on frontend calendar state for booking integrity.
- Do not expose appointment data based only on a phone number/email or predictable appointment ID.
- Do not treat opening WhatsApp/email/calling UI as proof that a message/call was completed.
- Do not mark a booking confirmed until the configured confirmation event has succeeded.
- Do not publish unverified contact details, address, biography, qualifications, testimonials, or religious content.
---

*Confidential project planning document · Version 1.0 · 20 October 2026*
