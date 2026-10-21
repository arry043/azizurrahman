import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { CurrentYear } from "@/components/layout/current-year";
import { MailIcon, MapPinIcon } from "@/components/ui/icons";
import { Ornament } from "@/components/ui/ornament";
import { PUBLIC_NAV_ITEMS } from "@/config/navigation";
import { scholarProfile } from "@/config/scholar-profile";
import { siteConfig } from "@/config/site";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface-muted text-foreground">
      <div className="container-page py-12 sm:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Scholar Identity Column */}
          <div className="space-y-4 md:col-span-2 lg:col-span-2">
            <BrandMark />
            <p className="font-display text-lg font-semibold text-primary">
              {scholarProfile.identity.fullNameEn}
            </p>
            <p className="max-w-md text-sm leading-relaxed text-muted">
              {scholarProfile.content.en.aboutIntro} Inquiries and consultation appointments are
              treated with the highest level of personal privacy and dignity.
            </p>

            {/* Official Contact & Compact Address */}
            <div className="space-y-2 pt-2 text-xs text-muted sm:text-sm">
              <div className="flex items-start gap-2">
                <MapPinIcon className="mt-0.5 size-4 shrink-0 text-accent-strong" />
                <span>{scholarProfile.contact.address.compact}</span>
              </div>
              <div className="flex items-center gap-2">
                <MailIcon className="size-4 shrink-0 text-accent-strong" />
                <a
                  href={`mailto:${scholarProfile.contact.email}`}
                  className="font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-focus"
                >
                  {scholarProfile.contact.email}
                </a>
              </div>
            </div>

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
              Consultations are scheduled strictly in advance to ensure dedicated time and privacy.
            </p>
            <div className="space-y-2 pt-2">
              <div>
                <Link
                  href="/book"
                  className="inline-flex items-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Book an Appointment →
                </Link>
              </div>
              <div>
                <Link
                  href="/contact"
                  className="inline-flex items-center text-sm text-muted transition-colors hover:text-primary"
                >
                  Direct Contact &amp; Inquiries
                </Link>
              </div>
              <div>
                <Link
                  href="/appointments/lookup"
                  className="inline-flex items-center text-xs text-muted transition-colors hover:text-primary"
                >
                  Lookup Existing Appointment
                </Link>
              </div>
              <div>
                <Link
                  href="/privacy"
                  className="inline-flex items-center text-xs text-muted transition-colors hover:text-primary"
                >
                  Privacy Notice &amp; Data Policy
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-8 text-center text-xs text-muted sm:flex-row sm:text-left">
          <p>
            © <CurrentYear /> {siteConfig.name} — {scholarProfile.identity.fullNameEn}. All rights
            reserved. ·{" "}
            <Link href="/privacy" className="underline hover:text-primary">
              Privacy Notice
            </Link>
          </p>
          <p className="max-w-md">
            Consultations are spiritual and advisory in nature. Outcomes are solely by Allah&apos;s
            grace.
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Backward compatibility alias for SiteFooter */
export const SiteFooter = PublicFooter;
