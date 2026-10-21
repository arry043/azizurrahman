import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrandMark } from "@/components/layout/brand-mark";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { PageSection } from "@/components/layout/page-section";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { Ornament } from "@/components/ui/ornament";
import { PrintButton } from "@/components/ui/print-button";
import { scholarProfile } from "@/config/scholar-profile";
import { getServerTranslations } from "@/i18n/server";
import { getPublicReceiptByReference } from "@/lib/lookup/lookup-service";

interface ReceiptPageProps {
  params: Promise<{ ref: string }>;
}

export const metadata: Metadata = {
  title: "Appointment Receipt",
  description: "Official consultation request receipt for AZIZURRAHMAN.",
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

export default async function AppointmentReceiptPage({ params }: ReceiptPageProps) {
  const { ref } = await params;
  const [{ t, locale }, receipt] = await Promise.all([
    getServerTranslations(),
    getPublicReceiptByReference(ref),
  ]);

  if (!receipt) {
    notFound();
  }

  const isUr = locale === "ur";
  const isPending = receipt.status === "pending";
  const isConfirmed = receipt.status === "confirmed";
  const isCancelled = receipt.status === "cancelled";
  const isDeclined = receipt.status === "declined";

  const statusVariant = isConfirmed ? "success" : isPending ? "warning" : "error";
  const statusLabel = isConfirmed
    ? t.receipt.confirmedAlertTitle
    : isPending
      ? t.receipt.pendingAlertTitle
      : isCancelled
        ? t.lookup.statusCancelled
        : isDeclined
          ? t.lookup.statusDeclined
          : receipt.status;

  const formattedDate = new Date(receipt.appointment_start).toLocaleDateString(
    isUr ? "ur-PK" : "en-US",
    {
      timeZone: receipt.timezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const startTimeFormatted = new Date(receipt.appointment_start).toLocaleTimeString(
    isUr ? "ur-PK" : "en-US",
    {
      timeZone: receipt.timezone,
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  const endTimeFormatted = new Date(receipt.appointment_end).toLocaleTimeString(
    isUr ? "ur-PK" : "en-US",
    {
      timeZone: receipt.timezone,
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <>
      {/* Screen-only Breadcrumbs Header */}
      <PageSection
        background="inverse"
        padding="md"
        className="border-b border-accent/30 print:hidden"
      >
        <PageContainer>
          <Breadcrumbs
            homeLabel={t.navigation.home}
            items={[
              { label: t.receipt.breadcrumbsLabel, href: "/appointments/lookup" },
              { label: receipt.public_reference },
            ]}
            className="mb-4 text-ivory/70"
          />
          <div className="flex flex-col items-center text-center">
            <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-accent uppercase sm:text-sm">
              {t.receipt.kicker}
            </p>
            <h1 className="font-display text-3xl font-semibold text-foreground-inverse sm:text-4xl">
              {t.receipt.title}
            </h1>
          </div>
        </PageContainer>
      </PageSection>

      {/* Main Printable Card */}
      <PageSection background="default" padding="lg">
        <PageContainer className="max-w-2xl print:max-w-full">
          <div className="appointment-receipt-print print:border-gray-300 overflow-hidden rounded-card border-2 border-border bg-surface p-6 text-start shadow-card sm:p-10 print:border print:p-5 print:shadow-none">
            {/* Header with Logo */}
            <div className="flex flex-col items-center border-b border-border/80 pb-6 text-center print:pb-4">
              <BrandMark />
              <p className="mt-2 text-xs font-medium text-muted">{t.receipt.subtitle}</p>
              <Ornament className="mt-3 justify-center print:mt-2" />
            </div>

            {/* Reference Badge */}
            <div className="my-6 rounded-control border-2 border-accent/60 bg-cream/50 p-5 text-center print:my-4 print:border print:bg-cream/40 print:p-3">
              <span className="text-xs font-semibold tracking-wider text-accent-strong uppercase">
                {t.receipt.referenceHeading}
              </span>
              <p
                className="mt-1 font-mono text-2xl font-bold tracking-widest text-primary sm:text-3xl print:text-2xl"
                dir="ltr"
              >
                <bdi>{receipt.public_reference}</bdi>
              </p>
            </div>

            {/* Status and Details */}
            <div className="space-y-4 rounded-control border border-border/80 bg-surface-muted/20 p-6 text-sm print:space-y-2 print:p-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3 print:pb-2">
                <span className="text-muted">{t.receipt.statusLabel}</span>
                <Badge variant={statusVariant} size="md">
                  {statusLabel}
                </Badge>
              </div>

              <div className="flex items-center justify-between border-b border-border/60 pb-3 print:pb-2">
                <span className="text-muted">{t.receipt.applicantLabel}</span>
                <span className="font-semibold text-foreground">{receipt.customer_name}</span>
              </div>

              <div className="flex items-center justify-between border-b border-border/60 pb-3 print:pb-2">
                <span className="text-muted">{t.receipt.dateLabel}</span>
                <span className="font-semibold text-foreground">{formattedDate}</span>
              </div>

              <div className="flex items-center justify-between border-b border-border/60 pb-3 print:pb-2">
                <span className="text-muted">{t.receipt.timeLabel}</span>
                <span className="font-semibold text-foreground">
                  <bdi dir="ltr">{startTimeFormatted}</bdi> –{" "}
                  <bdi dir="ltr">{endTimeFormatted}</bdi> ({receipt.timezone})
                </span>
              </div>

              <div className="pt-2 print:pt-1">
                <span className="font-medium text-muted">{t.receipt.servicesLabel}</span>
                <ul className="mt-2 space-y-1.5 print:mt-1 print:space-y-1">
                  {receipt.services.map((srv, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between rounded-control border border-border/50 bg-surface px-3 py-2 text-xs font-medium text-foreground print:py-1.5"
                    >
                      <span>{srv.service_name_snapshot}</span>
                      <span className="text-muted">
                        {srv.duration_minutes_snapshot} {t.common.minutes}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Status Information Box */}
            <div className="mt-6 space-y-3 print:mt-4 print:space-y-2">
              {isPending && (
                <Alert
                  variant="warning"
                  title={t.receipt.pendingAlertTitle}
                  className="print:my-2 print:p-3"
                >
                  {t.receipt.pendingAlertDesc}
                </Alert>
              )}

              {isConfirmed && (
                <Alert
                  variant="success"
                  title={t.receipt.confirmedAlertTitle}
                  className="print:my-2 print:p-3"
                >
                  {t.receipt.confirmedAlertDesc}
                </Alert>
              )}

              <div className="space-y-1 text-start">
                <p className="text-[11px] leading-relaxed text-muted italic">
                  {t.receipt.noticePrinted}
                </p>
                <p className="hidden text-[10px] leading-relaxed text-muted print:block">
                  {isUr ? "رہنمائی یا استفسار کے لیے:" : "For assistance or inquiries:"}{" "}
                  <span dir="ltr">
                    <bdi>{scholarProfile.contact.email}</bdi>
                  </span>
                </p>
              </div>
            </div>

            {/* Assistance & Inquiries Support */}
            <div className="receipt-no-print mt-6 rounded-control border border-border/80 bg-surface-muted/40 p-4 text-xs text-muted print:hidden">
              <p className="font-semibold text-primary">{t.receipt.needAssistanceTitle}</p>
              <p className="mt-1 leading-relaxed">
                {t.receipt.needAssistanceDesc}{" "}
                <span className="font-mono font-bold text-primary" dir="ltr">
                  <bdi>{receipt.public_reference}</bdi>
                </span>{" "}
                {t.receipt.atEmail}{" "}
                <a
                  href={`mailto:${scholarProfile.contact.email}`}
                  dir="ltr"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  <bdi>{scholarProfile.contact.email}</bdi>
                </a>{" "}
                {t.receipt.orVisitContact}{" "}
                <Link
                  href="/contact"
                  className="font-medium text-primary underline underline-offset-2"
                >
                  {t.navigation.contact}
                </Link>
                .
              </p>
            </div>

            {/* Screen-Only Action Buttons */}
            <div className="receipt-no-print mt-8 flex flex-wrap items-center justify-center gap-3 border-t border-border/80 pt-6 print:hidden">
              <PrintButton />
              <LinkButton href="/appointments/lookup" variant="secondary" size="md">
                {t.receipt.lookupAnother}
              </LinkButton>
              <LinkButton href="/" variant="ghost" size="md">
                {t.receipt.returnHome}
              </LinkButton>
            </div>
          </div>
        </PageContainer>
      </PageSection>
    </>
  );
}
