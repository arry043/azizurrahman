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
import { siteConfig } from "@/config/site";
import { getActiveServices, getPublicSiteSettings } from "@/lib/services/public-services";

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
                <span>Official Spiritual Guidance & Consultation</span>
              </div>

              <h1 className="font-display text-4xl leading-[1.1] font-semibold tracking-tight text-ivory sm:text-5xl lg:text-6xl">
                Calm, Ethical &amp; Dedicated Islamic Guidance
              </h1>

              <Ornament className="lg:justify-start" />

              <p className="mx-auto max-w-xl text-base leading-relaxed text-ivory/85 sm:text-lg lg:mx-0">
                Welcome to the official portal of {siteConfig.name}. Providing sincere spiritual
                consultation, Quranic reflection, and personalized guidance within a confidential,
                dignified environment.
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
              <div className="relative size-64 rounded-full border-2 border-accent/40 bg-surface/5 p-3 shadow-raised sm:size-80 sm:p-4 lg:size-96">
                <div className="relative size-full overflow-hidden rounded-full border border-accent/60 bg-cream/20">
                  <Image
                    src={siteConfig.logo.src}
                    alt={siteConfig.logo.alt}
                    width={siteConfig.logo.width}
                    height={siteConfig.logo.height}
                    priority
                    sizes="(min-width: 1024px) 24rem, (min-width: 640px) 20rem, 16rem"
                    className="size-full object-cover"
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
              <CardTitle className="text-xl">Confidential & Dignified</CardTitle>
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

      {/* 4. About Preview Section */}
      <PageSection background="default" padding="lg">
        <PageContainer>
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="flex justify-center lg:col-span-5">
              <div className="w-full max-w-sm rounded-card border border-border bg-surface-muted p-6 text-center shadow-subtle">
                <div className="relative mx-auto size-40 overflow-hidden rounded-full border-2 border-accent/50 bg-white sm:size-48">
                  <Image
                    src={siteConfig.logo.src}
                    alt={siteConfig.name}
                    width={200}
                    height={200}
                    className="size-full object-cover"
                  />
                </div>
                <h3 className="mt-4 font-display text-2xl font-semibold text-primary">
                  {siteConfig.name}
                </h3>
                <p className="mt-1 text-xs tracking-wider text-accent-strong uppercase">
                  Spiritual Advisor & Consultant
                </p>
                <Ornament className="mt-3 justify-center" />
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Dedicated to ethical guidance, Quranic reflection, and family counsel.
                </p>
              </div>
            </div>

            <div className="space-y-5 lg:col-span-7">
              <p className="text-xs font-semibold tracking-[0.2em] text-accent-strong uppercase sm:text-sm">
                About the Consultant
              </p>
              <h2 className="font-display text-3xl leading-tight font-semibold text-primary sm:text-4xl">
                Dedicated to Sincere &amp; Ethical Consultation
              </h2>
              <Ornament className="justify-start" />
              <p className="text-base leading-relaxed text-muted sm:text-lg">
                {siteConfig.name} offers one-on-one consultations designed to bring clarity, peace
                of mind, and spiritual guidance to individuals facing personal dilemmas, family
                decisions, or seeking deeper ethical reflection.
              </p>
              <p className="text-sm leading-relaxed text-muted">
                Consultations are carried out with empathy and without false promises or guarantees.
                We believe in providing thoughtful, scripture-informed counsel that honors the
                dignity of every visitor.
              </p>
              <div className="pt-2">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  <span>Learn more about our background &amp; philosophy</span>
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
            email={siteSettings?.public_email}
          />
        </PageContainer>
      </PageSection>
    </>
  );
}
