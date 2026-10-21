"use client";

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
import { useTranslations } from "@/i18n/client";

export function PrivacyView() {
  const { t, locale, interpolate } = useTranslations();
  const isUr = locale === "ur";
  const scholarName = isUr
    ? scholarProfile.identity.fullNameUr
    : scholarProfile.identity.fullNameEn;
  const addressText = isUr
    ? "موضع کھریواں، سرائمیر، اعظم گڑھ، اتر پردیش، انڈیا — 276305"
    : scholarProfile.contact.address.full;

  return (
    <>
      {/* 1. Header Section */}
      <PageSection background="inverse" padding="md" className="border-b border-accent/30">
        <PageContainer>
          <Breadcrumbs
            items={[{ label: isUr ? "رازداری کی پالیسی" : "Privacy Notice" }]}
            className="mb-4 text-ivory/70"
          />
          <SectionHeading
            kicker={t.privacy.kicker}
            title={t.privacy.title}
            description={t.privacy.description}
            inverse
            align="center"
          />
        </PageContainer>
      </PageSection>

      {/* 2. Main Content */}
      <PageSection background="default" padding="lg">
        <PageContainer>
          <div className="mx-auto max-w-4xl space-y-8 text-start">
            <Alert variant="info" title={t.privacy.draftNoticeTitle}>
              {interpolate(t.privacy.draftNoticeDesc, { siteName: siteConfig.name })}
            </Alert>

            <Card variant="default" className="space-y-6 p-6 sm:p-8">
              <div>
                <h3 className="font-display text-2xl font-semibold text-primary">
                  {t.privacy.section1Title}
                </h3>
                <Ornament className="mt-2 justify-start" />
                <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                  {interpolate(t.privacy.section1Desc, { name: scholarName })}
                </p>
              </div>

              <div className="border-t border-border/60 pt-6">
                <h3 className="font-display text-2xl font-semibold text-primary">
                  {t.privacy.section2Title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                  {t.privacy.section2Desc}
                </p>
                <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-foreground sm:text-base">
                  <li>
                    <strong className="text-primary">{t.privacy.collectNameTitle} </strong>
                    {t.privacy.collectNameDesc}
                  </li>
                  <li>
                    <strong className="text-primary">{t.privacy.collectPhoneTitle} </strong>
                    {t.privacy.collectPhoneDesc}
                  </li>
                  <li>
                    <strong className="text-primary">{t.privacy.collectEmailTitle} </strong>
                    {t.privacy.collectEmailDesc}
                  </li>
                  <li>
                    <strong className="text-primary">{t.privacy.collectCategoryTitle} </strong>
                    {t.privacy.collectCategoryDesc}
                  </li>
                  <li>
                    <strong className="text-primary">{t.privacy.collectTopicTitle} </strong>
                    {t.privacy.collectTopicDesc}
                  </li>
                </ul>
              </div>

              <div className="border-t border-border/60 pt-6">
                <h3 className="font-display text-2xl font-semibold text-primary">
                  {t.privacy.section3Title}
                </h3>
                <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-foreground sm:text-base">
                  <li>{t.privacy.neverAccount}</li>
                  <li>{t.privacy.neverBanking}</li>
                  <li>{t.privacy.neverGovId}</li>
                  <li>{t.privacy.neverSell}</li>
                </ul>
              </div>

              <div className="border-t border-border/60 pt-6">
                <h3 className="font-display text-2xl font-semibold text-primary">
                  {t.privacy.section4Title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                  {t.privacy.section4Desc}
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-control border border-border/80 bg-surface-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <LockIcon className="size-4 shrink-0 text-accent-strong" />
                      <span>{t.privacy.rlsTitle}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">{t.privacy.rlsDesc}</p>
                  </div>
                  <div className="rounded-control border border-border/80 bg-surface-muted/30 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <ShieldCheckIcon className="size-4 shrink-0 text-accent-strong" />
                      <span>{t.privacy.hashTitle}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">
                      {t.privacy.hashDesc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/60 pt-6">
                <h3 className="font-display text-2xl font-semibold text-primary">
                  {t.privacy.section5Title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                  {t.privacy.retentionP1}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                  {t.privacy.retentionP2}
                </p>
              </div>

              <div className="border-t border-border/60 pt-6">
                <h3 className="font-display text-2xl font-semibold text-primary">
                  {t.privacy.section6Title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                  {t.privacy.section6Desc}
                </p>
                <div className="mt-3 rounded-control border border-border bg-cream/40 p-4 text-sm text-foreground">
                  <p className="font-semibold text-primary">{siteConfig.name}</p>
                  <p className="text-muted">{addressText}</p>
                  <p className="mt-1">
                    {isUr ? "ای میل: " : "Email: "}
                    <a
                      href={`mailto:${scholarProfile.contact.email}`}
                      className="font-medium text-primary hover:underline"
                    >
                      <bdi dir="ltr">{scholarProfile.contact.email}</bdi>
                    </a>
                  </p>
                </div>
              </div>

              {isUr && (
                <div className="rounded-control border border-accent/30 bg-surface-muted/60 p-4 text-xs text-muted">
                  <p className="leading-relaxed">{t.privacy.privacyReviewNotice}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-6">
                <LinkButton href="/" variant="outline" size="md">
                  {isUr ? "صفحۂ اول پر واپس جائیں ←" : "← Return Home"}
                </LinkButton>
                <LinkButton href="/book" variant="primary" size="md">
                  {t.common.bookAppointment}
                </LinkButton>
              </div>
            </Card>
          </div>
        </PageContainer>
      </PageSection>
    </>
  );
}
