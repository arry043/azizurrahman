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
import { getServerTranslations } from "@/i18n/server";
import { getLocalizedService } from "@/i18n/services-dictionary";
import { getActiveServices, getPublicSiteSettings } from "@/lib/services/public-services";
import type { PublicService } from "@/types/domain";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description:
    "Request a spiritual consultation appointment with AZIZURRAHMAN. Simple, guest-friendly booking with no public account needed.",
  alternates: {
    canonical: "/book",
  },
  openGraph: {
    title: "Book an Appointment · AZIZURRAHMAN",
    description:
      "Request a spiritual consultation appointment with AZIZURRAHMAN. Simple, guest-friendly booking with no public account needed.",
    url: "/book",
  },
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
  const { locale } = await getServerTranslations();
  const isUr = locale === "ur";
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedServiceSlug = resolvedSearchParams?.service;
  if (!selectedServiceSlug) return null;

  const preselectedService = services.find((s) => s.slug === selectedServiceSlug);
  if (!preselectedService) return null;

  const localized = getLocalizedService(preselectedService, locale);

  return (
    <div className="rounded-card border-2 border-accent/50 bg-cream/40 p-6 text-start shadow-subtle">
      <div className="flex items-center gap-2 text-xs font-semibold text-accent-strong uppercase">
        <CheckIcon className="size-4" />
        <span>{isUr ? "منتخب کردہ مشاورتی خدمت" : "Selected Consultation Service"}</span>
      </div>
      <h4 className="mt-2 font-display text-2xl font-semibold text-primary">{localized.name}</h4>
      {localized.short_description && (
        <p className="mt-1 text-sm text-muted">{localized.short_description}</p>
      )}
      {preselectedService.duration_minutes > 0 && (
        <div className="mt-3">
          <Badge variant="neutral" size="sm">
            {isUr
              ? `متوقع دورانیہ: ${preselectedService.duration_minutes} منٹ`
              : `Estimated Duration: ${preselectedService.duration_minutes} mins`}
          </Badge>
        </div>
      )}
    </div>
  );
}

export default async function BookAppointmentPage({ searchParams }: BookPageProps) {
  const [{ t, locale }, services, siteSettings] = await Promise.all([
    getServerTranslations(),
    getActiveServices(),
    getPublicSiteSettings(),
  ]);

  const isUr = locale === "ur";

  return (
    <>
      {/* Header */}
      <PageSection
        background="inverse"
        padding="md"
        className="border-b border-accent/30 print:hidden"
      >
        <PageContainer>
          <Breadcrumbs
            homeLabel={t.navigation.home}
            items={[{ label: t.navigation.book }]}
            className="mb-4 text-ivory/70"
          />
          <SectionHeading
            kicker={isUr ? "نظامِ اوقات کار" : "Appointment System"}
            title={isUr ? "مشاورت کے لیے وقت منتخب کریں" : "Request a Consultation"}
            description={
              isUr
                ? "مشاورت کی درخواستیں باوقار، آسان اور پرسکون طریقے سے مرتب کی جاتی ہیں۔ کسی اکاؤنٹ کی ضرورت نہیں۔"
                : "Our consultation requests are designed to be respectful, private, and straightforward. No account creation required."
            }
            inverse
            align="center"
          />
        </PageContainer>
      </PageSection>

      {/* Main Content */}
      <PageSection background="default" padding="lg">
        <PageContainer>
          {/* Booking Process Steps */}
          <div className="mb-14 print:hidden">
            <h3 className="mb-8 text-center font-display text-2xl font-semibold text-primary">
              {isUr
                ? "مشاورت کا وقت حاصل کرنے کا مرحلہ وار طریقہ کار"
                : "How the Consultation Booking Process Works"}
            </h3>
            <div className="grid grid-cols-1 gap-6 text-start md:grid-cols-4">
              <Card variant="muted" className="relative p-6">
                <div className="mb-4 flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  1
                </div>
                <CardTitle className="text-base sm:text-lg">
                  {isUr ? "خدمت کا انتخاب" : "Select Service"}
                </CardTitle>
                <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
                  {isUr
                    ? "اپنی ضرورت اور صورتحال کے مطابق مناسب روحانی خدمت منتخب کریں۔"
                    : "Choose the spiritual consultation category that best reflects your situation."}
                </p>
              </Card>

              <Card variant="muted" className="relative p-6">
                <div className="mb-4 flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  2
                </div>
                <CardTitle className="text-base sm:text-lg">
                  {isUr ? "تاریخ و وقت کا تعین" : "Pick Date & Time"}
                </CardTitle>
                <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
                  {isUr
                    ? "ہفتہ وار شیڈول کے مطابق دستیاب تاریخ اور پسندیدہ وقت کا انتخاب کریں۔"
                    : "Choose an available consultation slot aligned with the weekly working schedule."}
                </p>
              </Card>

              <Card variant="muted" className="relative p-6">
                <div className="mb-4 flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  3
                </div>
                <CardTitle className="text-base sm:text-lg">
                  {isUr ? "رابطے کی معلومات" : "Provide Contact Info"}
                </CardTitle>
                <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
                  {isUr
                    ? "اپنا درست نام اور فون نمبر درج کریں تاکہ رابطہ کار آپ سے رابطہ کر سکے۔"
                    : "Submit your name and phone number so the provider can reach you directly."}
                </p>
              </Card>

              <Card variant="muted" className="relative p-6">
                <div className="mb-4 flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  4
                </div>
                <CardTitle className="text-base sm:text-lg">
                  {isUr ? "حتمی توثیق" : "Slot Confirmation"}
                </CardTitle>
                <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
                  {isUr
                    ? "درخواست کی تصدیق کے بعد آپ کا مخصوص وقت محفوظ کر لیا جاتا ہے۔"
                    : "Your request is reviewed and confirmed, reserving your dedicated consultation time."}
                </p>
              </Card>
            </div>
          </div>

          {/* Interactive Guest Booking Engine */}
          <div className="mb-14">
            <Suspense
              fallback={
                <div className="min-h-[400px] animate-pulse rounded-card bg-surface-muted/50 p-8 text-center text-muted">
                  {t.common.loading}
                </div>
              }
            >
              <BookingFormContainer searchParams={searchParams} services={services} />
            </Suspense>
          </div>

          {/* Engine Engineering Notice & Interim Direct Contact */}
          <div className="mx-auto max-w-3xl space-y-8 print:hidden">
            <Alert
              variant="info"
              title={
                isUr
                  ? "خودکار کیلنڈر نظام کا باقاعدہ انضمام"
                  : "Automated Calendar Engine in Active Development"
              }
              icon={<ClockIcon className="size-5 text-primary" />}
            >
              {isUr
                ? "حقیقی وقت میں کیلنڈر کی دستیابی ہفتہ وار شیڈول کے مطابق ترتیب دی گئی ہے۔ آپ نیچے دی گئی خدمات کا جائزہ لے سکتے ہیں یا براہ راست رابطہ کر کے بھی وقت معلوم کر سکتے ہیں۔"
                : "The real-time interactive calendar engine (Phases 5 & 6) is currently being connected to the provider’s weekly working schedule. In the meantime, you may explore the available services below and reach out directly through our verified contact channels to schedule your appointment."}
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
                  {isUr
                    ? `${siteConfig.name} سے براہ راست رابطہ کریں`
                    : `Schedule Directly with ${siteConfig.name}`}
                </CardTitle>
                <Ornament className="justify-center" />
                <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted sm:text-base">
                  {isUr
                    ? "مشاورت کے لیے براہ راست رابطہ کر کے اپنی مطلوبہ خدمت اور مناسب وقت کے بارے میں مطلع فرمائیں۔"
                    : "To request a consultation today, please contact us directly. Mention the service you are interested in and your preferred days or times."}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <LinkButton href="/contact" variant="primary" size="lg">
                  {isUr ? "رابطے کے ذرائع دیکھیں" : "View Contact Channels"}
                </LinkButton>
                <LinkButton href="/services" variant="secondary" size="lg">
                  {isUr ? "تمام خدمات ملاحظہ فرمائیں" : "Browse All Services"}
                </LinkButton>
              </div>

              {siteSettings?.public_whatsapp &&
                buildWhatsAppUrl(
                  siteSettings.public_whatsapp,
                  siteSettings.whatsapp_message_template,
                ) && (
                  <div className="border-t border-border/70 pt-4 text-xs text-muted">
                    <span>{isUr ? "فوری ترین جواب: " : "Fastest response: "}</span>
                    <a
                      href={buildWhatsAppUrl(
                        siteSettings.public_whatsapp,
                        siteSettings.whatsapp_message_template,
                      )!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-emerald underline-offset-4 hover:underline"
                    >
                      {isUr ? "براہ راست واٹس ایپ پیغام" : "Direct WhatsApp Message"}
                    </a>
                  </div>
                )}
            </Card>

            {/* Available Services Summary */}
            {services.length > 0 && (
              <div className="space-y-4 pt-4 text-start">
                <h4 className="font-display text-xl font-semibold text-primary">
                  {isUr ? "دستیاب مشاورتی خدمات" : "Available Guidance Services"}
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.map((srv) => {
                    const loc = getLocalizedService(srv, locale);
                    return (
                      <div
                        key={srv.id}
                        className="flex items-center justify-between rounded-control border border-border bg-surface p-4"
                      >
                        <div>
                          <h5 className="text-sm font-medium text-foreground">{loc.name}</h5>
                          {srv.duration_minutes > 0 && (
                            <span className="text-xs text-muted">
                              {srv.duration_minutes} {t.common.minutes}
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/services/${srv.slug}`}
                          className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                        >
                          {t.common.viewDetails} <span className="rtl:rotate-180">→</span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </PageContainer>
      </PageSection>
    </>
  );
}
