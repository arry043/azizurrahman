import { Suspense } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { DesktopNavigation } from "@/components/layout/desktop-navigation";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { LinkButton } from "@/components/ui/link-button";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-accent/30 bg-surface-inverse/95 shadow-subtle backdrop-blur-md">
      <div className="container-page flex min-h-16 items-center justify-between py-2.5 sm:min-h-20">
        <BrandMark inverse />

        {/* Desktop navigation */}
        <Suspense fallback={<div className="hidden min-w-[300px] lg:flex" />}>
          <DesktopNavigation />
        </Suspense>

        {/* Mobile controls */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <LinkButton
            href="/book"
            variant="primary"
            size="sm"
            className="min-h-9 px-3 py-1.5 text-xs sm:text-sm"
          >
            Book
          </LinkButton>
          <Suspense fallback={<div className="min-h-11 min-w-11" />}>
            <MobileNavigation />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

/** Backward compatibility alias for SiteHeader */
export const SiteHeader = PublicHeader;
