import type { Metadata } from "next";

import { ContactActions } from "@/components/contact/contact-actions";
import { InquiryForm } from "@/components/contact/inquiry-form";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { PageSection } from "@/components/layout/page-section";
import { Card, CardTitle } from "@/components/ui/card";
import { ClockIcon, ExternalLinkIcon, MapPinIcon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { Ornament } from "@/components/ui/ornament";
import { SectionHeading } from "@/components/ui/section-heading";
import { scholarProfile } from "@/config/scholar-profile";
import { siteConfig } from "@/config/site";
import { getServerTranslations } from "@/i18n/server";
import { getLocalizedService } from "@/i18n/services-dictionary";
import { getActiveServices, getPublicSiteSettings } from "@/lib/services/public-services";

export const metadata: Metadata = {
  title: `Contact ${scholarProfile.identity.fullNameEn}`,
  description: `Official contact information for ${scholarProfile.identity.fullNameEn}. Email, postal address, and consultation appointment scheduling.`,
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: `Contact ${scholarProfile.identity.fullNameEn} · ${siteConfig.name}`,
    description: `Official contact information for ${scholarProfile.identity.fullNameEn}. Email, postal address, and consultation appointment scheduling.`,
    url: "/contact",
  },
};

export const instant = false;

export default async function ContactPage() {
  const [{ t, locale, interpolate }, siteSettings, services] = await Promise.all([
    getServerTranslations(),
    getPublicSiteSettings(),
    getActiveServices(),
  ]);

  const isUr = locale === "ur";
  const scholarName = isUr
    ? scholarProfile.identity.fullNameUr
    : scholarProfile.identity.fullNameEn;
  const serviceNames = services.map((s) => getLocalizedService(s, locale).name);
  const displayAddress = isUr
    ? siteSettings?.public_address || "موضع کھریواں، سرائمیر، اعظم گڑھ، اتر پردیش، انڈیا — 276305"
    : siteSettings?.public_address || scholarProfile.contact.address.full;
  const displayEmail = siteSettings?.public_email;

  return (
    <>
      {/* Header */}
      <PageSection background="inverse" padding="md" className="border-b border-accent/30">
        <PageContainer>
          <Breadcrumbs
            items={[{ label: isUr ? "رابطہ" : "Contact" }]}
            className="mb-4 text-ivory/70"
          />
          <SectionHeading
            kicker={t.contact.kicker}
            title={t.contact.title}
            description={interpolate(t.contact.description, { name: scholarName })}
            inverse
            align="center"
          />
        </PageContainer>
      </PageSection>

      {/* Main Content */}
      <PageSection background="default" padding="lg">
        <PageContainer>
          <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-14">
            {/* Left: Contact Channels & Guidelines */}
            <div className="space-y-8 lg:col-span-6">
              <div>
                <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-accent-strong uppercase sm:text-sm">
                  {t.contact.directChannelsKicker}
                </p>
                <h3 className="font-display text-3xl font-semibold text-primary">
                  {t.contact.directChannelsTitle}
                </h3>
                <Ornament className="mt-3 justify-start" />
                <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                  {t.contact.directChannelsDesc}
                </p>
              </div>

              {/* Verified Contact Actions */}
              <ContactActions
                whatsapp={siteSettings?.public_whatsapp}
                phone={siteSettings?.public_phone}
                email={displayEmail}
                whatsappTemplate={siteSettings?.whatsapp_message_template}
                variant="vertical"
              />

              {/* Phone / WhatsApp International Confirmation Notice */}
              {!siteSettings?.public_phone && !siteSettings?.public_whatsapp && (
                <div className="rounded-control border border-border/80 bg-surface-muted/60 p-4 text-xs text-muted">
                  <p className="font-semibold text-primary">{t.contact.phoneNoticeTitle}</p>
                  <p className="mt-1 leading-relaxed">
                    {interpolate(t.contact.phoneNoticeDesc, {
                      phone: scholarProfile.contact.phone.rawInput,
                    })}
                  </p>
                </div>
              )}

              {/* Consultation Hours & Official Address */}
              <div className="grid gap-4 pt-2 sm:grid-cols-2">
                <Card variant="muted" className="p-5">
                  <div className="mb-2 flex items-center gap-2.5 text-primary">
                    <ClockIcon className="size-5 shrink-0 text-accent-strong" />
                    <CardTitle className="text-base">{t.contact.hoursTitle}</CardTitle>
                  </div>
                  <p className="text-xs leading-relaxed text-muted sm:text-sm">
                    {siteSettings?.consultation_hours_text || t.contact.hoursDefault}
                  </p>
                </Card>

                <Card variant="muted" className="p-5">
                  <div className="mb-2 flex items-center gap-2.5 text-primary">
                    <MapPinIcon className="size-5 shrink-0 text-accent-strong" />
                    <CardTitle className="text-base">{t.contact.addressTitle}</CardTitle>
                  </div>
                  <p className="text-xs leading-relaxed text-muted sm:text-sm">{displayAddress}</p>
                  <div className="mt-3">
                    <a
                      href={scholarProfile.contact.address.mapsSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>{t.contact.mapsSearch}</span>
                      <ExternalLinkIcon className="size-3 opacity-70 rtl:rotate-180" />
                    </a>
                    <p className="mt-1 text-[11px] text-muted italic">{t.contact.mapsNotice}</p>
                  </div>
                </Card>
              </div>

              {/* Distinguish Contact vs Booking */}
              <div className="space-y-3 rounded-card border border-border bg-surface-muted p-6">
                <h4 className="font-display text-lg font-semibold text-primary">
                  {t.contact.inquiriesVsAppointmentsTitle}
                </h4>
                <p className="text-xs leading-relaxed text-muted sm:text-sm">
                  {t.contact.inquiriesVsAppointmentsDesc}
                </p>
                <div className="pt-2">
                  <LinkButton href="/book" variant="primary" size="sm">
                    {t.contact.requestSlotLink}
                  </LinkButton>
                </div>
              </div>
            </div>

            {/* Right: Message Preparer / Form */}
            <div className="lg:col-span-6">
              <InquiryForm
                whatsapp={siteSettings?.public_whatsapp}
                email={displayEmail}
                serviceNames={serviceNames}
              />
            </div>
          </div>
        </PageContainer>
      </PageSection>
    </>
  );
}
