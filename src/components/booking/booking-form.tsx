"use client";

import { useState } from "react";

import { InteractiveCalendar } from "@/components/calendar/interactive-calendar";
import { BrandMark } from "@/components/layout/brand-mark";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckIcon, CopyIcon, PrinterIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { LinkButton } from "@/components/ui/link-button";
import { Ornament } from "@/components/ui/ornament";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { scholarProfile } from "@/config/scholar-profile";
import { useTranslations } from "@/i18n/client";
import { getLocalizedService } from "@/i18n/services-dictionary";
import { cn } from "@/lib/utils";
import type { ContactMethod, PublicAppointmentReceipt, PublicService } from "@/types/domain";

export interface BookingFormProps {
  services: PublicService[];
  preselectedServiceSlug?: string;
  className?: string;
}

export function BookingForm({ services, preselectedServiceSlug, className }: BookingFormProps) {
  const { t, locale, interpolate } = useTranslations();
  const isUr = locale === "ur";

  // Find initial service
  const initialService = services.find((s) => s.slug === preselectedServiceSlug) ?? services[0];
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(() =>
    initialService ? [initialService.id] : [],
  );

  // Scheduling state
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Contact details
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [preferredContactMethod, setPreferredContactMethod] = useState<ContactMethod>("phone");
  const [message, setMessage] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);

  // Form progression & UI states
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<
    (PublicAppointmentReceipt & { customer_name: string; created_at: string }) | null
  >(null);
  const [copied, setCopied] = useState(false);

  // Client idempotency key generated once per session to prevent double-submits
  const [idempotencyKey] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  );

  // Aggregated service calculations
  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const totalDuration = selectedServices.reduce((acc, s) => acc + s.duration_minutes, 0);

  function toggleService(serviceId: string) {
    setSelectedServiceIds((prev) => {
      if (prev.includes(serviceId)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter((id) => id !== serviceId);
      }
      if (prev.length >= 5) return prev; // Limit to 5
      return [...prev, serviceId];
    });
    // Reset slot when duration might change
    setSelectedTime("");
  }

  function handleSelectSlot(date: string, time: string) {
    setSelectedDate(date);
    if (time) {
      setSelectedTime(time);
    }
  }

  async function handleSubmitBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!consentGiven) {
      setSubmissionError(t.booking.errorNoticeConsent);
      return;
    }
    if (!selectedDate || !selectedTime) {
      setSubmissionError(t.booking.errorNoticeDateTime);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          customerName,
          phoneNumber,
          email: email.trim() || null,
          preferredContactMethod,
          message: message.trim() || null,
          serviceIds: selectedServiceIds,
          dateStr: selectedDate,
          startTime: selectedTime,
          idempotencyKey,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || t.booking.errorGeneric);
      }

      setCompletedReceipt(data.receipt);
    } catch (err) {
      setSubmissionError(err instanceof Error ? err.message : t.booking.errorGeneric);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCopyReference() {
    if (completedReceipt?.public_reference) {
      navigator.clipboard.writeText(completedReceipt.public_reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  // ── Successful Receipt View ─────────────────────────────────────────────────────────────
  if (completedReceipt) {
    const formattedDate = new Date(completedReceipt.appointment_start).toLocaleDateString(
      isUr ? "ur-PK" : "en-US",
      {
        timeZone: completedReceipt.timezone,
        weekday: "short",
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );

    const startTimeFormatted = new Date(completedReceipt.appointment_start).toLocaleTimeString(
      isUr ? "ur-PK" : "en-US",
      {
        timeZone: completedReceipt.timezone,
        hour: "2-digit",
        minute: "2-digit",
      },
    );

    const endTimeFormatted = new Date(completedReceipt.appointment_end).toLocaleTimeString(
      isUr ? "ur-PK" : "en-US",
      {
        timeZone: completedReceipt.timezone,
        hour: "2-digit",
        minute: "2-digit",
      },
    );

    return (
      <div
        className={cn(
          "mx-auto max-w-2xl space-y-8 print:m-0 print:max-w-full print:space-y-0",
          className,
        )}
      >
        <Card
          variant="elevated"
          className="appointment-receipt-print space-y-6 p-6 sm:p-8 print:space-y-4 print:p-5"
        >
          {/* Print-Only Official Brand Header */}
          <div className="hidden flex-col items-center border-b border-border/80 pb-4 text-center print:flex">
            <BrandMark />
            <p className="mt-2 text-xs font-medium text-muted">{t.receipt.subtitle}</p>
            <Ornament className="mt-2 justify-center" />
          </div>

          {/* Web Celebration Header */}
          <div className="flex flex-col items-center text-center print:hidden">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald/10 text-emerald">
              <CheckIcon className="size-8" />
            </div>
            <h3 className="mt-4 font-display text-2xl font-semibold text-primary sm:text-3xl">
              {t.booking.receiptTitle}
            </h3>
            <Ornament className="justify-center" />
            <p className="mt-2 text-sm leading-relaxed text-muted">{t.booking.receiptJazakallah}</p>
          </div>

          {/* Reference Banner */}
          <div className="rounded-control border-2 border-accent/60 bg-cream/50 p-5 text-center print:my-3 print:border print:bg-cream/40 print:p-3">
            <span className="text-xs font-semibold tracking-wider text-accent-strong uppercase">
              {t.booking.receiptRefHeading}
            </span>
            <div className="mt-1 flex items-center justify-center gap-3">
              <span
                dir="ltr"
                className="font-mono text-2xl font-bold tracking-wider text-primary sm:text-3xl print:text-2xl"
              >
                <bdi>{completedReceipt.public_reference}</bdi>
              </span>
              <button
                type="button"
                onClick={handleCopyReference}
                aria-label={t.common.copy}
                className="flex size-9 cursor-pointer items-center justify-center rounded-control border border-border bg-surface text-primary hover:bg-surface-muted focus-visible:outline-3 focus-visible:outline-focus print:hidden"
              >
                {copied ? (
                  <CheckIcon className="size-4 text-emerald" />
                ) : (
                  <CopyIcon className="size-4" />
                )}
              </button>
            </div>
            {copied && (
              <p className="mt-1 text-xs font-medium text-emerald print:hidden">
                {t.common.copied}
              </p>
            )}
          </div>

          {/* Appointment Details Summary */}
          <div className="space-y-3 rounded-control border border-border/80 bg-surface-muted/30 p-5 text-sm print:space-y-2 print:p-4">
            <div className="flex justify-between border-b border-border/60 pb-2 print:pb-1.5">
              <span className="text-muted">{t.booking.receiptStatusLabel}</span>
              <Badge variant="warning" size="sm">
                {t.booking.receiptStatusPending}
              </Badge>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2 print:pb-1.5">
              <span className="text-muted">{t.booking.receiptApplicantLabel}</span>
              <span className="font-medium text-foreground">{completedReceipt.customer_name}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2 print:pb-1.5">
              <span className="text-muted">{t.booking.receiptDateLabel}</span>
              <span className="font-medium text-foreground">{formattedDate}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2 print:pb-1.5">
              <span className="text-muted">{t.booking.receiptTimeLabel}</span>
              <span className="font-medium text-foreground">
                <bdi dir="ltr">{startTimeFormatted}</bdi> – <bdi dir="ltr">{endTimeFormatted}</bdi>{" "}
                ({completedReceipt.timezone})
              </span>
            </div>
            <div className="pt-1 text-start">
              <span className="text-muted">{t.booking.receiptServicesLabel}</span>
              <ul className="mt-1 list-inside list-disc space-y-1 text-foreground print:mt-0.5 print:space-y-0.5">
                {completedReceipt.services.map((srv, idx) => (
                  <li key={idx}>
                    {srv.service_name_snapshot} ({srv.duration_minutes_snapshot} {t.common.minutes})
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Alert
            variant="info"
            title={t.booking.receiptAlertTitle}
            className="print:my-2 print:p-3"
          >
            {t.booking.receiptAlertDesc}
          </Alert>

          {/* Receipt notice */}
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

          {/* Actions */}
          <div className="receipt-no-print flex flex-wrap items-center justify-center gap-3 pt-2 print:hidden">
            <LinkButton
              href={`/appointments/${completedReceipt.public_reference}`}
              variant="primary"
              size="md"
            >
              {t.booking.viewPrintableReceipt}
            </LinkButton>
            <Button
              variant="outline"
              size="md"
              onClick={() => window.print()}
              leftIcon={<PrinterIcon className="size-4" />}
            >
              {t.booking.printReceipt}
            </Button>
            <LinkButton href="/" variant="ghost" size="md">
              {t.common.returnHome}
            </LinkButton>
          </div>
        </Card>
      </div>
    );
  }

  // ── Multi-Step Booking Wizard ──────────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-8", className)}>
      {/* Live announcement for step changes */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {interpolate(t.booking.stepIndicator, {
          current: step,
          title:
            step === 1
              ? t.booking.step1Title
              : step === 2
                ? t.booking.step2Title
                : step === 3
                  ? t.booking.step3Title
                  : t.booking.step4Title,
        })}
      </div>

      {/* Wizard Step Indicator */}
      <nav aria-label="Booking steps" className="border-b border-border/60 pb-4">
        <ol className="flex items-center justify-between gap-2 sm:gap-4">
          {[
            { num: 1, title: t.booking.step1Indicator },
            { num: 2, title: t.booking.step2Indicator },
            { num: 3, title: t.booking.step3Indicator },
            { num: 4, title: t.booking.step4Indicator },
          ].map((st) => {
            const isActive = step === st.num;
            const isDone = step > st.num;

            return (
              <li
                key={st.num}
                className={cn(
                  "flex items-center gap-2 text-xs font-semibold sm:text-sm",
                  isActive ? "text-primary" : isDone ? "text-emerald" : "text-muted/60",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-bold sm:size-7",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isDone
                        ? "bg-emerald text-white"
                        : "bg-surface-muted text-muted",
                  )}
                >
                  {isDone ? <CheckIcon className="size-3.5" /> : st.num}
                </span>
                <span className="hidden sm:inline">{st.title.replace(/^\d\.\s/, "")}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      {submissionError && (
        <Alert variant="error" title={t.booking.errorSubmissionTitle}>
          {submissionError}
        </Alert>
      )}

      {/* STEP 1: Select Services */}
      {step === 1 && (
        <div className="space-y-6 text-start">
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-semibold text-primary">
              {t.booking.step1Title}
            </h3>
            <p className="text-sm text-muted">{t.booking.step1Desc}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((srv) => {
              const isSelected = selectedServiceIds.includes(srv.id);
              const loc = getLocalizedService(srv, locale);

              return (
                <button
                  key={srv.id}
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  onClick={() => toggleService(srv.id)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      toggleService(srv.id);
                    }
                  }}
                  className={cn(
                    "w-full cursor-pointer rounded-card border p-4 text-start transition-all",
                    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-subtle"
                      : "border-border bg-surface hover:border-primary/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="pe-2">
                      <h4 className="text-base font-semibold text-primary">{loc.name}</h4>
                      {loc.short_description && (
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          {loc.short_description}
                        </p>
                      )}
                      <div className="mt-2.5">
                        <Badge variant="neutral" size="sm">
                          {srv.duration_minutes} {t.common.minutes}
                        </Badge>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded border",
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-surface",
                      )}
                    >
                      {isSelected && <CheckIcon className="size-3.5" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <span className="text-sm font-medium text-foreground">
              {t.booking.selectedServicesCount}{" "}
              <span className="font-bold text-primary">{selectedServices.length}</span> (
              {totalDuration} {t.common.minutes})
            </span>
            <Button
              variant="primary"
              size="md"
              disabled={selectedServiceIds.length === 0}
              onClick={() => setStep(2)}
            >
              {t.booking.continueToDateTime}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Interactive Calendar & Slot Picker */}
      {step === 2 && (
        <div className="space-y-6 text-start">
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-semibold text-primary">
              {t.booking.step2Title}
            </h3>
            <p className="text-sm text-muted">{t.booking.step2Desc}</p>
          </div>

          <InteractiveCalendar
            serviceIds={selectedServiceIds}
            totalDurationMinutes={totalDuration}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelectSlot={handleSelectSlot}
          />

          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <Button variant="outline" size="md" onClick={() => setStep(1)}>
              {t.booking.backToServices}
            </Button>
            <div className="flex items-center gap-3">
              {selectedDate && selectedTime && (
                <span className="hidden text-xs font-medium text-muted sm:inline">
                  {interpolate(t.booking.selectedSlotDisplay, {
                    date: selectedDate,
                    time: selectedTime,
                  })}
                </span>
              )}
              <Button
                variant="primary"
                size="md"
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(3)}
              >
                {t.booking.continueToContact}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Contact Information */}
      {step === 3 && (
        <div className="space-y-6 text-start">
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-semibold text-primary">
              {t.booking.step3Title}
            </h3>
            <p className="text-sm text-muted">{t.booking.step3Desc}</p>
          </div>

          <Card variant="default" className="space-y-5 p-6">
            <Input
              id="booking-name"
              label={t.booking.fullNameLabel}
              required
              placeholder={t.booking.fullNamePlaceholder}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              hint={t.booking.fullNameHint}
            />

            <Input
              id="booking-phone"
              type="tel"
              label={t.booking.phoneLabel}
              required
              placeholder={t.booking.phonePlaceholder}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              hint={t.booking.phoneHint}
              dir="ltr"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="booking-email"
                type="email"
                label={t.booking.emailLabel}
                placeholder={t.booking.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                hint={t.booking.emailHint}
                dir="ltr"
              />

              <Select
                id="booking-contact-method"
                label={t.booking.contactMethodLabel}
                value={preferredContactMethod}
                onChange={(e) => setPreferredContactMethod(e.target.value as ContactMethod)}
                options={[
                  { value: "phone", label: t.booking.methodPhone },
                  { value: "whatsapp", label: t.booking.methodWhatsApp },
                  { value: "email", label: t.booking.methodEmail },
                ]}
              />
            </div>

            <Textarea
              id="booking-message"
              label={t.booking.topicLabel}
              rows={3}
              placeholder={t.booking.topicPlaceholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              hint={t.booking.topicHint}
            />
          </Card>

          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <Button variant="outline" size="md" onClick={() => setStep(2)}>
              {t.booking.backToSchedule}
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={customerName.trim().length === 0 || phoneNumber.trim().length < 5}
              onClick={() => setStep(4)}
            >
              {t.booking.reviewBooking}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Review and Submit */}
      {step === 4 && (
        <form onSubmit={handleSubmitBooking} className="space-y-6 text-start">
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-semibold text-primary">
              {t.booking.step4Title}
            </h3>
            <p className="text-sm text-muted">{t.booking.step4Desc}</p>
          </div>

          <Card variant="muted" className="space-y-4 p-6">
            <div className="flex justify-between border-b border-border/60 pb-3">
              <span className="text-sm text-muted">{t.booking.summaryServices}</span>
              <span className="text-end text-sm font-semibold text-primary">
                {selectedServices.map((s) => getLocalizedService(s, locale).name).join(", ")} (
                {totalDuration} {t.common.minutes})
              </span>
            </div>

            <div className="flex justify-between border-b border-border/60 pb-3">
              <span className="text-sm text-muted">{t.booking.summaryDateTime}</span>
              <span className="text-end text-sm font-semibold text-primary" dir="ltr">
                {selectedDate} at {selectedTime} (Asia/Kolkata IST)
              </span>
            </div>

            <div className="flex justify-between border-b border-border/60 pb-3">
              <span className="text-sm text-muted">{t.booking.summaryApplicant}</span>
              <span className="text-end text-sm font-semibold text-foreground">{customerName}</span>
            </div>

            <div className="flex justify-between border-b border-border/60 pb-3">
              <span className="text-sm text-muted">{t.booking.summaryContact}</span>
              <span className="text-end text-sm font-semibold text-foreground">
                <bdi dir="ltr">{phoneNumber}</bdi> (
                {preferredContactMethod === "phone"
                  ? t.booking.methodPhone
                  : preferredContactMethod === "whatsapp"
                    ? t.booking.methodWhatsApp
                    : t.booking.methodEmail}
                )
              </span>
            </div>

            {email && (
              <div className="flex justify-between border-b border-border/60 pb-3">
                <span className="text-sm text-muted">{t.booking.summaryEmail}</span>
                <span className="text-end text-sm font-semibold text-foreground" dir="ltr">
                  <bdi>{email}</bdi>
                </span>
              </div>
            )}

            {message && (
              <div className="pt-1">
                <span className="text-xs text-muted">{t.booking.summaryNote}</span>
                <p className="mt-1 text-xs text-foreground/80 italic">{message}</p>
              </div>
            )}
          </Card>

          <div className="rounded-control border border-border/80 bg-surface p-4">
            <Checkbox
              id="booking-consent"
              label={t.booking.consentLabel}
              description={t.booking.consentDesc}
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              required
            />
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={isSubmitting}
              onClick={() => setStep(3)}
            >
              {t.booking.editContactInfo}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              disabled={!consentGiven || isSubmitting}
            >
              {isSubmitting ? t.booking.submitting : t.booking.confirmAndSubmit}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
