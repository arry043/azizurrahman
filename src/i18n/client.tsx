"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  DEFAULT_LOCALE,
  getDirection,
  interpolate,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  type Locale,
} from "./config";
import { en, type TranslationSchema } from "./translations/en";
import { ur } from "./translations/ur";

export interface LocaleContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: TranslationSchema;
  setLocale: (newLocale: Locale) => void;
  toggleLocale: () => void;
  interpolate: (
    template: string,
    params: Record<string, string | number | undefined | null>,
  ) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export interface LocaleProviderProps {
  initialLocale: Locale;
  children: ReactNode;
}

export function LocaleProvider({ initialLocale = DEFAULT_LOCALE, children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
  } catch {
    router = null;
  }

  const dir = useMemo(() => getDirection(locale), [locale]);
  const t = useMemo(() => (locale === "ur" ? ur : en), [locale]);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      setLocaleState(newLocale);

      if (typeof document !== "undefined") {
        document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
        document.documentElement.lang = newLocale;
        document.documentElement.dir = getDirection(newLocale);
      }

      // Background refresh of server-rendered components to match new cookie
      if (router) {
        router.refresh();
      }
    },
    [router],
  );

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en" ? "ur" : "en");
  }, [locale, setLocale]);

  // Keep DOM in sync if initialLocale changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = dir;
    }
  }, [locale, dir]);

  const value = useMemo(
    () => ({
      locale,
      dir,
      t,
      setLocale,
      toggleLocale,
      interpolate,
    }),
    [locale, dir, t, setLocale, toggleLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    // Graceful fallback for components tested or rendered outside provider
    return {
      locale: DEFAULT_LOCALE,
      dir: "ltr",
      t: en,
      setLocale: () => {},
      toggleLocale: () => {},
      interpolate,
    };
  }
  return context;
}

export function useTranslations() {
  const { t, locale, dir, interpolate } = useLocale();
  return { t, locale, dir, interpolate };
}
