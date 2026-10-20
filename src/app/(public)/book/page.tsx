import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { BookingForm } from "@/components/booking/booking-form";
import { buildWhatsAppUrl } from "@/components/contact/contact-actions";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { PageSection } from "@/components/layout/page-section";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { CalendarIcon, CheckIcon, ClockIcon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { Ornament } from "@/components/ui/ornament";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/config/site";
import { getActiveServices, getPublicSiteSettings } from "@/lib/services/public-services";
import type { PublicService } from "@/types/domain";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description:
    "Request a spiritual consultation appointment with AZIZURRAHMAN. Simple, guest-friendly booking with no public account needed.",
};

export const instant = false;

interface BookPageProps {
  searchParams?: Promise<{ service?: string }>;
}

async function BookingFormContainer({
  searchParams,
  services,
}: {
  searchParams?: Promise<{ service?: string }>;
  services: PublicService[];
}) {
  const resolved = searchParams ? await searchParams : {};
  const preselectedSlug = resolved?.service;
  return <BookingForm services={services} preselectedServiceSlug={preselectedSlug} />;
}

export async function SelectedServiceCallout({
  searchParams,
  services,
}: {
  searchParams?: Promise<{ service?: string }>;
  services: PublicService[];
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedServiceSlug = resolvedSearchParams?.service;
  if (!selectedServiceSlug) return null;

  const preselectedService = services.find((s) => s.slug === selectedServiceSlug);
  if (!preselectedService) return null;

  return (
    <div className="rounded-card border-2 border-accent/50 bg-cream/40 p-6 shadow-subtle">
      <div className="flex items-center gap-2 text-xs font-semibold text-accent-strong uppercase">
        <CheckIcon className="size-4" />
        <span>Selected Consultation Service</span>
      </div>
      <h4 className="mt-2 font-display text-2xl font-semibold text-primary">
        {preselectedService.name}
      </h4>
      {preselectedService.short_description && (
        <p className="mt-1 text-sm text-muted">{preselectedService.short_description}</p>
      )}
      {preselectedService.duration_minutes > 0 && (
        <div className="mt-3">
          <Badge variant="neutral" size="sm">
            Estimated Duration: {preselectedService.duration_minutes} mins
          </Badge>
        </div>
      )}
    </div>
  );
}

export default async function BookAppointmentPage({ searchParams }: BookPageProps) {
  const [services, siteSettings] = await Promise.all([
    getActiveServices(),
    getPublicSiteSettings(),
  ]);

  return (
    <>
      {/* Header */}
      <PageSection background="inverse" padding="md" className="border-b border-accent/30">
        <PageContainer>
          <Breadcrumbs items={[{ label: "Book Appointment" }]} className="mb-4 text-ivory/70" />
          <SectionHeading
            kicker="Appointment System"
            title="Request a Consultation"
            description="Our consultation requests are designed to be respectful, private, and straightforward. No account creation required."
            inverse
            align="center"
          />
        </PageContainer>
      </PageSection>

      {/* Main Content */}
      <PageSection background="default" padding="lg">
        <PageContainer>
          {/* Booking Process Steps */}
          <div className="mb-14">
            <h3 className="mb-8 text-center font-display text-2xl font-semibold text-primary">
              How the Consultation Booking Process Works
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <Card variant="muted" className="relative p-6">
                <div className="mb-4 flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  1
                </div>
                <CardTitle className="text-base sm:text-lg">Select Service</CardTitle>
                <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
                  Choose the spiritual consultation category that best reflects your situation.
                </p>
              </Card>

              <Card variant="muted" className="relative p-6">
                <div className="mb-4 flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  2
                </div>
                <CardTitle className="text-base sm:text-lg">Pick Date &amp; Time</CardTitle>
                <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
                  Choose an available consultation slot aligned with the weekly working schedule.
                </p>
              </Card>

              <Card variant="muted" className="relative p-6">
                <div className="mb-4 flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  3
                </div>
                <CardTitle className="text-base sm:text-lg">Provide Contact Info</CardTitle>
                <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
                  Submit your name and phone number so the provider can reach you directly.
                </p>
              </Card>

              <Card variant="muted" className="relative p-6">
                <div className="mb-4 flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  4
                </div>
                <CardTitle className="text-base sm:text-lg">Slot Confirmation</CardTitle>
                <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
                  Your request is reviewed and confirmed, reserving your dedicated consultation
                  time.
                </p>
              </Card>
            </div>
          </div>

          {/* Interactive Guest Booking Engine */}
          <div className="mb-14">
            <Suspense
              fallback={
                <div className="min-h-[400px] animate-pulse rounded-card bg-surface-muted/50 p-8 text-center text-muted">
                  Loading consultation booking system...
                </div>
              }
            >
              <BookingFormContainer searchParams={searchParams} services={services} />
            </Suspense>
          </div>

          {/* Engine Engineering Notice & Interim Direct Contact */}
          <div className="mx-auto max-w-3xl space-y-8">
            <Alert
              variant="info"
              title="Automated Calendar Engine in Active Development"
              icon={<ClockIcon className="size-5 text-primary" />}
            >
              The real-time interactive calendar engine (Phases 5 &amp; 6) is currently being
              connected to the provider’s weekly working schedule. In the meantime, you may explore
              the available services below and reach out directly through our verified contact
              channels to schedule your appointment.
            </Alert>

            {/* Selected Service Callout if redirected from service detail */}
            <Suspense fallback={null}>
              <SelectedServiceCallout searchParams={searchParams} services={services} />
            </Suspense>

            {/* Direct Contact Options */}
            <Card variant="elevated" className="space-y-6 p-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald/10 text-emerald">
                <CalendarIcon className="size-7" />
              </div>

              <div className="space-y-2">
                <CardTitle className="text-2xl sm:text-3xl">
                  Schedule Directly with {siteConfig.name}
                </CardTitle>
                <Ornament className="justify-center" />
                <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted sm:text-base">
                  To request a consultation today, please contact us directly. Mention the service
                  you are interested in and your preferred days or times.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <LinkButton href="/contact" variant="primary" size="lg">
                  View Contact Channels
                </LinkButton>
                <LinkButton href="/services" variant="secondary" size="lg">
                  Browse All Services
                </LinkButton>
              </div>

              {siteSettings?.public_whatsapp &&
                buildWhatsAppUrl(
                  siteSettings.public_whatsapp,
                  siteSettings.whatsapp_message_template,
                ) && (
                  <div className="border-t border-border/70 pt-4 text-xs text-muted">
                    <span>Fastest response: </span>
                    <a
                      href={buildWhatsAppUrl(
                        siteSettings.public_whatsapp,
                        siteSettings.whatsapp_message_template,
                      )!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-emerald underline-offset-4 hover:underline"
                    >
                      Direct WhatsApp Message
                    </a>
                  </div>
                )}
            </Card>

            {/* Available Services Summary */}
            {services.length > 0 && (
              <div className="space-y-4 pt-4">
                <h4 className="font-display text-xl font-semibold text-primary">
                  Available Guidance Services
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.map((srv) => (
                    <div
                      key={srv.id}
                      className="flex items-center justify-between rounded-control border border-border bg-surface p-4"
                    >
                      <div>
                        <h5 className="text-sm font-medium text-foreground">{srv.name}</h5>
                        {srv.duration_minutes > 0 && (
                          <span className="text-xs text-muted">{srv.duration_minutes} minutes</span>
                        )}
                      </div>
                      <Link
                        href={`/services/${srv.slug}`}
                        className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        Details →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PageContainer>
      </PageSection>
    </>
  );
}
