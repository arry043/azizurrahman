# External Integrations & Credentials

> **Status:** 2026-10-20. No production credentials exist in this repository and none should ever be committed. `.env.example` lists variable names only.

## Summary

| Integration                     | Purpose                                     | Phase                      | Status                                | Credential owner                            |
| ------------------------------- | ------------------------------------------- | -------------------------- | ------------------------------------- | ------------------------------------------- |
| Vercel (or other Next.js host)  | Hosting, preview deployments, HTTPS         | 15 (preview earlier)       | Not configured                        | Client (account) / developer (access) — Q18 |
| Supabase                        | PostgreSQL, Auth for admins                 | 2 (local), 15 (production) | Local dev working; no remote projects | Client organisation — Q18                   |
| Supabase Auth                   | Admin sign-in only                          | 8                          | Local config: public sign-up disabled | Same as Supabase                            |
| Email (Resend or approved SMTP) | Booking acknowledgement / status emails     | 12                         | Pending decision (Q17)                | Client                                      |
| WhatsApp click-to-chat          | Visitor opens WhatsApp with pre-filled text | 4 / 12                     | Needs verified number (Q4)            | No credential                               |
| Phone / email links             | `tel:` / `mailto:`                          | 4                          | Needs verified details (Q4)           | No credential                               |
| Domain / DNS                    | Production domain, email DNS records        | 15                         | Pending (Q18)                         | Client                                      |
| OTP / lookup provider           | Secure appointment lookup                   | 7                          | Method pending (Q16)                  | Client if paid                              |

## Next.js hosting

- The app is a standard Next.js App Router project (Node.js ≥ 22). It is Vercel-compatible and needs no custom server.
- Each environment (local, preview, production) needs its own environment variables. Preview deployments must point to a **non-production** Supabase project.
- Production secrets are set in the host's encrypted environment settings and never in the repository or CI logs.

## Supabase project requirements

- Two projects, or one project per environment: **development/staging** and **production**.
- Region close to the client's users (e.g. Mumbai `ap-south-1` if the audience is in India — confirm with Q7/Q18).
- Settings to apply in each remote project's dashboard (they are **not** pushed by migrations):
  - Authentication → Sign In / Providers: **disable "Allow new users to sign up"**.
  - Disable anonymous sign-ins.
  - Minimum password length ≥ 12; enable leaked-password protection where the plan allows.
  - Data API → exposed schemas: `public` (and `graphql_public` only if used). **Do not expose `private`.**
  - Enable point-in-time recovery or confirm the backup schedule for the chosen plan.
- Keys:
  - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the anon _or_ publishable key) are public by design. Safety comes from RLS.
  - `SUPABASE_SERVICE_ROLE_KEY` (the service-role _or_ secret key) **bypasses RLS**. It is server-only and used only in `src/lib/supabase/service-role.ts`.

## Supabase Auth for administrators

- No public registration anywhere (local `supabase/config.toml` sets `enable_signup = false`).
- Provisioning process (Phase 8): create the user in the Supabase dashboard (Authentication → Users → Add user, or invite), then insert an `admin_profiles` row using the SQL editor or service role. See [RLS_POLICIES.md](../database/RLS_POLICIES.md#provisioning-and-revoking-admins).
- Revocation: set `admin_profiles.is_active = false` (immediate) and/or delete or ban the auth user.

## Email notifications (deferred — Phase 12)

| Option                                      | Pros                                        | Cons                                  |
| ------------------------------------------- | ------------------------------------------- | ------------------------------------- |
| Resend                                      | Simple API, good Next.js support, free tier | Needs a verified sending domain (DNS) |
| Approved SMTP (e.g. Google Workspace, Zoho) | Uses an existing mailbox                    | Sending limits; credential handling   |
| Supabase Auth emails                        | Already used for admin auth                 | Not for transactional booking emails  |

Requirements: send only after the database commit succeeds. Log outcomes without personal data beyond what is necessary. Never roll back a booking on email failure. `RESEND_API_KEY` is server-only and optional until enabled.

Future schema (not created yet, to avoid unused tables): `notification_logs(id, appointment_id → appointments ON DELETE CASCADE, channel, template, status, provider_message_id, attempt_count, last_error_code, created_at, sent_at)`, admin-read only, written by server code.

## WhatsApp click-to-chat

- URL format: `https://wa.me/<digits of E.164 number without +>?text=<encodeURIComponent(message)>`.
- Opening WhatsApp **does not** send a message. The visitor must press send. UI copy must not imply that a booking was made.
- Automated WhatsApp messages (Business API) are out of scope unless separately approved and costed.

## Phone and email links

- `tel:+<E.164>` and `mailto:<address>`. Values come from `site_settings` once the client verifies them.

## Domain / DNS prerequisites (Phase 15)

- Domain purchased in the client's name; registrar access available.
- DNS records: host (A/CNAME for Vercel), email provider SPF/DKIM/DMARC if email is enabled.
- `NEXT_PUBLIC_SITE_URL` set to the canonical production URL. Supabase Auth `site_url` and redirect URLs updated to match.

## Environment variables

| Variable                        | Scope                | Required when                                                              | Phase |
| ------------------------------- | -------------------- | -------------------------------------------------------------------------- | ----- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Public               | Any page or route that talks to Supabase                                   | 2+    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (RLS-limited) | Same as above                                                              | 2+    |
| `SUPABASE_SERVICE_ROLE_KEY`     | **Server only**      | Trusted server operations (booking RPC caller, admin provisioning scripts) | 6+    |
| `NEXT_PUBLIC_SITE_URL`          | Public               | Metadata, absolute links (defaults to `http://localhost:3000`)             | 1     |
| `CONSULTATION_TIMEZONE`         | Server               | Availability and booking                                                   | 5+    |
| `RESEND_API_KEY`                | **Server only**      | Email notifications enabled                                                | 12    |
| `APPOINTMENT_LOOKUP_SECRET`     | **Server only**      | Secure lookup implemented                                                  | 7     |

The base app builds and runs with none of these set. Each variable is validated when the code that needs it first runs (see `src/lib/env/`).
