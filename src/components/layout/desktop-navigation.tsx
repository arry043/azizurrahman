"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { LinkButton } from "@/components/ui/link-button";
import { useTranslations } from "@/i18n/client";
import { cn } from "@/lib/utils";

export function DesktopNavigation() {
  const pathname = usePathname();
  const { t } = useTranslations();

  const navItems = [
    { label: t.navigation.home, href: "/" },
    { label: t.navigation.about, href: "/about" },
    { label: t.navigation.services, href: "/services" },
    { label: t.navigation.contact, href: "/contact" },
    { label: t.navigation.lookupShort, href: "/appointments/lookup" },
  ];

  return (
    <div className="hidden items-center gap-6 lg:flex xl:gap-8">
      <nav aria-label={t.navigation.mainNavLabel} className="flex items-center gap-1.5 xl:gap-2">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative rounded-md px-3 py-2 text-sm font-medium tracking-wide transition-colors",
                "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus",
                isActive
                  ? "font-semibold text-accent"
                  : "text-ivory/90 hover:bg-white/5 hover:text-white",
              )}
            >
              {item.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3 -bottom-2 h-0.5 rounded-full bg-accent"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <LanguageSwitcher variant="header" />
        <LinkButton href="/book" variant="primary" size="md">
          {t.common.bookAppointment}
        </LinkButton>
      </div>
    </div>
  );
}
