"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import {
  CalendarIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserIcon,
} from "@/components/ui/icons";
import { scholarProfile } from "@/config/scholar-profile";
import { useTranslations } from "@/i18n/client";
import { getLocalizedService } from "@/i18n/services-dictionary";
import { cn } from "@/lib/utils";
import type { PublicService } from "@/types/domain";

export interface HeroConsultationShowcaseProps {
  /**
   * Active public services to feature in the interactive showcase.
   * If fewer than 3 services are provided, approved defaults are used.
   */
  services?: readonly PublicService[];
  className?: string;
}

interface ShowcaseServiceItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  badge: string;
  href: string;
  icon: ReactNode;
}

export function HeroConsultationShowcase({
  services = [],
  className,
}: HeroConsultationShowcaseProps) {
  const { locale } = useTranslations();
  const isUr = locale === "ur";

  // Build the 3 consultation preview offerings
  const items: ShowcaseServiceItem[] = [
    {
      id: "service-dua",
      slug: services[0]?.slug ?? "dua-and-supplication",
      title: services[0]
        ? getLocalizedService(services[0], locale).name
        : isUr
          ? "مسنون دعائیں اور روحانی رہنمائی"
          : "Dua & Supplication Guidance",
      summary: isUr
        ? "قرآن و مسنون اذکار کے ذریعے قلبی سکون اور رہنمائی"
        : "Focused prayer and spiritual supplications for peace",
      badge: isUr ? "30 منٹ • انفرادی" : "30 Mins • One-on-One",
      href: services[0]
        ? `/book?service=${services[0].slug}`
        : "/book?service=dua-and-supplication",
      icon: <SparklesIcon className="size-5" />,
    },
    {
      id: "service-consultation",
      slug: services[1]?.slug ?? "dev-sample-standard-consultation",
      title: services[1]
        ? getLocalizedService(services[1], locale).name
        : isUr
          ? "روحانی و شخصی مشاورت"
          : "Spiritual Guidance Consultation",
      summary: isUr
        ? "زندگی کے اہم معاملات اور تزکیۂ نفس پر گہری گفتگو"
        : "Confidential counsel for life decisions and spiritual wellbeing",
      badge: isUr ? "45 منٹ • خفیہ و باوقار" : "45 Mins • Confidential",
      href: services[1] ? `/book?service=${services[1].slug}` : "/book",
      icon: <ShieldCheckIcon className="size-5" />,
    },
    {
      id: "service-family",
      slug: services[2]?.slug ?? "family-consultation",
      title: services[2]
        ? getLocalizedService(services[2], locale).name
        : isUr
          ? "خاندانی و ازدواجی مشاورت"
          : "Family Guidance & Counsel",
      summary: isUr
        ? "گھریلو ہم آہنگی، رشتوں کے مسائل اور شرعی حل"
        : "Ethical mediation and family counsel grounded in Islamic values",
      badge: isUr ? "60 منٹ • شرعی رہنمائی" : "60 Mins • Islamic Counsel",
      href: services[2] ? `/book?service=${services[2].slug}` : "/book?service=family-consultation",
      icon: <UserIcon className="size-5" />,
    },
  ];

  return (
    <div
      className={cn(
        "relative mx-auto flex w-full max-w-[500px] flex-col items-center justify-center",
        className,
      )}
    >
      {/* 1. Ambient Lighting & Sacred Islamic Geometry Lattice (Background) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 size-72 animate-pulse-soft rounded-full bg-accent/20 blur-3xl sm:size-96"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 size-64 rounded-full bg-primary-hover/25 blur-3xl sm:size-80"
      />

      {/* Decorative Islamic Arabesque Geometric Background Ornament */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        className="pointer-events-none absolute inset-0 size-full text-accent/15"
      >
        <circle
          cx="200"
          cy="200"
          r="180"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
        <circle
          cx="200"
          cy="200"
          r="140"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
          strokeDasharray="2 6"
        />
        {/* 8-pointed star geometry (Khatam) */}
        <rect
          x="100"
          y="100"
          width="200"
          height="200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="opacity-40"
        />
        <rect
          x="100"
          y="100"
          width="200"
          height="200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          transform="rotate(45 200 200)"
          className="opacity-40"
        />
      </svg>

      {/* 2. Floating Satellite Badge 1 (Top-Start: Live Availability Status) */}
      <div
        className={cn(
          "shadow-black/40 absolute -start-6 -top-5 z-20 hidden animate-float-1 items-center gap-3 rounded-2xl border border-accent/40 bg-surface-inverse/90 px-4 py-2.5 shadow-raised backdrop-blur-md lg:flex",
        )}
      >
        <span className="relative flex size-2.5">
          <span className="bg-emerald-400 absolute inline-flex size-full animate-ping rounded-full opacity-75" />
          <span className="bg-emerald-500 relative inline-flex size-2.5 rounded-full" />
        </span>
        <div className="flex flex-col text-start">
          <span className="text-[10px] font-semibold tracking-wider text-accent uppercase">
            {isUr ? "اوقاتِ کار" : "Live Availability"}
          </span>
          <span
            className={cn(
              "text-xs font-medium text-ivory",
              isUr && "font-urdu text-xs leading-normal",
            )}
          >
            {isUr ? "اس ہفتے کی نشستیں دستیاب ہیں" : "Sessions Available This Week"}
          </span>
        </div>
      </div>

      {/* 3. The Central Consultation Sanctum Card */}
      <div className="relative z-10 w-full overflow-hidden rounded-3xl border border-accent/45 bg-gradient-to-b from-[#063b2f]/95 via-[#032a21]/95 to-[#021f18]/98 p-5.5 shadow-raised ring-1 shadow-forest/90 ring-accent/25 backdrop-blur-md sm:p-7">
        {/* Subtle decorative inner top arch line */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 left-1/2 h-24 w-48 -translate-x-1/2 rounded-b-full border-b border-accent/30 bg-accent/5 blur-xs"
        />

        {/* Card Header */}
        <div className="relative mb-5 flex flex-col gap-2 border-b border-accent/25 pb-4.5 text-start">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-[11px] font-medium tracking-wide text-accent">
              <SparklesIcon className="size-3.5 text-accent" />
              <span>{isUr ? "شخصی روحانی رہنمائی" : "Islamic Spiritual Counsel"}</span>
            </span>

            <span className="text-[11px] font-medium text-ivory/70">
              {isUr ? scholarProfile.identity.fullNameUr : scholarProfile.identity.fullNameEn}
            </span>
          </div>

          <h2
            className={cn(
              "font-display text-2xl font-semibold tracking-tight text-ivory sm:text-3xl",
              isUr && "font-urdu text-xl leading-relaxed font-bold",
            )}
          >
            {isUr ? "مشاورتی نشست کا انتخاب کریں" : "Select a Guidance Session"}
          </h2>

          <p
            className={cn(
              "text-xs leading-relaxed text-ivory/80",
              isUr && "font-urdu text-xs leading-relaxed",
            )}
          >
            {isUr
              ? "قرآن و سنت کی روشنی میں خلوص اور رازداری کے ساتھ بالمشافہ رہنمائی"
              : "Sincere, confidential counsel grounded in Qur'an and Sunnah"}
          </p>
        </div>

        {/* Service Options List */}
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group relative flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-white/5 p-3.5 transition-all duration-300 hover:border-accent hover:bg-accent/10 hover:shadow-subtle"
            >
              <div className="flex items-start gap-3 text-start">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-accent/40 bg-accent/15 text-accent transition-transform duration-300 group-hover:scale-105">
                  {item.icon}
                </div>

                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-semibold text-ivory transition-colors group-hover:text-white",
                        isUr && "font-urdu text-sm leading-normal",
                      )}
                    >
                      {item.title}
                    </span>
                  </div>

                  <p
                    className={cn(
                      "mt-0.5 line-clamp-1 text-xs text-ivory/70",
                      isUr && "font-urdu text-xs leading-normal",
                    )}
                  >
                    {item.summary}
                  </p>

                  <span className="mt-1 text-[11px] font-medium text-accent">{item.badge}</span>
                </div>
              </div>

              <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-forest">
                <ChevronRightIcon className="rtl-flip size-4" />
              </div>
            </Link>
          ))}
        </div>

        {/* Card CTA & Navigation */}
        <div className="mt-5 pt-2">
          <Link
            href="/book"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent bg-accent/20 px-4 py-3 text-sm font-semibold text-ivory shadow-subtle transition-all duration-300 hover:bg-accent hover:text-forest hover:shadow-accent/30"
          >
            <CalendarIcon className="size-4 text-accent group-hover:text-forest" />
            <span className={cn(isUr && "font-urdu text-sm")}>
              {isUr ? "تمام اوقات دیکھیں اور نشست بک کریں" : "View All Slots & Schedule Session"}
            </span>
            <ChevronRightIcon className="rtl-flip size-4" />
          </Link>
        </div>

        {/* Micro Trust Credentials */}
        <div className="mt-4 flex items-center justify-between border-t border-accent/20 pt-3 text-[11px] text-ivory/70">
          <span className="inline-flex items-center gap-1">
            <span className="size-1 rounded-full bg-accent" />
            <span>{isUr ? "قرآن و سنت" : "Qur'an & Sunnah"}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-1 rounded-full bg-accent" />
            <span>{isUr ? "مکمل رازداری" : "100% Confidential"}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-1 rounded-full bg-accent" />
            <span>{isUr ? "رو بہ رو و آن لائن" : "In-Person & Online"}</span>
          </span>
        </div>
      </div>

      {/* 4. Floating Satellite Badge 2 (Bottom-End: Ethical Integrity) */}
      <div
        className={cn(
          "shadow-black/40 absolute -end-6 -bottom-5 z-20 hidden animate-float-2 items-center gap-3 rounded-2xl border border-accent/40 bg-surface-inverse/90 px-4 py-2.5 shadow-raised backdrop-blur-md lg:flex",
        )}
      >
        <div className="flex size-7 items-center justify-center rounded-lg border border-accent/40 bg-accent/15 text-accent">
          <ShieldCheckIcon className="size-4" />
        </div>
        <div className="flex flex-col text-start">
          <span className="text-[10px] font-semibold tracking-wider text-accent uppercase">
            {isUr ? "شرعی اصول" : "Ethical Commitment"}
          </span>
          <span
            className={cn(
              "text-xs font-medium text-ivory",
              isUr && "font-urdu text-xs leading-normal",
            )}
          >
            {isUr ? "خالص علمی و دینی رہنمائی" : "Free from Commercial Exploitation"}
          </span>
        </div>
      </div>
    </div>
  );
}

// Re-export as HeroEmblemShowcase for seamless drop-in backwards compatibility
export { HeroConsultationShowcase as HeroEmblemShowcase };
