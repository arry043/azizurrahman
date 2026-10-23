import { Suspense } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { DesktopNavigation } from "@/components/layout/desktop-navigation";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileNavigation } from "@/components/layout/mobile-navigation";

export async function PublicHeader() {
  return (
    <header className="site-header sticky top-0 z-40 border-b border-accent/30 bg-surface-inverse/95 shadow-subtle backdrop-blur-md print:hidden">
      <div className="container-page flex min-h-16 items-center justify-between py-2.5 sm:min-h-20">
        <BrandMark inverse />

        {/* Desktop navigation */}
        <Suspense fallback={<div className="hidden min-w-[300px] lg:flex" />}>
          <DesktopNavigation />
        </Suspense>

        {/* Mobile controls: [اردو / EN] [☰] */}
        <div className="flex items-center gap-2 sm:gap-2.5 lg:hidden">
          <LanguageSwitcher variant="header" />
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
