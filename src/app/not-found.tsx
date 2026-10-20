import type { Metadata } from "next";

import { BrandMark } from "@/components/layout/brand-mark";
import { LinkButton } from "@/components/ui/link-button";
import { Ornament } from "@/components/ui/ornament";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="container-page flex flex-1 flex-col items-center justify-center gap-6 py-20 text-center sm:py-28"
    >
      <BrandMark />
      <Ornament className="mt-2" />
      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.2em] text-accent-strong uppercase">
          Error 404
        </p>
        <h1 className="font-display text-4xl font-semibold text-primary sm:text-5xl">
          Page Not Found
        </h1>
        <p className="mx-auto max-w-md text-base leading-relaxed text-muted sm:text-lg">
          The requested page could not be located. It may have been moved, renamed, or is currently
          unavailable.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        <LinkButton href="/" variant="primary" size="md">
          Return Home
        </LinkButton>
        <LinkButton href="/services" variant="secondary" size="md">
          Explore Services
        </LinkButton>
        <LinkButton href="/contact" variant="ghost" size="md">
          Contact Us
        </LinkButton>
      </div>
    </main>
  );
}
