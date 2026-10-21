"use client";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import { PageSection } from "@/components/layout/page-section";
import { LookupForm } from "@/components/lookup/lookup-form";
import { Card, CardTitle } from "@/components/ui/card";
import { LockIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { Ornament } from "@/components/ui/ornament";
import { SectionHeading } from "@/components/ui/section-heading";
import { useTranslations } from "@/i18n/client";

export function AppointmentLookupView() {
  const { t, locale } = useTranslations();
  const isUr = locale === "ur";

  return (
    <>
      {/* Header */}
      <PageSection background="inverse" padding="md" className="border-b border-accent/30">
        <PageContainer>
          <Breadcrumbs
            homeLabel={t.navigation.home}
            items={[{ label: t.navigation.lookup }]}
            className="mb-4 text-ivory/70"
          />
          <SectionHeading
            kicker={t.lookup.kicker}
            title={t.lookup.title}
            description={t.lookup.description}
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
            <div className="space-y-6 text-start lg:col-span-6">
              <div>
                <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-accent-strong uppercase sm:text-sm">
                  {isUr ? "رازداری کے معیارات" : "Client Privacy Standards"}
                </p>
                <h3 className="font-display text-3xl font-semibold text-primary">
                  {isUr
                    ? "ہم آپ کے مشاورتی کوائف کو کیسے محفوظ رکھتے ہیں"
                    : "How We Protect Your Appointment Data"}
                </h3>
                <Ornament className="mt-3 justify-start" />
                <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                  {isUr
                    ? "ہمیں یقین ہے کہ روحانی مشاورت کو مکمل طور پر خفیہ اور باوقار رہنا چاہیے۔ ہمارا نظام مضبوط حفاظتی اصولوں پر مبنی ہے:"
                    : "We believe personal spiritual consultations should remain strictly confidential. Our appointment system adheres to robust privacy principles:"}
                </p>
              </div>

              <div className="space-y-4">
                <Card variant="muted" className="p-5">
                  <div className="mb-2 flex items-center gap-2.5 text-primary">
                    <ShieldCheckIcon className="size-5 shrink-0 text-emerald" />
                    <CardTitle className="text-base">
                      {isUr ? "کوئی پبلک اکاؤنٹ یا پاس ورڈ نہیں" : "No Public Account or Password"}
                    </CardTitle>
                  </div>
                  <p className="text-xs leading-relaxed text-muted sm:text-sm">
                    {isUr
                      ? "آپ کو کوئی پبلک اکاؤنٹ بنانے کی ضرورت نہیں ہے۔ آپ کی ملاقات آپ کے مخصوص حوالہ نمبر اور رابطے کے ساتھ منسلک رہتی ہے۔"
                      : "You do not need to create or remember an account. Your appointment is tied exclusively to your unguessable reference code and verified contact details."}
                  </p>
                </Card>

                <Card variant="muted" className="p-5">
                  <div className="mb-2 flex items-center gap-2.5 text-primary">
                    <LockIcon className="size-5 shrink-0 text-accent-strong" />
                    <CardTitle className="text-base">
                      {isUr ? "دو مرحلہ وار تصدیقی طریقہ کار" : "Two-Step Verification Protocol"}
                    </CardTitle>
                  </div>
                  <p className="text-xs leading-relaxed text-muted sm:text-sm">
                    {isUr
                      ? "صرف حوالہ نمبر جاننا ذاتی تفصیلات دیکھنے کے لیے کافی نہیں ہے۔ شناخت کی تصدیق کے بعد ہی تفصیلی کوائف دکھائے جاتے ہیں۔"
                      : "Knowing an appointment code alone is not enough to view personal details. A secure verification token or direct confirmation is required before private notes or contact data are revealed."}
                  </p>
                </Card>
              </div>

              {/* Need assistance */}
              <div className="space-y-3 rounded-card border border-border bg-surface-muted p-6">
                <h4 className="font-display text-lg font-semibold text-primary">
                  {isUr ? "کیا آپ کا حوالہ نمبر نہیں مل رہا؟" : "Cannot Find Your Reference Code?"}
                </h4>
                <p className="text-xs leading-relaxed text-muted sm:text-sm">
                  {isUr
                    ? "اگر آپ کا حوالہ نمبر گم ہو گیا ہے یا آپ وقت تبدیل کرنا چاہتے ہیں تو براہ کرم اپنے نام اور مطلوبہ تاریخ کے ساتھ ہم سے براہ راست رابطہ فرمائیں۔"
                    : "If you lost your reference code or need to update your scheduled consultation time, please contact us directly with your name and consultation date."}
                </p>
                <div className="pt-1">
                  <LinkButton href="/contact" variant="secondary" size="sm">
                    {t.lookup.contactDesk}
                  </LinkButton>
                </div>
              </div>
            </div>

            {/* Right: Lookup Form Engine */}
            <div className="lg:col-span-6">
              <LookupForm />
            </div>
          </div>
        </PageContainer>
      </PageSection>
    </>
  );
}
