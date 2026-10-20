import type { Metadata } from "next";

import { ContactActions } from "@/components/contact/contact-actions";
import { InquiryForm } from "@/components/contact/inquiry-form";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { PageSection } from "@/components/layout/page-section";
import { Card, CardTitle } from "@/components/ui/card";
import { ClockIcon, MapPinIcon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { Ornament } from "@/components/ui/ornament";
import { SectionHeading } from "@/components/ui/section-heading";
import { getActiveServices, getPublicSiteSettings } from "@/lib/services/public-services";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with AZIZURRAHMAN for consultation inquiries, questions, or appointment scheduling.",
};

export default async function ContactPage() {
  const [siteSettings, services] = await Promise.all([
    getPublicSiteSettings(),
    getActiveServices(),
  ]);

  const serviceNames = services.map((s) => s.name);

  return (
    <>
      {/* Header */}
      <PageSection background="inverse" padding="md" className="border-b border-accent/30">
        <PageContainer>
          <Breadcrumbs items={[{ label: "Contact" }]} className="mb-4 text-ivory/70" />
          <SectionHeading
            kicker="Direct Communication"
            title="Get in Touch"
            description="Have questions about our guidance services or scheduling an appointment? Reach out through our direct communication channels."
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
                  We are available for genuine inquiries regarding spiritual guidance,
                  supplications, and appointment scheduling.
                </p>
              </div>

              {/* Verified Contact Actions */}
              <ContactActions
                whatsapp={siteSettings?.public_whatsapp}
                phone={siteSettings?.public_phone}
                email={siteSettings?.public_email}
                whatsappTemplate={siteSettings?.whatsapp_message_template}
                variant="vertical"
              />

              {/* Consultation Hours & Location */}
              <div className="grid gap-4 pt-4 sm:grid-cols-2">
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
                    <CardTitle className="text-base">Location</CardTitle>
                  </div>
                  <p className="text-xs leading-relaxed text-muted sm:text-sm">
                    {siteSettings?.public_address ||
                      "Consultations are conducted remotely or at designated private venues upon confirmation."}
                  </p>
                </Card>
              </div>

              {/* Distinguish Contact vs Booking */}
              <div className="space-y-3 rounded-card border border-border bg-surface-muted p-6">
                <h4 className="font-display text-lg font-semibold text-primary">
                  Important: Inquiries vs. Appointments
                </h4>
                <p className="text-xs leading-relaxed text-muted sm:text-sm">
                  Sending a direct message via WhatsApp or email allows you to ask questions, but
                  does not automatically reserve a consultation slot on the schedule.
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
                email={siteSettings?.public_email}
                serviceNames={serviceNames}
              />
            </div>
          </div>
        </PageContainer>
      </PageSection>
    </>
  );
}
