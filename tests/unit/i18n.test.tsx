import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

import { DEFAULT_LOCALE, getDirection, interpolate, isLocale, LOCALES } from "@/i18n/config";
import { getServerTranslations } from "@/i18n/server";
import { en } from "@/i18n/translations/en";
import { ur } from "@/i18n/translations/ur";
import { getLocalizedService, KNOWN_SERVICES_URDU } from "@/i18n/services-dictionary";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { LocaleProvider } from "@/i18n/client";

// Recursively collects all dot-notated paths from an object
function getObjectPaths(obj: Record<string, unknown>, prefix = ""): string[] {
  let paths: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      paths = paths.concat(getObjectPaths(value as Record<string, unknown>, fullPath));
    } else {
      paths.push(fullPath);
    }
  }
  return paths;
}

// Retrieves value at dot-notated path
function getValueAtPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let curr: unknown = obj;
  for (const part of parts) {
    if (curr && typeof curr === "object" && part in curr) {
      curr = (curr as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return curr;
}

// Extracts {placeholder} tokens from a string
function extractTokens(str: string): string[] {
  const matches = str.match(/\{(\w+)\}/g) || [];
  return matches.map((m) => m.slice(1, -1)).sort();
}

describe("Internationalization (i18n) & Urdu Localization Engine", () => {
  describe("Locale Configuration & Detection", () => {
    it("defines exactly English and Urdu as supported locales", () => {
      expect(LOCALES).toEqual(["en", "ur"]);
      expect(DEFAULT_LOCALE).toBe("en");
    });

    it("identifies valid locales and rejects invalid ones", () => {
      expect(isLocale("en")).toBe(true);
      expect(isLocale("ur")).toBe(true);
      expect(isLocale("fr")).toBe(false);
      expect(isLocale("ar")).toBe(false);
      expect(isLocale(null)).toBe(false);
      expect(isLocale(undefined)).toBe(false);
      expect(isLocale(123)).toBe(false);
    });

    it("determines correct text direction per locale", () => {
      expect(getDirection("en")).toBe("ltr");
      expect(getDirection("ur")).toBe("rtl");
    });
  });

  describe("Dictionary Key Parity & Completeness", () => {
    const enPaths = getObjectPaths(en as unknown as Record<string, unknown>);
    const urPaths = getObjectPaths(ur as unknown as Record<string, unknown>);

    it("has 100% key parity between English and Urdu dictionaries", () => {
      expect(urPaths.sort()).toEqual(enPaths.sort());
    });

    it("ensures no undefined, null, or empty string values in Urdu dictionary", () => {
      for (const path of urPaths) {
        const val = getValueAtPath(ur as unknown as Record<string, unknown>, path);
        expect(val, `Path ${path} in ur.ts should not be undefined/null`).toBeDefined();
        if (typeof val === "string") {
          expect(val.trim().length, `Path ${path} in ur.ts should not be empty`).toBeGreaterThan(0);
        }
      }
    });

    it("ensures Urdu values contain Urdu/Arabic Unicode characters", () => {
      const urduCharRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
      let urduStringCount = 0;

      for (const path of urPaths) {
        const val = getValueAtPath(ur as unknown as Record<string, unknown>, path);
        if (typeof val === "string") {
          // Skip numeric or technical keys if any
          if (urduCharRegex.test(val)) {
            urduStringCount++;
          }
        }
      }

      // Vast majority of dictionary entries must contain authentic Urdu characters
      expect(urduStringCount).toBeGreaterThan(150);
    });

    it("preserves identical interpolation placeholders across English and Urdu", () => {
      for (const path of enPaths) {
        const enVal = getValueAtPath(en as unknown as Record<string, unknown>, path);
        const urVal = getValueAtPath(ur as unknown as Record<string, unknown>, path);

        if (typeof enVal === "string" && typeof urVal === "string") {
          const enTokens = extractTokens(enVal);
          const urTokens = extractTokens(urVal);
          expect(
            urTokens,
            `Interpolation tokens in ur.ts for path "${path}" must match en.ts (${enTokens.join(",")})`,
          ).toEqual(enTokens);
        }
      }
    });
  });

  describe("Interpolation Utility", () => {
    it("interpolates named tokens correctly", () => {
      const template = "Welcome to {siteName}, {name}!";
      const result = interpolate(template, { siteName: "AZIZURRAHMAN", name: "Muhammad" });
      expect(result).toBe("Welcome to AZIZURRAHMAN, Muhammad!");
    });

    it("leaves unmatched placeholders intact when params are omitted", () => {
      const template = "Hello {name}, your code is {code}.";
      const result = interpolate(template, { name: "Ahmad" });
      expect(result).toBe("Hello Ahmad, your code is {code}.");
    });
  });

  describe("Service Presentation Overlay", () => {
    const mockService = {
      id: "srv-1",
      slug: "dua-and-supplication",
      name: "Dua & Supplication",
      short_description: "English short desc",
      description: "English full desc",
      image_url: null,
      duration_minutes: 30,
      is_active: true,
      display_order: 1,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    it("returns localized Urdu title and description when locale is 'ur'", () => {
      const localized = getLocalizedService(mockService, "ur");
      expect(localized.name).toBe(KNOWN_SERVICES_URDU["dua-and-supplication"]!.name);
      expect(localized.short_description).toBe(
        KNOWN_SERVICES_URDU["dua-and-supplication"]!.short_description,
      );
    });

    it("returns original English title and description when locale is 'en'", () => {
      const localized = getLocalizedService(mockService, "en");
      expect(localized.name).toBe(mockService.name);
      expect(localized.short_description).toBe(mockService.short_description);
    });

    it("safely falls back to database values for unknown slugs", () => {
      const unknownService = { ...mockService, slug: "custom-untranslated-service" };
      const localized = getLocalizedService(unknownService, "ur");
      expect(localized.name).toBe(mockService.name);
    });
  });

  describe("Server Translation Resolution", () => {
    it("returns default English translations outside request scope", async () => {
      const { locale, dir, t } = await getServerTranslations();
      expect(locale).toBe("en");
      expect(dir).toBe("ltr");
      expect(t.common.siteName).toBe("AZIZURRAHMAN");
    });

    it("returns Urdu translations when overrideLocale is 'ur'", async () => {
      const { locale, dir, t } = await getServerTranslations("ur");
      expect(locale).toBe("ur");
      expect(dir).toBe("rtl");
      expect(t.navigation.home).toBe("صفحۂ اول");
    });
  });

  describe("Language Switcher Component", () => {
    it("renders 'اردو' label and accessible switch message in English mode", () => {
      const html = renderToStaticMarkup(
        <LocaleProvider initialLocale="en">
          <LanguageSwitcher />
        </LocaleProvider>,
      );

      expect(html).toContain("اردو");
      expect(html).toContain('aria-label="Switch language to Urdu"');
      expect(html).toContain('lang="ur"');
    });

    it("renders 'English' label and accessible switch message in Urdu mode", () => {
      const html = renderToStaticMarkup(
        <LocaleProvider initialLocale="ur">
          <LanguageSwitcher />
        </LocaleProvider>,
      );

      expect(html).toContain("English");
      expect(html).toContain('aria-label="زبان انگریزی میں تبدیل کریں"');
      expect(html).toContain('lang="en"');
    });
  });
});
