import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { CurrentYear } from "@/components/layout/current-year";
import { Ornament } from "@/components/ui/ornament";
import { PUBLIC_NAV_ITEMS } from "@/config/navigation";
import { siteConfig } from "@/config/site";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface-muted text-foreground">
      <div className="container-page py-12 sm:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-2 lg:col-span-2">
            <BrandMark />
            <p className="max-w-md text-sm leading-relaxed text-muted">
              Dedicated to compassionate spiritual consultation, ethical reflection, and
              personalized guidance. Inquiries and appointments are treated with utmost privacy and
              respect.
            </p>
            <Ornament className="mt-4 justify-start" />
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-3">
            <h4 className="font-display text-base font-semibold tracking-wider text-primary uppercase">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm">
              {PUBLIC_NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-focus"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Consultation & Booking Info */}
          <div className="space-y-3">
            <h4 className="font-display text-base font-semibold tracking-wider text-primary uppercase">
              Appointments
            </h4>
            <p className="text-sm leading-relaxed text-muted">
              Consultations are scheduled in advance to ensure dedicated time and privacy.
            </p>
            <div className="pt-2">
              <Link
                href="/book"
                className="inline-flex items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                Schedule Consultation →
              </Link>
            </div>
            <div className="pt-1">
              <Link
                href="/appointments/lookup"
                className="inline-flex items-center text-xs text-muted transition-colors hover:text-primary"
              >
                Lookup Existing Appointment
              </Link>
            </div>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-8 text-center text-xs text-muted sm:flex-row sm:text-left">
          <p>
            © <CurrentYear /> {siteConfig.name}. All rights reserved.
          </p>
          <p className="max-w-md">
            Consultations are advisory and spiritual in nature. Personal privacy and ethical
            guidance are paramount.
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Backward compatibility alias for SiteFooter */
export const SiteFooter = PublicFooter;
