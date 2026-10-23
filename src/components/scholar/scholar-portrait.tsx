"use client";

import Image from "next/image";

import { MapPinIcon, ShieldCheckIcon, SparklesIcon, UserIcon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { Ornament } from "@/components/ui/ornament";
import { scholarProfile } from "@/config/scholar-profile";
import { useTranslations } from "@/i18n/client";
import { cn } from "@/lib/utils";

export interface ScholarPortraitProps {
  className?: string;
  variant?: "full" | "compact";
  showActions?: boolean;
}

export function ScholarPortrait({
  className,
  variant = "full",
  showActions = true,
}: ScholarPortraitProps) {
  const isCompact = variant === "compact";
  const { t, locale } = useTranslations();
  const isUr = locale === "ur";

  const addressText = isUr
    ? scholarProfile.contact.address.compactUr || "کھریواں، سرائمیر، اعظم گڑھ، یوپی، انڈیا، 276305"
    : "Kharewan, Saraimeer, Azamgarh, UP, India, 276305";

  return (
    <div
      className={cn(
        "scholar-portrait relative mx-auto flex flex-col items-center text-center",
        className,
      )}
    >
      {/* 1. Architectural Islamic Arch Backdrop with Ambient Spiritual Radiance */}
      <div className="relative mx-auto flex justify-center">
        {/* Soft Ambient Radiance / Spiritual Golden Halo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-6 left-1/2 size-72 -translate-x-1/2 -translate-y-4 rounded-full bg-accent/20 blur-3xl sm:size-88"
        />

        {/* Floating Moorish Architectural Arch Backdrop (Open Bottom, No Enclosure) */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-2 top-3 bottom-0",
            "rounded-t-[140px] sm:rounded-t-[170px]",
            "bg-linear-to-b from-[#ebdcc2]/85 via-[#f6efe4]/50 to-transparent",
            "border-x border-t border-accent/35",
            "[mask-image:linear-gradient(to_bottom,black_65%,transparent_100%)]",
          )}
        />

        {/* Subtle Decorative Inner Arch Accent */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-5 top-6 bottom-4",
            "rounded-t-[125px] sm:rounded-t-[155px]",
            "border-x border-t border-accent/20",
            "[mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)]",
          )}
        />

        {/* The Cutout Scholar Portrait Floating Freely & Elegantly */}
        <div
          className={cn(
            "relative z-10 flex items-end justify-center",
            isCompact
              ? "h-[330px] w-64 sm:h-[370px] sm:w-72"
              : "h-[370px] w-72 sm:h-[430px] sm:w-80",
          )}
        >
          <div className="relative size-full [mask-image:linear-gradient(to_bottom,black_80%,transparent_98%)]">
            <Image
              src={scholarProfile.identity.avatar.src}
              alt={scholarProfile.identity.avatar.alt}
              width={scholarProfile.identity.avatar.width}
              height={scholarProfile.identity.avatar.height}
              priority
              sizes="(min-width: 640px) 20rem, 18rem"
              className="size-full object-contain object-bottom drop-shadow-[0_16px_28px_rgba(20,25,15,0.12)] transition-transform duration-500 hover:scale-[1.02]"
            />
          </div>
        </div>
      </div>

      {/* 2. Classic Typographic Plaque (Clean, Open, Borderless) */}
      <div className="mt-5 flex flex-col items-center">
        {/* Arabic Name (Above) */}
        <h3
          lang="ur"
          dir="rtl"
          className="font-urdu text-2xl leading-relaxed font-bold tracking-wide text-primary sm:text-3xl"
        >
          {scholarProfile.identity.fullNameUr}
        </h3>

        {/* English Name (Below) */}
        <p className="mt-1 font-display text-xl font-semibold tracking-tight text-accent-strong sm:text-2xl">
          {scholarProfile.identity.fullNameEn}
        </p>

        <p className="mt-1 text-xs font-semibold tracking-[0.2em] text-muted uppercase">
          {isUr ? scholarProfile.identity.titleUr : scholarProfile.identity.titleEn}
        </p>

        <Ornament className="mt-3 justify-center" />

        {/* Scholar Location Badge */}
        <div className="mt-3.5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-surface/80 px-4 py-1.5 text-xs text-primary shadow-xs backdrop-blur-xs">
          <MapPinIcon className="size-3.5 shrink-0 text-accent-strong" />
          <span className="font-medium">{addressText}</span>
        </div>

        {/* Trust Badges - Clean Floating Row (Full Variant) */}
        {!isCompact && (
          <div className="mt-5 flex flex-wrap justify-center gap-2 pt-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1.5 shadow-xs">
              <ShieldCheckIcon className="size-3.5 text-emerald" />
              <span>{isUr ? "مکمل رازداری" : "Strict Confidentiality"}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1.5 shadow-xs">
              <SparklesIcon className="size-3.5 text-accent-strong" />
              <span>{isUr ? "قرآن و سنت کی روشنی میں رہنمائی" : "Qur'an & Sunnah Guidance"}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface/70 px-3.5 py-1.5 shadow-xs">
              <UserIcon className="size-3.5 text-emerald" />
              <span>{isUr ? "انفرادی توجہ" : "Personalized Attention"}</span>
            </span>
          </div>
        )}

        {/* CTAs */}
        {showActions && (
          <div className="mt-6 flex w-full max-w-xs flex-col gap-2.5 sm:flex-row">
            <LinkButton href="/book" variant="primary" size="md" className="w-full justify-center">
              {t.common.bookAppointment}
            </LinkButton>
            <LinkButton
              href="/contact"
              variant="outline"
              size="md"
              className="w-full justify-center border-accent/50 text-primary hover:bg-cream/40"
            >
              {t.navigation.contact}
            </LinkButton>
          </div>
        )}
      </div>
    </div>
  );
}
