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
import { getActiveServices, getPublicSiteSettings } from "@/lib/services/public-services";

export const metadata: Metadata = {
  title: `Contact ${scholarProfile.identity.fullNameEn} | ${siteConfig.name}`,
  description: `Official contact information for ${scholarProfile.identity.fullNameEn}. Email, postal address, and consultation appointment scheduling.`,
};

export const instant = false;

export default async function ContactPage() {
  const [siteSettings, services] = await Promise.all([
    getPublicSiteSettings(),
    getActiveServices(),
  ]);

  const serviceNames = services.map((s) => s.name);
  const displayAddress = siteSettings?.public_address || scholarProfile.contact.address.full;
  const displayEmail = siteSettings?.public_email;

  return (
    <>
      {/* Header */}
      <PageSection background="inverse" padding="md" className="border-b border-accent/30">
        <PageContainer>
          <Breadcrumbs items={[{ label: "Contact" }]} className="mb-4 text-ivory/70" />
          <SectionHeading
            kicker="Direct Communication"
            title="Get in Touch"
            description={`Have questions regarding spiritual consultation or appointment requests? Reach out to ${scholarProfile.identity.fullNameEn} through official channels.`}
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
                  Direct Channels
                </p>
                <h3 className="font-display text-3xl font-semibold text-primary">
                  Official Contact Channels
                </h3>
                <Ornament className="mt-3 justify-start" />
                <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                  Official inquiries regarding Islamic spiritual guidance, supplications (duas), and
                  consultation requests are welcomed through the verified channels below.
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
                  <p className="font-semibold text-primary">Telephone &amp; WhatsApp Notice:</p>
                  <p className="mt-1 leading-relaxed">
                    Client contact number ({scholarProfile.contact.phone.rawInput}) is pending
                    international format confirmation (+91 prefix). Calling and WhatsApp links will
                    be activated once confirmed. You may reach out immediately by official email or
                    request a consultation online.
                  </p>
                </div>
              )}

              {/* Consultation Hours & Official Address */}
              <div className="grid gap-4 pt-2 sm:grid-cols-2">
                <Card variant="muted" className="p-5">
                  <div className="mb-2 flex items-center gap-2.5 text-primary">
                    <ClockIcon className="size-5 text-accent-strong" />
                    <CardTitle className="text-base">Consultation Hours</CardTitle>
                  </div>
                  <p className="text-xs leading-relaxed text-muted sm:text-sm">
                    {siteSettings?.consultation_hours_text ||
                      "Consultations are conducted strictly by confirmed appointment to respect client privacy."}
                  </p>
                </Card>

                <Card variant="muted" className="p-5">
                  <div className="mb-2 flex items-center gap-2.5 text-primary">
                    <MapPinIcon className="size-5 text-accent-strong" />
                    <CardTitle className="text-base">Official Address</CardTitle>
                  </div>
                  <p className="text-xs leading-relaxed text-muted sm:text-sm">{displayAddress}</p>
                  <div className="mt-3">
                    <a
                      href={scholarProfile.contact.address.mapsSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>Search on Google Maps</span>
                      <ExternalLinkIcon className="size-3 opacity-70" />
                    </a>
                    <p className="mt-1 text-[11px] text-muted italic">
                      Notice: Consultations are held by appointment; precise map pin is not
                      verified.
                    </p>
                  </div>
                </Card>
              </div>

              {/* Distinguish Contact vs Booking */}
              <div className="space-y-3 rounded-card border border-border bg-surface-muted p-6">
                <h4 className="font-display text-lg font-semibold text-primary">
                  Important: Inquiries vs. Appointments
                </h4>
                <p className="text-xs leading-relaxed text-muted sm:text-sm">
                  Sending a direct message via WhatsApp or email allows you to ask preliminary
                  questions, but does not reserve an appointment on the schedule. To book a
                  dedicated consultation slot, please use the online booking system.
                </p>
                <div className="pt-2">
                  <LinkButton href="/book" variant="primary" size="sm">
                    Request an Appointment Slot →
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
