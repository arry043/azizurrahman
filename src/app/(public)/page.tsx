import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ContactCTA } from "@/components/contact/contact-cta";
import { PageContainer } from "@/components/layout/page-container";
import { PageSection } from "@/components/layout/page-section";
import { ScholarPortrait } from "@/components/scholar/scholar-portrait";
import { ServiceGrid } from "@/components/services/service-grid";
import { Card, CardTitle } from "@/components/ui/card";
import {
  CalendarIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserIcon,
} from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { Ornament } from "@/components/ui/ornament";
import { SectionHeading } from "@/components/ui/section-heading";
import { scholarProfile } from "@/config/scholar-profile";
import { siteConfig } from "@/config/site";
import { getServerTranslations } from "@/i18n/server";
import { getActiveServices, getPublicSiteSettings } from "@/lib/services/public-services";

export const metadata: Metadata = {
  title: `${scholarProfile.identity.fullNameEn} — Ethical Islamic Guidance & Consultation`,
  description:
    "Official website of Maulvi Azizurrahman (Aamil). Sincere spiritual counsel, prayer, and guidance grounded in Qur'an and Sunnah.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${scholarProfile.identity.fullNameEn} — Ethical Islamic Guidance & Consultation`,
    description:
      "Official website of Maulvi Azizurrahman (Aamil). Sincere spiritual counsel, prayer, and guidance grounded in Qur'an and Sunnah.",
    url: "/",
  },
};

export const instant = false;

export default async function HomePage() {
  const [{ t, locale }, services, siteSettings] = await Promise.all([
    getServerTranslations(),
    getActiveServices(),
    getPublicSiteSettings(),
  ]);

  const isUr = locale === "ur";
  const scholarBio = isUr ? scholarProfile.content.ur.shortBio : scholarProfile.content.en.shortBio;

  const featuredServices = services.slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteConfig.name}-website`,
        name: siteConfig.name,
        description: siteConfig.description,
        inLanguage: locale,
      },
      {
        "@type": "Person",
        "@id": `${siteConfig.name}-scholar`,
        name: scholarProfile.identity.fullNameEn,
        honorificPrefix: scholarProfile.identity.honorificEn,
        jobTitle: scholarProfile.identity.titleEn,
        description: scholarProfile.content.en.shortBio,
        alumniOf: {
          "@type": "EducationalOrganization",
          name: scholarProfile.education.institution,
          address: {
            "@type": "PostalAddress",
            addressLocality: scholarProfile.education.location,
            addressCountry: "IN",
          },
        },
        address: {
          "@type": "PostalAddress",
          streetAddress: `${scholarProfile.contact.address.village}, ${scholarProfile.contact.address.town}`,
          addressLocality: scholarProfile.contact.address.district,
          addressRegion: scholarProfile.contact.address.state,
          postalCode: scholarProfile.contact.address.pincode,
          addressCountry: "IN",
        },
        email: scholarProfile.contact.email,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-surface-inverse py-16 text-foreground-inverse sm:py-24 lg:py-32">
        {/* Ambient background glow & subtle Islamic pattern */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute end-0 -top-40 size-[500px] rounded-full bg-accent/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute start-0 -bottom-32 size-[450px] rounded-full bg-primary-hover/20 blur-3xl"
        />

        <PageContainer>
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Text & CTAs Column */}
            <div className="space-y-6 text-center lg:col-span-7 lg:text-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-white/5 px-3.5 py-1 text-xs font-medium tracking-wide text-accent sm:text-sm">
                <SparklesIcon className="size-4" />
                <span>{t.home.heroKicker}</span>
              </div>

              <h1 className="font-display text-4xl leading-[1.15] font-semibold tracking-tight text-ivory sm:text-5xl lg:text-6xl">
                {t.home.heroTitle}
              </h1>

              <Ornament className="lg:justify-start" />

              <p className="mx-auto max-w-xl text-base leading-relaxed text-ivory/85 sm:text-lg lg:mx-0">
                {t.home.heroIntro}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2 lg:justify-start">
                <LinkButton href="/book" variant="primary" size="lg">
                  {t.common.bookAnAppointment}
                </LinkButton>
                <LinkButton
                  href="/services"
                  variant="secondary"
                  size="lg"
                  className="border-accent text-accent hover:bg-accent/10"
                >
                  {t.common.exploreServices}
                </LinkButton>
              </div>

              <p className="pt-2 text-xs text-ivory/60">{t.home.heroAdvanceNotice}</p>
            </div>

            {/* Visual Emblem Column */}
            <div className="flex justify-center lg:col-span-5 lg:justify-end">
              <div className="relative flex items-center justify-center">
                {/* Soft Ambient Radiance behind Emblem */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute size-56 rounded-full bg-accent/25 blur-3xl sm:size-72 lg:size-80"
                />
                <div className="relative size-56 overflow-hidden rounded-full border border-accent/40 bg-cream/15 p-2 shadow-raised backdrop-blur-xs sm:size-72 lg:size-88">
                  <Image
                    src={siteConfig.logo.src}
                    alt={siteConfig.logo.alt}
                    width={siteConfig.logo.width}
                    height={siteConfig.logo.height}
                    priority
                    sizes="(min-width: 1024px) 22rem, (min-width: 640px) 18rem, 14rem"
                    className="size-full rounded-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* 2. Core Principles / Trust Framework */}
      <PageSection background="default" padding="lg">
        <PageContainer>
          <SectionHeading
            kicker={t.home.principlesKicker}
            title={t.home.principlesTitle}
            description={t.home.principlesDescription}
          />

          <div className="mt-12 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            <Card variant="elevated" className="p-8 text-center">
              <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-emerald/10 text-emerald">
                <ShieldCheckIcon className="size-6" />
              </div>
              <CardTitle className="text-xl">{t.home.principle1Title}</CardTitle>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {t.home.principle1Description}
              </p>
            </Card>

            <Card variant="elevated" className="p-8 text-center">
              <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent-strong">
                <UserIcon className="size-6" />
              </div>
              <CardTitle className="text-xl">{t.home.principle2Title}</CardTitle>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {t.home.principle2Description}
              </p>
            </Card>

            <Card variant="elevated" className="p-8 text-center">
              <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-emerald/10 text-emerald">
                <CalendarIcon className="size-6" />
              </div>
              <CardTitle className="text-xl">{t.home.principle3Title}</CardTitle>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {t.home.principle3Description}
              </p>
            </Card>
          </div>
        </PageContainer>
      </PageSection>

      {/* 3. Services Highlight */}
      <PageSection background="muted" padding="lg">
        <PageContainer>
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-accent-strong uppercase sm:text-sm">
                {t.home.servicesKicker}
              </p>
              <h2 className="font-display text-3xl font-semibold text-primary sm:text-4xl lg:text-5xl">
                {t.home.servicesTitle}
              </h2>
            </div>
            <LinkButton href="/services" variant="secondary" size="md">
              {t.home.viewAllServices}
            </LinkButton>
          </div>

          {featuredServices.length > 0 ? (
            <ServiceGrid services={featuredServices} />
          ) : (
            <div className="rounded-card border border-border bg-surface p-8 text-center sm:p-12">
              <p className="text-base text-muted">{t.home.emptyServicesTitle}</p>
              <div className="mt-4">
                <LinkButton href="/contact" variant="primary" size="md">
                  {t.home.emptyServicesContact}
                </LinkButton>
              </div>
            </div>
          )}
        </PageContainer>
      </PageSection>

      {/* 4. Scholar Introduction Section */}
      <PageSection background="default" padding="lg" id="scholar-profile">
        <PageContainer>
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
            {/* Scholar Portrait */}
            <div className="flex justify-center lg:col-span-5">
              <ScholarPortrait variant="compact" showActions={false} />
            </div>

            {/* Concise Scholar Introduction Content */}
            <div className="space-y-5 text-start lg:col-span-7">
              <p className="text-xs font-semibold tracking-[0.2em] text-accent-strong uppercase sm:text-sm">
                {t.home.scholarKicker}
              </p>
              <h2 className="font-display text-3xl leading-tight font-semibold text-primary sm:text-4xl">
                {t.home.scholarHeading}
              </h2>
              <Ornament className="justify-start" />
              <p className="text-base leading-relaxed text-foreground/90 sm:text-lg">
                {scholarBio}
              </p>
              <p className="text-sm leading-relaxed text-muted">{t.home.scholarDignity}</p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <LinkButton href="/book" variant="primary" size="md">
                  {t.common.bookAnAppointment}
                </LinkButton>
                <LinkButton href="/contact" variant="secondary" size="md">
                  {t.navigation.contact}
                </LinkButton>
              </div>

              <div className="pt-2">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  <span>{t.home.scholarLearnMore}</span>
                  <ChevronRightIcon className="size-4 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </PageContainer>
      </PageSection>

      {/* 5. Consultation CTA Banner */}
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
