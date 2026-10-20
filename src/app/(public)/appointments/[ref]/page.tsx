import type { Metadata } from "next";
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
  const receipt = await getPublicReceiptByReference(ref);

  if (!receipt) {
    notFound();
  }

  const isPending = receipt.status === "pending";
  const isConfirmed = receipt.status === "confirmed";
  const isCancelled = receipt.status === "cancelled";
  const isDeclined = receipt.status === "declined";

  const statusVariant = isConfirmed ? "success" : isPending ? "warning" : "error";
  const statusLabel = isConfirmed
    ? "Appointment Confirmed"
    : isPending
      ? "Request Pending Review"
      : isCancelled
        ? "Appointment Cancelled"
        : isDeclined
          ? "Request Declined"
          : receipt.status;

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
            items={[
              { label: "Appointments", href: "/appointments/lookup" },
              { label: receipt.public_reference },
            ]}
            className="mb-4 text-ivory/70"
          />
          <div className="flex flex-col items-center text-center">
            <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-accent uppercase sm:text-sm">
              Official Consultation Receipt
            </p>
            <h1 className="font-display text-3xl font-semibold text-foreground-inverse sm:text-4xl">
              Appointment Summary
            </h1>
          </div>
        </PageContainer>
      </PageSection>

      {/* Main Printable Card */}
      <PageSection background="default" padding="lg">
        <PageContainer className="max-w-2xl">
          <div className="overflow-hidden rounded-card border-2 border-border bg-surface p-6 shadow-card sm:p-10 print:border-none print:p-0 print:shadow-none">
            {/* Header with Logo */}
            <div className="flex flex-col items-center border-b border-border/80 pb-6 text-center">
              <BrandMark />
              <p className="mt-2 text-xs font-medium text-muted">
                Official Spiritual Guidance &amp; Consultation
              </p>
              <Ornament className="mt-3 justify-center" />
            </div>

            {/* Reference Badge */}
            <div className="my-6 rounded-control border-2 border-accent/60 bg-cream/50 p-5 text-center print:border print:bg-transparent">
              <span className="text-xs font-semibold tracking-wider text-accent-strong uppercase">
                Public Appointment Reference
              </span>
              <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-primary sm:text-3xl">
                {receipt.public_reference}
              </p>
            </div>

            {/* Status and Details */}
            <div className="space-y-4 rounded-control border border-border/80 bg-surface-muted/20 p-6 text-sm">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-muted">Appointment Status:</span>
                <Badge variant={statusVariant} size="md">
                  {statusLabel}
                </Badge>
              </div>

              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-muted">Applicant Name:</span>
                <span className="font-semibold text-foreground">{receipt.customer_name}</span>
              </div>

              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-muted">Consultation Date:</span>
                <span className="font-semibold text-foreground">
                  {new Date(receipt.appointment_start).toLocaleDateString("en-US", {
                    timeZone: receipt.timezone,
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-muted">Allocated Time:</span>
                <span className="font-semibold text-foreground">
                  {new Date(receipt.appointment_start).toLocaleTimeString("en-US", {
                    timeZone: receipt.timezone,
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  –{" "}
                  {new Date(receipt.appointment_end).toLocaleTimeString("en-US", {
                    timeZone: receipt.timezone,
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  ({receipt.timezone})
                </span>
              </div>

              <div className="pt-2">
                <span className="font-medium text-muted">Requested Consultation Services:</span>
                <ul className="mt-2 space-y-1.5">
                  {receipt.services.map((srv, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between rounded-control border border-border/50 bg-surface px-3 py-2 text-xs font-medium text-foreground"
                    >
                      <span>{srv.service_name_snapshot}</span>
                      <span className="text-muted">{srv.duration_minutes_snapshot} mins</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Status Information Box */}
            <div className="mt-6 space-y-3">
              {isPending && (
                <Alert variant="warning" title="Request Pending Review">
                  Your appointment request is awaiting review by the consultation coordinator.
                  Confirmation will be communicated via your registered phone number.
                </Alert>
              )}

              {isConfirmed && (
                <Alert variant="success" title="Confirmed Appointment">
                  This appointment has been reviewed and confirmed. Please be available at your
                  scheduled time.
                </Alert>
              )}

              <p className="text-[11px] leading-relaxed text-muted italic">
                Notice: A printed or saved copy of this receipt reflects the state at the time of
                creation. For subsequent schedule adjustments, please quote your reference code.
              </p>
            </div>

            {/* Screen-Only Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 border-t border-border/80 pt-6 print:hidden">
              <PrintButton />
              <LinkButton href="/appointments/lookup" variant="secondary" size="md">
                Lookup Another
              </LinkButton>
              <LinkButton href="/" variant="ghost" size="md">
                Return to Home
              </LinkButton>
            </div>
          </div>
        </PageContainer>
      </PageSection>
    </>
  );
}
