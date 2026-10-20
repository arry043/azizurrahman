"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LinkButton } from "@/components/ui/link-button";
import { PRIMARY_NAV_ITEMS } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <div className="hidden items-center gap-8 lg:flex">
      <nav aria-label="Main Navigation" className="flex items-center gap-1.5 xl:gap-2">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative rounded-md px-3.5 py-2 text-sm font-medium tracking-wide transition-colors",
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
                  className="absolute inset-x-3.5 -bottom-2 h-0.5 rounded-full bg-accent"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <LinkButton href="/book" variant="primary" size="md">
          Book Appointment
        </LinkButton>
      </div>
    </div>
  );
}
