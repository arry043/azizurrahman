import { cookies } from "next/headers";

import {
  DEFAULT_LOCALE,
  getDirection,
  interpolate,
  isLocale,
  LOCALE_COOKIE_NAME,
  type Locale,
} from "./config";
import { en } from "./translations/en";
import { ur } from "./translations/ur";

export { interpolate };

/**
 * Resolves active locale from request cookies on the server.
 * Returns default "en" if cookies are unavailable (e.g. static prerendering or unit tests).
 */
export async function getServerLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
    if (isLocale(cookieValue)) {
      return cookieValue;
    }
  } catch {
    // Outside request scope (e.g. unit test or static rendering)
  }

  return DEFAULT_LOCALE;
}

// Re-exported interpolate from ./config

/**
 * Returns typed translation dictionary and helpers for server components.
 */
export async function getServerTranslations(overrideLocale?: Locale) {
  const locale = overrideLocale ?? (await getServerLocale());
  const t = locale === "ur" ? ur : en;
  const dir = getDirection(locale);

  return {
    locale,
    dir,
    t,
    interpolate,
  };
}
