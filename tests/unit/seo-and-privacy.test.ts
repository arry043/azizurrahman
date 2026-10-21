import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import HomePage from "@/app/(public)/page";
import PrivacyPage from "@/app/(public)/privacy/page";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { scholarProfile } from "@/config/scholar-profile";
import { getSiteUrl } from "@/lib/env/public";
import * as publicServices from "@/lib/services/public-services";
import nextConfig from "../../next.config";

describe("Phase 13: SEO, Accessibility, Performance & Privacy", () => {
  const origin = getSiteUrl().origin;

  describe("Sitemap Generation (sitemap.ts)", () => {
    it("generates public routes and dynamic services without private paths", async () => {
      vi.spyOn(publicServices, "getActiveServices").mockResolvedValueOnce([
        {
          id: "00000000-0000-4000-8000-000000000101",
          slug: "dua-and-supplication",
          name: "Dua & Supplication",
          short_description: "Focused prayer guidance.",
          description: "Detailed description.",
          image_url: null,
          duration_minutes: 30,
        },
      ]);

      const entries = await sitemap();
      const urls = entries.map((e) => e.url);

      // Verify canonical public routes are included
      expect(urls).toContain(`${origin}`);
      expect(urls).toContain(`${origin}/about`);
      expect(urls).toContain(`${origin}/services`);
      expect(urls).toContain(`${origin}/services/dua-and-supplication`);
      expect(urls).toContain(`${origin}/book`);
      expect(urls).toContain(`${origin}/contact`);
      expect(urls).toContain(`${origin}/privacy`);

      // Verify private paths are NEVER included
      for (const url of urls) {
        expect(url).not.toContain("/admin");
        expect(url).not.toContain("/appointments/");
        expect(url).not.toContain("/api/");
      }
    });
  });

  describe("Robots Configuration (robots.ts)", () => {
    it("configures disallow rules for admin, api, and private appointments", () => {
      const robotsConfig = robots();

      expect(robotsConfig.sitemap).toBe(`${origin}/sitemap.xml`);

      const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules : [robotsConfig.rules];

      const userAgentStar = rules.find((r) => r.userAgent === "*");
      expect(userAgentStar).toBeDefined();

      const disallow = Array.isArray(userAgentStar?.disallow)
        ? userAgentStar?.disallow
        : [userAgentStar?.disallow];

      expect(disallow).toContain("/admin/");
      expect(disallow).toContain("/appointments/");
      expect(disallow).toContain("/api/");
    });
  });

  describe("Security Headers (next.config.ts)", () => {
    it("provides complete security headers including CSP, HSTS, and frame protection", async () => {
      expect(nextConfig.headers).toBeDefined();
      const headerConfigs = await nextConfig.headers!();
      expect(headerConfigs.length).toBeGreaterThan(0);

      const catchAll = headerConfigs.find((h) => h.source === "/(.*)");
      expect(catchAll).toBeDefined();

      const headers = catchAll!.headers;
      const headerMap = Object.fromEntries(headers.map((h) => [h.key, h.value]));

      expect(headerMap["X-Frame-Options"]).toBe("DENY");
      expect(headerMap["X-Content-Type-Options"]).toBe("nosniff");
      expect(headerMap["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
      expect(headerMap["Strict-Transport-Security"]).toContain("max-age=63072000");
      expect(headerMap["Permissions-Policy"]).toContain("camera=()");
      expect(headerMap["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
      expect(headerMap["Content-Security-Policy"]).toContain("default-src 'self'");
    });
  });

  describe("Structured Data & Facts Preservation", () => {
    it("HomePage contains valid JSON-LD structured data matching scholarProfile facts", async () => {
      vi.spyOn(publicServices, "getActiveServices").mockResolvedValueOnce([]);
      vi.spyOn(publicServices, "getPublicSiteSettings").mockResolvedValueOnce({
        public_phone: "+919876543210",
        public_whatsapp: "+919876543210",
        public_email: "guidance@example.com",
        public_address: "Test Address",
        consultation_hours_text: "Monday to Saturday",
        whatsapp_message_template: "Hello",
        booking_horizon_days: 60,
        min_advance_notice_minutes: 1440,
      });

      const page = await HomePage();
      const html = renderToStaticMarkup(page);

      expect(html).toContain('type="application/ld+json"');

      // Extract JSON-LD script content
      const match = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
      expect(match).not.toBeNull();
      expect(match?.[1]).toBeDefined();

      const jsonLd = JSON.parse(match![1] as string);
      expect(jsonLd["@context"]).toBe("https://schema.org");
      expect(jsonLd["@graph"]).toBeDefined();

      const person = jsonLd["@graph"].find(
        (item: { "@type": string }) => item["@type"] === "Person",
      );
      expect(person).toBeDefined();
      expect(person.name).toBe(scholarProfile.identity.fullNameEn);
      expect(person.honorificPrefix).toBe(scholarProfile.identity.honorificEn);
    });
  });

  describe("Privacy Notice Page", () => {
    it("renders data minimisation, retention policy, and privacy guarantees", () => {
      const page = PrivacyPage();
      const html = renderToStaticMarkup(page);

      expect(html).toContain("Privacy Notice &amp; Trust Policy");
      expect(html).toContain("Our Core Principle of Confidentiality");
      expect(html).toContain("Row Level Security (RLS)");
      expect(html).toContain("Salted Verification Hashes");
      expect(html).toContain("Data Retention &amp; Deletion");
      expect(html).toContain("Contact Regarding Privacy");
    });
  });
});
