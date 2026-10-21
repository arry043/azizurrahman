import type { Metadata } from "next";

import { ContactCTA } from "@/components/contact/contact-cta";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { PageSection } from "@/components/layout/page-section";
import { ServiceGrid } from "@/components/services/service-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { SparklesIcon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { SectionHeading } from "@/components/ui/section-heading";
import { getServerTranslations } from "@/i18n/server";
import { getActiveServices, getPublicSiteSettings } from "@/lib/services/public-services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore our spiritual consultation services, Quranic reflection, and dedicated one-on-one sessions.",
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title: "Services · AZIZURRAHMAN",
    description:
      "Explore our spiritual consultation services, Quranic reflection, and dedicated one-on-one sessions.",
    url: "/services",
  },
};

export const instant = false;

export default async function ServicesPage() {
  const [{ t }, services, siteSettings] = await Promise.all([
    getServerTranslations(),
    getActiveServices(),
    getPublicSiteSettings(),
  ]);

  return (
    <>
      {/* Header */}
      <PageSection background="inverse" padding="md" className="border-b border-accent/30">
        <PageContainer>
          <Breadcrumbs
            homeLabel={t.navigation.home}
            items={[{ label: t.navigation.services }]}
            className="mb-4 text-ivory/70"
          />
          <SectionHeading
            kicker={t.services.kicker}
            title={t.services.title}
            description={t.services.description}
            inverse
            align="center"
          />
        </PageContainer>
      </PageSection>

      {/* Services Grid Section */}
      <PageSection background="default" padding="lg">
        <PageContainer>
          {services.length > 0 ? (
            <ServiceGrid services={services} />
          ) : (
            <EmptyState
              icon={<SparklesIcon className="size-6 text-accent-strong" />}
              title={t.services.emptyTitle}
              description={t.services.emptyDescription}
              action={
                <LinkButton href="/contact" variant="primary" size="md">
                  {t.common.contactUs}
                </LinkButton>
              }
            />
          )}
        </PageContainer>
      </PageSection>

      {/* Booking CTA Banner */}
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
