import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { PageSection } from "@/components/layout/page-section";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { LockIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { Ornament } from "@/components/ui/ornament";
import { SectionHeading } from "@/components/ui/section-heading";
import { scholarProfile } from "@/config/scholar-profile";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Notice & Data Protection",
  description:
    "Privacy and data protection policy for the AZIZURRAHMAN appointment booking platform. Ethical data minimisation, secure records, and guest rights.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Notice & Data Protection · AZIZURRAHMAN",
    description:
      "Privacy and data protection policy for the AZIZURRAHMAN appointment booking platform. Ethical data minimisation, secure records, and guest rights.",
    url: "/privacy",
  },
};

export const instant = false;

export default function PrivacyPage() {
  return (
    <>
      {/* 1. Header Section */}
      <PageSection background="inverse" padding="md" className="border-b border-accent/30">
        <PageContainer>
          <Breadcrumbs items={[{ label: "Privacy Notice" }]} className="mb-4 text-ivory/70" />
          <SectionHeading
            kicker="Data Protection & Confidentiality"
            title="Privacy Notice & Trust Policy"
            description="Our commitment to discretion, data minimisation, and guest confidentiality."
            inverse
            align="center"
          />
        </PageContainer>
      </PageSection>

      {/* 2. Main Content */}
      <PageSection background="default" padding="lg">
        <PageContainer>
          <div className="mx-auto max-w-4xl space-y-8">
            <Alert variant="info" title="Draft Policy for Review">
              This document represents the operational data privacy baseline prepared for{" "}
              {siteConfig.name}. Formal legal sign-off and definitive data retention schedules are
              subject to final client approval (Reference: Requirements Baseline Q19).
            </Alert>

            <Card variant="default" className="space-y-6 p-6 sm:p-8">
              <div>
                <h3 className="font-display text-2xl font-semibold text-primary">
                  1. Our Core Principle of Confidentiality
                </h3>
                <Ornament className="mt-2 justify-start" />
                <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                  Consultation requests made to {scholarProfile.identity.fullNameEn} are held in the
                  strictest confidence (Amanah). We collect only the minimum personal information
                  strictly required to schedule, review, and confirm your private consultation
                  session.
                </p>
              </div>

              <div className="border-t border-border/60 pt-6">
                <h3 className="font-display text-2xl font-semibold text-primary">
                  2. Information We Collect
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                  When you submit a guest consultation request via this website, we collect:
                </p>
                <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-foreground sm:text-base">
                  <li>
                    <strong className="text-primary">Your Name:</strong> To address you respectfully
                    and identify your booking.
                  </li>
                  <li>
                    <strong className="text-primary">Phone / WhatsApp Number:</strong> To coordinate
                    the consultation time and notify you of schedule confirmation.
                  </li>
                  <li>
                    <strong className="text-primary">Email Address (Optional):</strong> To provide
                    written booking receipts and confirmation updates where preferred.
                  </li>
                  <li>
                    <strong className="text-primary">Requested Guidance Category:</strong> The
                    spiritual consultation service selected.
                  </li>
                  <li>
                    <strong className="text-primary">Optional Inquiry Topic:</strong> A brief
                    summary to prepare the consultation session. Detailed private family matters
                    should be reserved for direct one-on-one discussion.
                  </li>
                </ul>
              </div>

              <div className="border-t border-border/60 pt-6">
                <h3 className="font-display text-2xl font-semibold text-primary">
                  3. What We Never Collect
                </h3>
                <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-foreground sm:text-base">
                  <li>We do not require you to create or maintain a public user account.</li>
                  <li>We do not collect banking details, card numbers, or online payments.</li>
                  <li>
                    We do not collect government identification numbers or sensitive medical
                    dossiers.
                  </li>
                  <li>
                    We do not sell, rent, or share personal visitor data with third-party
                    advertising or marketing networks.
                  </li>
                </ul>
              </div>

              <div className="border-t border-border/60 pt-6">
                <h3 className="font-display text-2xl font-semibold text-primary">
                  4. Security, Access Controls &amp; Authentication
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                  Our infrastructure implements industry best practices for database and application
                  security:
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-control border border-border/80 bg-surface-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <LockIcon className="size-4 text-accent-strong" />
                      Row Level Security (RLS)
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">
                      Database tables enforce strict PostgreSQL Row Level Security. Public visitors
                      cannot query or inspect other visitors&apos; appointments or personal details.
                    </p>
                  </div>
                  <div className="rounded-control border border-border/80 bg-surface-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <ShieldCheckIcon className="size-4 text-accent-strong" />
                      Salted Verification Hashes
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">
                      Appointment lookup codes and verification tokens are salted and hashed with
                      SHA-256. Raw verification secrets are never stored in plaintext.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/60 pt-6">
                <h3 className="font-display text-2xl font-semibold text-primary">
                  5. Data Retention &amp; Deletion
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                  Appointment records are retained solely for the administrative duration necessary
                  to fulfill the consultation. Historical consultation entries may be pruned or
                  anonymized periodically in accordance with client data retention policy.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                  You may request the cancellation of an appointment or the expungement of your
                  contact records at any time by contacting our consultation coordinator.
                </p>
              </div>

              <div className="border-t border-border/60 pt-6">
                <h3 className="font-display text-2xl font-semibold text-primary">
                  6. Contact Regarding Privacy
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                  If you have questions regarding this privacy notice or wish to exercise your
                  rights regarding personal data, please contact:
                </p>
                <div className="mt-3 rounded-control border border-border bg-cream/40 p-4 text-sm text-foreground">
                  <p className="font-semibold text-primary">{siteConfig.name}</p>
                  <p className="text-muted">{scholarProfile.contact.address.full}</p>
                  <p className="mt-1">
                    Email:{" "}
                    <a
                      href={`mailto:${scholarProfile.contact.email}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {scholarProfile.contact.email}
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-6">
                <LinkButton href="/" variant="outline" size="md">
                  ← Return Home
                </LinkButton>
                <LinkButton href="/book" variant="primary" size="md">
                  Book an Appointment
                </LinkButton>
              </div>
            </Card>
          </div>
        </PageContainer>
      </PageSection>
    </>
  );
}
