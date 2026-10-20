import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { PageSection } from "@/components/layout/page-section";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ClockIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { Ornament } from "@/components/ui/ornament";
import { siteConfig } from "@/config/site";
import { getActiveServiceBySlug, getPublicSiteSettings } from "@/lib/services/public-services";

interface ServiceDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getActiveServiceBySlug(slug);

  if (!service) {
    return {
      title: "Service Not Found",
    };
  }

  return {
    title: service.name,
    description:
      service.short_description ||
      `Consultation details for ${service.name} with ${siteConfig.name}.`,
  };
}

export const instant = false;

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = await params;
  const [service, siteSettings] = await Promise.all([
    getActiveServiceBySlug(slug),
    getPublicSiteSettings(),
  ]);

  if (!service) {
    notFound();
  }

  const bookUrl = `/book?service=${service.slug}`;

  return (
    <>
      {/* Header with Breadcrumbs */}
      <PageSection background="inverse" padding="sm" className="border-b border-accent/30">
        <PageContainer>
          <Breadcrumbs
            items={[{ label: "Services", href: "/services" }, { label: service.name }]}
            className="text-ivory/70"
          />
        </PageContainer>
      </PageSection>

      {/* Main Service Content */}
      <PageSection background="default" padding="lg">
        <PageContainer>
          <div className="mb-8">
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-focus"
            >
              <ChevronLeftIcon className="size-4" />
              <span>Back to all services</span>
            </Link>
          </div>

          <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Left Content Area */}
            <div className="space-y-8 lg:col-span-8">
              {/* Optional Service Image */}
              {service.image_url && (
                <div className="relative aspect-16/9 w-full overflow-hidden rounded-card border border-border shadow-subtle">
                  <Image
                    src={service.image_url}
                    alt={service.name}
                    fill
                    sizes="(min-width: 1024px) 66vw, 100vw"
                    className="object-cover"
                  />
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-accent-strong uppercase sm:text-sm">
                  Consultation Details
                </p>
                <h1 className="font-display text-3xl leading-tight font-semibold text-primary sm:text-4xl lg:text-5xl">
                  {service.name}
                </h1>
                <Ornament className="mt-4 justify-start" />
              </div>

              {service.short_description && (
                <p className="border-l-3 border-accent py-1 pl-4 text-lg leading-relaxed font-medium text-foreground/90 sm:text-xl">
                  {service.short_description}
                </p>
              )}

              <div className="prose max-w-none space-y-4 text-base leading-relaxed text-foreground/80">
                {service.description ? (
                  <p className="whitespace-pre-line">{service.description}</p>
                ) : (
                  <p>
                    This consultation provides dedicated time with {siteConfig.name} to explore
                    personal guidance, supplications, and ethical Quranic advice in accordance with
                    traditional Islamic values.
                  </p>
                )}
              </div>

              {/* What to expect during the session */}
              <div className="space-y-4 rounded-card border border-border bg-surface-muted p-6 sm:p-8">
                <h3 className="font-display text-xl font-semibold text-primary sm:text-2xl">
                  What to Expect from this Session
                </h3>
                <ul className="space-y-3 text-sm text-muted sm:text-base">
                  <li className="flex items-start gap-3">
                    <SparklesIcon className="mt-0.5 size-5 shrink-0 text-accent-strong" />
                    <span>Attentive, unhurried listening focused entirely on your situation.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-emerald" />
                    <span>Complete personal confidentiality and privacy.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CalendarIcon className="mt-0.5 size-5 shrink-0 text-primary" />
                    <span>
                      Scheduled in advance so there are no delays or overlapping sessions.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Sticky Sidebar / Booking Action Card */}
            <div className="space-y-6 lg:sticky lg:top-28 lg:col-span-4">
              <Card variant="elevated" className="space-y-6 border-accent/40 p-6 sm:p-7">
                <div>
                  <CardTitle className="text-xl">Book this Guidance</CardTitle>
                  <p className="mt-1 text-xs text-muted">
                    Request an appointment slot online with no account needed.
                  </p>
                </div>

                <div className="space-y-3 border-y border-border/70 py-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Estimated Duration</span>
                    <Badge
                      variant="neutral"
                      size="sm"
                      icon={<ClockIcon className="size-3 text-primary" />}
                    >
                      {service.duration_minutes > 0
                        ? `${service.duration_minutes} minutes`
                        : "Variable"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Format</span>
                    <span className="font-medium text-foreground">One-on-one consultation</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Setting</span>
                    <span className="font-medium text-foreground">Private &amp; Confidential</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <LinkButton href={bookUrl} variant="primary" size="lg" className="w-full">
                    Request Appointment Slot
                  </LinkButton>
                  <LinkButton href="/contact" variant="secondary" size="md" className="w-full">
                    Ask a Question First
                  </LinkButton>
                </div>

                <p className="text-center text-xs leading-relaxed text-muted">
                  Submitting a request reserves your desired time. Our administrator will confirm
                  your appointment details.
                </p>
              </Card>

              {/* Direct Inquiry Help */}
              {siteSettings?.public_whatsapp && (
                <div className="rounded-card border border-emerald/30 bg-emerald/5 p-5 text-center text-sm">
                  <p className="font-medium text-emerald">Need immediate assistance?</p>
                  <p className="mt-1 text-xs text-muted">
                    Message us directly on WhatsApp for general questions.
                  </p>
                  <div className="mt-3">
                    <Link
                      href={`https://wa.me/${siteSettings.public_whatsapp.replace(/^\+/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald underline-offset-4 hover:underline"
                    >
                      <span>Open WhatsApp</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </PageContainer>
      </PageSection>
    </>
  );
}
