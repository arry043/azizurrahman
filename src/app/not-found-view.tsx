"use client";

import { BrandMark } from "@/components/layout/brand-mark";
import { LinkButton } from "@/components/ui/link-button";
import { Ornament } from "@/components/ui/ornament";
import { useTranslations } from "@/i18n/client";

export function NotFoundView() {
  const { t } = useTranslations();

  return (
    <main
      id="main-content"
      className="container-page flex flex-1 flex-col items-center justify-center gap-6 py-20 text-center sm:py-28"
    >
      <BrandMark />
      <Ornament className="mt-2" />
      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.2em] text-accent-strong uppercase">
          {t.errors.notFoundCode}
        </p>
        <h1 className="font-display text-4xl font-semibold text-primary sm:text-5xl">
          {t.errors.notFoundTitle}
        </h1>
        <p className="mx-auto max-w-md text-base leading-relaxed text-muted sm:text-lg">
          {t.errors.notFoundMessage}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        <LinkButton href="/" variant="primary" size="md">
          {t.common.returnHome}
        </LinkButton>
        <LinkButton href="/services" variant="secondary" size="md">
          {t.common.exploreServices}
        </LinkButton>
        <LinkButton href="/contact" variant="ghost" size="md">
          {t.common.contactUs}
        </LinkButton>
      </div>
    </main>
  );
}

