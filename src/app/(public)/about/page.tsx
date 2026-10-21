import type { Metadata } from "next";
import Link from "next/link";

import { ContactCTA } from "@/components/contact/contact-cta";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { PageSection } from "@/components/layout/page-section";
import { ScholarPortrait } from "@/components/scholar/scholar-portrait";
import { Alert } from "@/components/ui/alert";
import { Card, CardTitle } from "@/components/ui/card";
import { CalendarIcon, CheckIcon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { Ornament } from "@/components/ui/ornament";
import { SectionHeading } from "@/components/ui/section-heading";
import { scholarProfile } from "@/config/scholar-profile";
import { siteConfig } from "@/config/site";
import { getServerTranslations } from "@/i18n/server";
import { getPublicSiteSettings } from "@/lib/services/public-services";

export const metadata: Metadata = {
  title: `About ${scholarProfile.identity.fullNameEn}`,
  description:
    "Learn about Maulvi Azizurrahman (Aamil), offering dedicated Islamic spiritual guidance, consultation, and prayer grounded in the Qur'an and Sunnah.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: `About ${scholarProfile.identity.fullNameEn} · ${siteConfig.name}`,
    description:
      "Learn about Maulvi Azizurrahman (Aamil), offering dedicated Islamic spiritual guidance, consultation, and prayer grounded in the Qur'an and Sunnah.",
    url: "/about",
  },
};

export const instant = false;

export default async function AboutPage() {
  const [{ t, locale }, siteSettings] = await Promise.all([
    getServerTranslations(),
    getPublicSiteSettings(),
  ]);

  const isUr = locale === "ur";
  const scholarName = isUr
    ? scholarProfile.identity.fullNameUr
    : scholarProfile.identity.fullNameEn;
  const aboutIntro = isUr
    ? scholarProfile.content.ur.aboutIntro
    : scholarProfile.content.en.aboutIntro;
  const aboutParagraphs = isUr
    ? scholarProfile.content.ur.aboutParagraphs
    : scholarProfile.content.en.aboutParagraphs;
  const approachParagraphs = isUr
    ? [t.about.approachParagraph1, t.about.approachParagraph2]
    : scholarProfile.content.en.approachParagraphs;
  const concerns = isUr
    ? scholarProfile.content.ur.concernsAddressed
    : scholarProfile.content.en.concernsAddressed;
  const faithPerspective = isUr
    ? scholarProfile.content.ur.faithPerspective
    : scholarProfile.content.en.faithPerspective;
  const consultationNotice = isUr
    ? t.about.processNotice
    : scholarProfile.content.en.consultationNotice;

  return (
    <>
      {/* 1. Page Header */}
      <PageSection background="inverse" padding="md" className="border-b border-accent/30">
        <PageContainer>
          <Breadcrumbs
            homeLabel={t.navigation.home}
            items={[{ label: t.navigation.about }]}
            className="mb-4 text-ivory/70"
          />
          <SectionHeading
            kicker={t.about.headerKicker}
            title={t.about.headerTitle}
            description={`${scholarName} — ${aboutIntro}`}
            inverse
            align="center"
          />
        </PageContainer>
      </PageSection>

      {/* 2. Main Biography & Profile Section */}
      <PageSection background="default" padding="lg">
        <PageContainer>
          <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left: Sculptural Cutout Portrait on Moorish Arch */}
            <div className="lg:col-span-5">
              <ScholarPortrait variant="full" />
            </div>

            {/* Right: Open Editorial Biography & Guidance Philosophy */}
            <div className="space-y-8 text-start lg:col-span-7">
              {/* About Maulvi Azizurrahman */}
              <div className="space-y-4">
                <p className="text-xs font-semibold tracking-[0.2em] text-accent-strong uppercase sm:text-sm">
                  {t.about.bioKicker}
                </p>
                <h2 className="font-display text-3xl leading-tight font-semibold text-primary sm:text-4xl">
                  {t.about.bioHeading}
                </h2>
                <Ornament className="justify-start" />

                {aboutParagraphs.map((para, idx) => (
                  <p key={idx} className="text-base leading-relaxed text-foreground/90 sm:text-lg">
                    {para}
                  </p>
                ))}
              </div>

              {/* Approach to Spiritual Guidance */}
              <div className="space-y-4 pt-2">
                <div className="border-t border-border/60 pt-6">
                  <h3 className="font-display text-2xl font-semibold text-primary">
                    {t.about.approachHeading}
                  </h3>
                  <Ornament className="justify-start" />
                </div>

                {approachParagraphs.map((para, idx) => (
                  <p key={idx} className="text-sm leading-relaxed text-muted sm:text-base">
                    {para}
                  </p>
                ))}

                <div className="pt-2">
                  <p className="text-xs font-semibold tracking-wider text-primary uppercase">
                    {t.about.concernsHeading}
                  </p>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                    {concerns.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-white/70 p-3.5 text-xs font-medium text-foreground shadow-subtle sm:text-sm"
                      >
                        <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Faith, Perspective & Healing Statement */}
              <div className="rounded-r-xl border-l-3 border-accent bg-cream/35 p-6 shadow-subtle rtl:rounded-l-xl rtl:rounded-r-none rtl:border-r-3 rtl:border-l-0">
                <h4 className="font-display text-lg font-semibold text-primary">
                  {t.about.faithHeading}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85 italic sm:text-base">
                  &ldquo;{faithPerspective}&rdquo;
                </p>
              </div>

              {/* Official Profile Verification Note */}
              <Alert variant="info" title={t.about.verificationNoticeTitle}>
                {t.about.verificationNoticeBody}
              </Alert>

              {/* Ethical Consultation Principles */}
              <div className="space-y-4 pt-2">
                <h4 className="font-display text-xl font-semibold text-primary">
                  {t.about.philosophyHeading}
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card variant="muted" className="p-5 text-start">
                    <CardTitle className="text-lg">{t.about.noGuaranteesTitle}</CardTitle>
                    <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
                      {t.about.noGuaranteesDesc}
                    </p>
                  </Card>

                  <Card variant="muted" className="p-5 text-start">
                    <CardTitle className="text-lg">{t.about.dignityTitle}</CardTitle>
                    <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
                      {t.about.dignityDesc}
                    </p>
                  </Card>
                </div>
              </div>

              {/* Consultation Process & Distinction */}
              <div className="space-y-3 rounded-xl border border-border/80 bg-surface/80 p-6 shadow-subtle">
                <div className="flex items-center gap-2 text-primary">
                  <CalendarIcon className="size-5 text-accent-strong" />
                  <h4 className="font-display text-lg font-semibold">{t.about.processHeading}</h4>
                </div>
                <p className="text-xs leading-relaxed text-muted sm:text-sm">
                  {consultationNotice} {t.about.processDesc}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <LinkButton href="/book" variant="primary" size="sm">
                    {t.common.bookAppointment}
                  </LinkButton>
                  <Link
                    href="/appointments/lookup"
                    className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {t.about.checkStatus}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </PageSection>

      {/* 3. Official Contact CTA */}
      <PageSection background="muted" padding="lg">
        <PageContainer>
          <ContactCTA
            whatsapp={siteSettings?.public_whatsapp}
            phone={siteSettings?.public_phone}
            email={siteSettings?.public_email || scholarProfile.contact.email}
          />
        </PageContainer>
      </PageSection>
    </>
  );
}
