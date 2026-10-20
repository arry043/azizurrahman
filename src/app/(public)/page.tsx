import Image from "next/image";
import Link from "next/link";

import { ContactCTA } from "@/components/contact/contact-cta";
import { PageContainer } from "@/components/layout/page-container";
import { PageSection } from "@/components/layout/page-section";
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
import { ScholarPortrait } from "@/components/scholar/scholar-portrait";
import { scholarProfile } from "@/config/scholar-profile";
import { siteConfig } from "@/config/site";
import { getActiveServices, getPublicSiteSettings } from "@/lib/services/public-services";

export const instant = false;

export default async function HomePage() {
  const [services, siteSettings] = await Promise.all([
    getActiveServices(),
    getPublicSiteSettings(),
  ]);

  const featuredServices = services.slice(0, 3);

  return (
    <>
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-surface-inverse py-16 text-foreground-inverse sm:py-24 lg:py-32">
        {/* Ambient background glow & subtle Islamic pattern */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 right-0 size-[500px] rounded-full bg-accent/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 left-0 size-[450px] rounded-full bg-primary-hover/20 blur-3xl"
        />

        <PageContainer>
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Text & CTAs Column */}
            <div className="space-y-6 text-center lg:col-span-7 lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-white/5 px-3.5 py-1 text-xs font-medium tracking-wide text-accent sm:text-sm">
                <SparklesIcon className="size-4" />
                <span>Official Spiritual Guidance &amp; Consultation</span>
              </div>

              <h1 className="font-display text-4xl leading-[1.1] font-semibold tracking-tight text-ivory sm:text-5xl lg:text-6xl">
                Calm, Ethical &amp; Dedicated Islamic Guidance
              </h1>

              <Ornament className="lg:justify-start" />

              <p className="mx-auto max-w-xl text-base leading-relaxed text-ivory/85 sm:text-lg lg:mx-0">
                Welcome to the official portal of {siteConfig.name} —{" "}
                <span className="font-medium text-ivory">{scholarProfile.identity.fullNameEn}</span>
                . Providing sincere spiritual consultation, Quranic reflection, and personalized
                guidance within a confidential, dignified environment.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2 lg:justify-start">
                <LinkButton href="/book" variant="primary" size="lg">
                  Book an Appointment
                </LinkButton>
                <LinkButton
                  href="/services"
                  variant="secondary"
                  size="lg"
                  className="border-accent text-accent hover:bg-accent/10"
                >
                  Explore Services
                </LinkButton>
              </div>

              <p className="pt-2 text-xs text-ivory/60">
                Consultations are arranged in advance. No public account required to book.
              </p>
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
            kicker="Our Foundations"
            title="Principles of Guidance"
            description="Our consultations are structured around core ethical principles to support your spiritual well-being."
          />

          <div className="mt-12 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            <Card variant="elevated" className="p-8 text-center">
              <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-emerald/10 text-emerald">
                <ShieldCheckIcon className="size-6" />
              </div>
              <CardTitle className="text-xl">Confidential &amp; Dignified</CardTitle>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Every consultation is conducted in complete privacy. Your personal concerns, family
                matters, and inquiries are held in strict confidence.
              </p>
            </Card>

            <Card variant="elevated" className="p-8 text-center">
              <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent-strong">
                <UserIcon className="size-6" />
              </div>
              <CardTitle className="text-xl">Personalized Attention</CardTitle>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Dedicated time slots ensure unhurried, focused dialogue tailored to your unique
                circumstances and spiritual questions.
              </p>
            </Card>

            <Card variant="elevated" className="p-8 text-center">
              <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-emerald/10 text-emerald">
                <CalendarIcon className="size-6" />
              </div>
              <CardTitle className="text-xl">Structured Appointments</CardTitle>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Transparent scheduling without queues or uncertainty. Easily request a date and time
                that suits your personal routine.
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
                Consultation Catalogue
              </p>
              <h2 className="font-display text-3xl font-semibold text-primary sm:text-4xl lg:text-5xl">
                Featured Guidance Services
              </h2>
            </div>
            <LinkButton href="/services" variant="secondary" size="md">
              View All Services
            </LinkButton>
          </div>

          {featuredServices.length > 0 ? (
            <ServiceGrid services={featuredServices} />
          ) : (
            <div className="rounded-card border border-border bg-surface p-8 text-center sm:p-12">
              <p className="text-base text-muted">
                Service catalogue is currently being prepared with approved descriptions.
              </p>
              <div className="mt-4">
                <LinkButton href="/contact" variant="primary" size="md">
                  Contact for Inquiries
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
            {/* Scholar Portrait (Aesthetic Cutout with Moorish Arch) */}
            <div className="flex justify-center lg:col-span-5">
              <ScholarPortrait variant="compact" showActions={false} />
            </div>

            {/* Concise Scholar Introduction Content */}
            <div className="space-y-5 lg:col-span-7">
              <p className="text-xs font-semibold tracking-[0.2em] text-accent-strong uppercase sm:text-sm">
                Scholar Profile &amp; Practice
              </p>
              <h2 className="font-display text-3xl leading-tight font-semibold text-primary sm:text-4xl">
                Dedicated to Sincere &amp; Ethical Islamic Guidance
              </h2>
              <Ornament className="justify-start" />
              <p className="text-base leading-relaxed text-foreground/90 sm:text-lg">
                {scholarProfile.content.en.shortBio}
              </p>
              <p className="text-sm leading-relaxed text-muted">
                Consultations are conducted in an atmosphere of respect and dignity, without
                unsupported claims or false guarantees. In accordance with faith, healing and
                outcomes are recognized as being solely in the hands of Allah (SWT).
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <LinkButton href="/book" variant="primary" size="md">
                  Book an Appointment
                </LinkButton>
                <LinkButton href="/contact" variant="secondary" size="md">
                  Contact / Inquiries
                </LinkButton>
              </div>

              <div className="pt-2">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  <span>Learn more about background, education &amp; consultation approach</span>
                  <ChevronRightIcon className="size-4" />
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
