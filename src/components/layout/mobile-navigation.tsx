"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/layout/brand-mark";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { PUBLIC_NAV_ITEMS } from "@/config/navigation";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close drawer when pathname changes
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  // Lock body scroll and manage focus
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Focus first link or close button inside drawer
      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.[0]?.focus();
    } else {
      document.body.style.overflow = "";
      triggerRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Keyboard navigation: Escape key to close and Tab key trapping
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        return;
      }

      if (e.key === "Tab") {
        const drawer = drawerRef.current;
        if (!drawer) return;

        const focusable = drawer.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-drawer"
        aria-label="Open navigation menu"
        className="flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border/40 p-2 text-ivory hover:bg-white/10 focus-visible:outline-3 focus-visible:outline-focus"
      >
        <MenuIcon className="size-6" />
      </button>

      {isMounted &&
        isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="fixed inset-0 z-50 flex justify-end"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-forest/70 backdrop-blur-xs transition-opacity"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer panel */}
            <div
              ref={drawerRef}
              tabIndex={-1}
              className={cn(
                "relative z-10 flex h-full w-full max-w-xs flex-col overflow-y-auto border-l border-accent/30 bg-surface-inverse p-6 text-foreground-inverse shadow-modal focus:outline-none sm:max-w-sm",
              )}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <BrandMark inverse />
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close navigation menu"
                  className="flex size-10 items-center justify-center rounded-md p-2 text-ivory/80 hover:bg-white/10 hover:text-white focus-visible:outline-3 focus-visible:outline-focus"
                >
                  <CloseIcon className="size-6" />
                </button>
              </div>

              {/* Navigation links */}
              <nav aria-label="Mobile Navigation" className="flex-1 py-6">
                <ul className="space-y-1">
                  {PUBLIC_NAV_ITEMS.map((item) => {
                    const isActive =
                      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={isActive ? "page" : undefined}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex min-h-11 items-center rounded-control px-4 py-2.5 text-base font-medium transition-colors",
                            "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus",
                            isActive
                              ? "bg-accent/20 font-semibold text-accent"
                              : "text-ivory/90 hover:bg-white/5 hover:text-white",
                          )}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Drawer Footer CTA */}
              <div className="space-y-3 border-t border-white/10 pt-6">
                <LinkButton
                  href="/book"
                  variant="primary"
                  size="lg"
                  className="w-full text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Book Appointment
                </LinkButton>
                <p className="text-center text-xs text-ivory/60">
                  Spiritual consultation by appointment
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
