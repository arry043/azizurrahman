export const LOCALES = ["en", "ur"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE_NAME = "azr_locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ur" ? "rtl" : "ltr";
}

export interface LocaleMeta {
  code: Locale;
  label: string;
  nativeLabel: string;
  direction: "ltr" | "rtl";
}

export const LOCALES_META: Record<Locale, LocaleMeta> = {
  en: {
    code: "en",
    label: "English",
    nativeLabel: "English",
    direction: "ltr",
  },
  ur: {
    code: "ur",
    label: "Urdu",
    nativeLabel: "اردو",
    direction: "rtl",
  },
};

/**
 * Replaces `{placeholder}` tokens in a localized string.
 * Safe for use in both Server and Client environments.
 */
export function interpolate(
  template: string,
  params: Record<string, string | number | undefined | null>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const val = params[key];
    return val !== undefined && val !== null ? String(val) : match;
  });
}
