# AZIZURRAHMAN — Design System & Component Reference

> **Document:** Design System & Responsive UX Specification  
> **Status:** Phase 3 & Phase 4 Implementation Reference  
> **Updated:** 2026-10-20

---

## 1. Brand Palette & Color Tokens

The AZIZURRAHMAN visual identity balances Islamic heritage with modern, tranquil, and trustworthy aesthetics. All colors are defined in `src/app/globals.css` as semantic and brand tokens.

| Token              | Hex Value | Semantic Role                                                | WCAG 2.2 AA Contrast Compliance           |
| ------------------ | --------- | ------------------------------------------------------------ | ----------------------------------------- |
| `--azr-emerald`    | `#07553D` | Primary actions, active navigation, key headings             | 7.9:1 on Ivory, 8.8:1 on Cream            |
| `--azr-green`      | `#16804A` | Hover states, positive/success indicators                    | 4.8:1 on White                            |
| `--azr-forest`     | `#032F25` | Dark hero backgrounds, navigation drawers, contrast surfaces | 12.8:1 with Ivory, 6.2:1 with Gold        |
| `--azr-gold`       | `#C6A45A` | Restrained ornamental lines, geometric accents, badges       | Accent highlights & dark surface contrast |
| `--azr-gold-dark`  | `#9A742D` | Gold accents on light surfaces, accessible text accents      | 3.9:1 on Ivory (large text / icons)       |
| `--azr-ivory`      | `#FBF5E8` | Primary warm background surface                              | Base canvas                               |
| `--azr-cream`      | `#F2E8D2` | Secondary surfaces, card backgrounds, subtle panels          | Secondary canvas                          |
| `--azr-white`      | `#FFFFFF` | Forms, elevated cards, readable content areas                | Surface highlight                         |
| `--azr-text`       | `#23302A` | Primary body copy                                            | 11.2:1 on Ivory, 12.6:1 on White          |
| `--azr-text-muted` | `#6A706B` | Secondary metadata, captions, timestamps                     | 4.9:1 on Ivory, 5.5:1 on White            |
| `--azr-border`     | `#D9CFB9` | Card dividers, inputs, structural borders                    | Visual demarcation                        |
| `--azr-error`      | `#B42318` | Error messages, alert banners, invalid fields                | 5.8:1 on White, 5.2:1 on Ivory            |
| `--azr-warning`    | `#9A6700` | Warning and pending status indicators                        | 4.6:1 on White                            |

---

## 2. Typography System

- **Display & Headings:** `Cormorant Garamond` (Google Font via `next/font`), serif, weights 500, 600, 700.
  - Used for `h1`, `h2`, `h3`, page headers, and card titles.
  - Balanced line wrap (`text-wrap: balance`).
- **Body & Controls:** `Inter` (Google Font via `next/font`), sans-serif, weights 400, 500, 600.
  - Used for body paragraphs, buttons, form inputs, labels, and badges.
  - Pretty text wrap (`text-wrap: pretty`).

---

## 3. Responsive Breakpoints & Layout

| Viewport          | Screen Width        | Layout & Responsive Behavior                                                                                                                               |
| ----------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mobile**        | `< 640px`           | Single-column stacked layouts, compact header with BrandMark and "Book" button, accessible slide-over navigation drawer, touch targets $\ge 44\text{px}$.  |
| **Tablet**        | `640px – 1023px`    | Balanced 2-column grids for service cards, comfortable card padding, wider form controls.                                                                  |
| **Desktop**       | `1024px – 1439px`   | Horizontal header navigation with active indicators, 3-column service grid, two-column split layout for service details, sticky booking sidebar.           |
| **Large Desktop** | $\ge 1440\text{px}$ | Content constrained to `max-width: 72rem` (`container-page`) or `80rem` (`container-wide`) with centered whitespace to prevent uncomfortable line lengths. |

---

## 4. Reusable UI Components

### 4.1 Buttons & Navigation

- `Button` (`src/components/ui/button.tsx`): Supports `primary`, `secondary`, `outline`, `ghost`, `destructive` variants; `sm`, `md`, `lg` sizes; accessible loading spinner (`aria-busy="true"`), disabled state, and visible focus outline (`outline-focus`).
- `LinkButton` (`src/components/ui/link-button.tsx`): Integrates Next.js `<Link>` with `buttonStyles` and handles external URLs (`target="_blank"` with `rel="noopener noreferrer"`).
- `Breadcrumbs` (`src/components/layout/breadcrumbs.tsx`): Semantic `<nav aria-label="Breadcrumb">` with accessible chevrons, route hierarchy, and `aria-current="page"`.

### 4.2 Form Controls

- `Input` (`src/components/ui/input.tsx`): Text, tel, email inputs with associated label, helper hint, error message (`role="alert"`), `aria-invalid`, and icons.
- `Textarea` (`src/components/ui/textarea.tsx`): Textarea with label, error, hint, and character wrapping.
- `Select` (`src/components/ui/select.tsx`): Custom styled select element with options and accessible labels.
- `Checkbox` (`src/components/ui/checkbox.tsx`): Accessible custom checkbox with label and description.

### 4.3 Surface, Structure & Feedback

- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` (`src/components/ui/card.tsx`): Surface variants (`default`, `muted`, `elevated`, `interactive`).
- `Badge` (`src/components/ui/badge.tsx`): Status badges (`neutral`, `success`, `warning`, `error`, `gold`, `primary`).
- `Alert` (`src/components/ui/alert.tsx`): Semantic alert container (`role="alert"` for error/warning, `role="status"` for info/success).
- `Dialog` (`src/components/ui/dialog.tsx`): Accessible modal dialog with focus trapping, ESC key listener, backdrop close, and scroll locking.
- `Skeleton` (`src/components/ui/skeleton.tsx`): Animated loading skeleton with `aria-hidden="true"`.
- `EmptyState` (`src/components/ui/empty-state.tsx`): Empty state display with icon, title, description, and action button.
- `ErrorState` (`src/components/ui/error-state.tsx`): Error state display with retry button and home link.
- `SectionHeading` (`src/components/ui/section-heading.tsx`): Reusable section header with kicker, title, ornament, description, and inverse styling.
- `Ornament` (`src/components/ui/ornament.tsx`): Refined Islamic geometric divider with eight-point star.

### 4.4 Services & Contact Blocks

- `ServiceCard` (`src/components/services/service-card.tsx`): Card displaying active service, image or Islamic pattern fallback, duration badge, detail link, and booking CTA.
- `ServiceGrid` (`src/components/services/service-grid.tsx`): Responsive 1-col (mobile), 2-col (tablet), 3-col (desktop) grid.
- `ContactActions` (`src/components/contact/contact-actions.tsx`): WhatsApp link (`wa.me`), telephone (`tel:`), email (`mailto:`), with verified fallback.
- `ContactCTA` (`src/components/contact/contact-cta.tsx`): Dark forest banner with gold geometry and booking/contact actions.
- `InquiryForm` (`src/components/contact/inquiry-form.tsx`): Interactive client-side message drafter for WhatsApp and email.
- `LookupForm` (`src/components/lookup/lookup-form.tsx`): Accessible reference code lookup shell.

---

## 5. Public Website Pages (Phase 4)

1. **Home (`/`):** Hero section with brand emblem, Book Appointment and Explore Services CTAs, principles of guidance cards, featured services catalogue, about preview, consultation CTA.
2. **About (`/about`):** Breadcrumbs, profile card, mission of sincerity, official verification notice (Q2), consultation philosophy, booking CTAs.
3. **Services (`/services`):** Active service catalogue fetched via `getActiveServices()`, empty state fallback, booking CTA.
4. **Service Detail (`/services/[slug]`):** Dynamic slug route, active service lookup, 404 for invalid/inactive slugs, what to expect, sticky sidebar booking card.
5. **Book Appointment (`/book`):** 4-step booking workflow explanation, automated calendar engine development status notice (Phases 5 & 6), direct interim consultation scheduling, service list.
6. **Contact (`/contact`):** Verified contact channels (WhatsApp, phone, email), consultation hours and location cards, inquiry message preparer.
7. **Appointment Lookup (`/appointments/lookup`):** Reference code + contact info form shell, guest verification explanation, privacy guarantee.
8. **Feedback States:**
   - 404 (`/not-found.tsx`): Branded error page with return home and services links.
   - Error Boundary (`/error.tsx`): Branded error card with retry button.
   - Loading Skeleton (`/loading.tsx`): Branded layout skeleton.
