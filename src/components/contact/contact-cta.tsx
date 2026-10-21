"use client";

import { ContactActions } from "@/components/contact/contact-actions";
import { LinkButton } from "@/components/ui/link-button";
import { Ornament } from "@/components/ui/ornament";
import { useTranslations } from "@/i18n/client";
import { cn } from "@/lib/utils";

export interface ContactCTAProps {
  title?: string;
  description?: string;
  whatsapp?: string | null;
  phone?: string | null;
  email?: string | null;
  showBookButton?: boolean;
  className?: string;
}

export function ContactCTA({
  title,
  description,
  whatsapp,
  phone,
  email,
  showBookButton = true,
  className,
}: ContactCTAProps) {
  const { t, locale } = useTranslations();
  const isUr = locale === "ur";

  const displayTitle =
    title ?? (isUr ? t.home.contactCTAHeading : "Ready for a Personal Consultation?");

  const displayDescription =
    description ??
    (isUr
      ? t.home.contactCTADesc
      : "Appointments are conducted in a calm, confidential, and dedicated setting. Choose a service or reach out for inquiries.");

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card border border-accent/40 bg-linear-to-b from-forest to-[#022019] p-8 text-center text-foreground-inverse shadow-raised sm:p-12 lg:p-16",
        className,
      )}
    >
      {/* Decorative background geometry */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-accent/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full bg-primary/20 blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-2xl space-y-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase sm:text-sm">
          {isUr ? "بامقصد اور پرسکون روحانی مشاورت" : "Confidential & Dedicated Guidance"}
        </p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ivory sm:text-4xl lg:text-5xl">
          {displayTitle}
        </h2>
        <Ornament className="justify-center" />
        <p className="text-base leading-relaxed text-ivory/80 sm:text-lg">{displayDescription}</p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
          {showBookButton && (
            <LinkButton href="/book" variant="primary" size="lg">
              {t.common.bookAppointment}
            </LinkButton>
          )}
          <LinkButton
            href="/contact"
            variant="secondary"
            size="lg"
            className="border-accent text-accent hover:bg-accent/10"
          >
            {isUr ? "رابطے کے ذرائع" : "Contact Channels"}
          </LinkButton>
        </div>

        {(whatsapp || phone || email) && (
          <div className="mt-6 border-t border-white/10 pt-6">
            <ContactActions whatsapp={whatsapp} phone={phone} email={email} variant="horizontal" />
          </div>
        )}
      </div>
    </div>
  );
}
