"use client";

import { useLocale } from "@/i18n/client";
import { cn } from "@/lib/utils";

export interface LanguageSwitcherProps {
  className?: string;
  variant?: "header" | "drawer";
}

export function LanguageSwitcher({ className, variant = "header" }: LanguageSwitcherProps) {
  const { locale, toggleLocale, t } = useLocale();
  const isEn = locale === "en";

  // When English is active, display "اردو" so Urdu speakers can identify their language.
  // When Urdu is active, display "English" so English speakers can switch back.
  const displayLabel = isEn ? t.languageSwitcher.labelUrdu : t.languageSwitcher.labelEnglish;
  const accessibleLabel = isEn
    ? t.languageSwitcher.switchToUrdu
    : t.languageSwitcher.switchToEnglish;

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={accessibleLabel}
      title={accessibleLabel}
      lang={isEn ? "ur" : "en"}
      dir={isEn ? "rtl" : "ltr"}
      className={cn(
        "inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-control border font-medium transition-colors",
        "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus",
        variant === "header"
          ? "border-accent/40 bg-white/5 px-3 py-1 text-xs text-ivory hover:border-accent hover:bg-white/10 hover:text-accent"
          : "min-h-11 w-full border-accent/30 bg-white/5 px-4 py-2 text-sm text-ivory hover:bg-white/10 hover:text-white",
        className,
      )}
    >
      {/* Globe / Translation icon */}
      <svg
        className="size-3.5 shrink-0 text-accent opacity-90"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.5-3 4-6.5 4-9s-1.5-6-4-9m0 18c-2.5-3-4-6.5-4-9s1.5-6 4-9m-8 9h16"
        />
      </svg>
      <span
        className={cn(
          "font-semibold tracking-wide",
          isEn ? "text-sm font-normal text-accent" : "text-xs font-semibold text-ivory",
        )}
      >
        {displayLabel}
      </span>
    </button>
  );
}
