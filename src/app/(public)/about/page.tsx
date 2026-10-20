import type { Metadata } from "next";
import Image from "next/image";

import { ContactCTA } from "@/components/contact/contact-cta";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { PageSection } from "@/components/layout/page-section";
import { Alert } from "@/components/ui/alert";
import { Card, CardTitle } from "@/components/ui/card";
import { ShieldCheckIcon, SparklesIcon, UserIcon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { Ornament } from "@/components/ui/ornament";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/config/site";
import { getPublicSiteSettings } from "@/lib/services/public-services";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about AZIZURRAHMAN, offering dedicated Islamic spiritual guidance, consultation, and ethical counsel.",
};

export default async function AboutPage() {
  const siteSettings = await getPublicSiteSettings();

  return (
    <>
      {/* Page Header */}
      <PageSection background="inverse" padding="md" className="border-b border-accent/30">
        <PageContainer>
          <Breadcrumbs items={[{ label: "About" }]} className="mb-4 text-ivory/70" />
          <SectionHeading
            kicker="Consultant Biography"
            title={`About ${siteConfig.name}`}
            description="Dedicated to ethical spiritual reflection, family counsel, and personal consultation grounded in Islamic values."
            inverse
            align="center"
          />
        </PageContainer>
      </PageSection>

      {/* Main Biography Section */}
      <PageSection background="default" padding="lg">
        <PageContainer>
          <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Portrait & Profile Card */}
            <div className="lg:col-span-5">
              <div className="rounded-card border border-border bg-surface p-6 text-center shadow-card sm:p-8">
                <div className="relative mx-auto size-48 overflow-hidden rounded-full border-2 border-accent/60 bg-cream/30 shadow-subtle sm:size-56">
                  <Image
                    src={siteConfig.logo.src}
                    alt={siteConfig.name}
                    width={240}
                    height={240}
                    className="size-full object-cover"
                  />
                </div>

                <h3 className="mt-6 font-display text-2xl font-semibold text-primary sm:text-3xl">
                  {siteConfig.name}
                </h3>
                <p className="mt-1 text-xs font-medium tracking-wider text-accent-strong uppercase sm:text-sm">
                  Spiritual Guide &amp; Consultant
                </p>

                <Ornament className="mt-4 justify-center" />

                <div className="mt-6 space-y-3 border-t border-border/70 pt-6 text-left text-sm">
                  <div className="flex items-start gap-3">
                    <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-emerald" />
                    <span className="text-muted">
                      Strict confidentiality and respectful privacy
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <SparklesIcon className="mt-0.5 size-5 shrink-0 text-accent-strong" />
                    <span className="text-muted">Sincere, scripture-informed counsel</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <UserIcon className="mt-0.5 size-5 shrink-0 text-emerald" />
                    <span className="text-muted">One-on-one personalized consultations</span>
                  </div>
                </div>

                <div className="mt-8">
                  <LinkButton href="/book" variant="primary" size="md" className="w-full">
                    Request an Appointment
                  </LinkButton>
                </div>
              </div>
            </div>

            {/* Biography & Mission Copy */}
            <div className="space-y-6 lg:col-span-7">
              <div className="space-y-4">
                <h3 className="font-display text-2xl leading-tight font-semibold text-primary sm:text-3xl">
                  A Mission of Sincerity &amp; Compassion
                </h3>
                <Ornament className="justify-start" />
                <p className="text-base leading-relaxed text-foreground/90 sm:text-lg">
                  In times of personal difficulty, life decisions, or spiritual uncertainty, having
                  an unhurried space for thoughtful, faith-informed consultation can provide peace
                  and direction.
                </p>
                <p className="text-base leading-relaxed text-muted">
                  {siteConfig.name} has devoted his practice to assisting individuals and families
                  through attentive listening, prayers (duas), and principled advice rooted in
                  Islamic teachings. Each consultation is conducted with genuine care for the
                  spiritual well-being of the seeker.
                </p>
              </div>

              {/* Status Note Regarding Formal Qualifications */}
              <Alert variant="info" title="Official Profile Verification">
                Formal religious degrees, specific academic credentials, and approved multilingual
                biographical details are being compiled for final client sign-off in accordance with
                our strict transparency policy. No unverified titles or fabricated claims are
                published on this official portal.
              </Alert>

              {/* Approach & Philosophy */}
              <div className="space-y-4 pt-4">
                <h4 className="font-display text-xl font-semibold text-primary">
                  Our Consultation Philosophy
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card variant="muted" className="p-5">
                    <CardTitle className="text-lg">No False Guarantees</CardTitle>
                    <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
                      We strictly reject commercialized supernatural guarantees or miraculous cures.
                      Guidance is advisory, spiritual, and grounded in authentic faith and
                      supplication.
                    </p>
                  </Card>

                  <Card variant="muted" className="p-5">
                    <CardTitle className="text-lg">Dignity &amp; Compassion</CardTitle>
                    <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
                      Every seeker is welcomed without judgment, irrespective of background,
                      ensuring a respectful, supportive, and serene setting.
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </PageSection>

      {/* Consultation CTA Banner */}
      <PageSection background="muted" padding="lg">
        <PageContainer>
          <ContactCTA
            whatsapp={siteSettings?.public_whatsapp}
            phone={siteSettings?.public_phone}
            email={siteSettings?.public_email}
          />
        </PageContainer>
      </PageSection>
    </>
  );
}
