/**
 * Verified, client-independent site facts only. Biography, services, contact details, hours and
 * translations are NOT here until the client approves them (docs/requirements/CONTENT_CHECKLIST.md).
 * Approved contact details will be read from the `site_settings` table, not hard-coded.
 */
export const siteConfig = {
  name: "AZIZURRAHMAN",
  /** Neutral description supported by the client's order letter ("official website"). */
  description: "Official website of AZIZURRAHMAN.",
  locale: "en",
  logo: {
    src: "/brand/azizurrahman-logo-640.png",
    width: 640,
    height: 640,
    alt: "AZIZURRAHMAN logo",
  },
  /** Pre-launch: keep the site out of search indexes until content is approved (Phase 13). */
  indexable: false,
} as const;
