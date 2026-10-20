import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { PageSection } from "@/components/layout/page-section";
import { LookupForm } from "@/components/lookup/lookup-form";
import { Card, CardTitle } from "@/components/ui/card";
import { LockIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { Ornament } from "@/components/ui/ornament";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Appointment Lookup",
  description:
    "Retrieve the status and details of your consultation request securely with your reference code.",
};

export default function AppointmentLookupPage() {
  return (
    <>
      {/* Header */}
      <PageSection background="inverse" padding="md" className="border-b border-accent/30">
        <PageContainer>
          <Breadcrumbs items={[{ label: "Appointment Lookup" }]} className="mb-4 text-ivory/70" />
          <SectionHeading
            kicker="Guest Services"
            title="Appointment Lookup"
            description="Retrieve and review the status of your consultation request using your unique reference code."
            inverse
            align="center"
          />
        </PageContainer>
      </PageSection>

      {/* Main Content */}
      <PageSection background="default" padding="lg">
        <PageContainer>
          <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-14">
            {/* Left: Guidance & Security Standards */}
            <div className="space-y-6 lg:col-span-6">
              <div>
                <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-accent-strong uppercase sm:text-sm">
                  Client Privacy Standards
                </p>
                <h3 className="font-display text-3xl font-semibold text-primary">
                  How We Protect Your Appointment Data
                </h3>
                <Ornament className="mt-3 justify-start" />
                <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                  We believe personal spiritual consultations should remain strictly confidential.
                  Our appointment system adheres to robust privacy principles:
                </p>
              </div>

              <div className="space-y-4">
                <Card variant="muted" className="p-5">
                  <div className="mb-2 flex items-center gap-2.5 text-primary">
                    <ShieldCheckIcon className="size-5 shrink-0 text-emerald" />
                    <CardTitle className="text-base">No Public Account or Password</CardTitle>
                  </div>
                  <p className="text-xs leading-relaxed text-muted sm:text-sm">
                    You do not need to create or remember an account. Your appointment is tied
                    exclusively to your unguessable reference code and verified contact details.
                  </p>
                </Card>

                <Card variant="muted" className="p-5">
                  <div className="mb-2 flex items-center gap-2.5 text-primary">
                    <LockIcon className="size-5 shrink-0 text-accent-strong" />
                    <CardTitle className="text-base">Two-Step Verification Protocol</CardTitle>
                  </div>
                  <p className="text-xs leading-relaxed text-muted sm:text-sm">
                    Knowing an appointment code alone is not enough to view personal details. A
                    secure verification token or direct confirmation is required before private
                    notes or contact data are revealed.
                  </p>
                </Card>
              </div>

              {/* Need assistance */}
              <div className="space-y-3 rounded-card border border-border bg-surface-muted p-6">
                <h4 className="font-display text-lg font-semibold text-primary">
                  Cannot Find Your Reference Code?
                </h4>
                <p className="text-xs leading-relaxed text-muted sm:text-sm">
                  If you lost your reference code or need to update your scheduled consultation
                  time, please contact us directly with your name and consultation date.
                </p>
                <div className="pt-1">
                  <LinkButton href="/contact" variant="secondary" size="sm">
                    Contact Us for Assistance
                  </LinkButton>
                </div>
              </div>
            </div>

            {/* Right: Lookup Form Shell */}
            <div className="lg:col-span-6">
              <LookupForm />
            </div>
          </div>
        </PageContainer>
      </PageSection>
    </>
  );
}
