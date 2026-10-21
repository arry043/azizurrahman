"use client";

import { useState } from "react";

import { InteractiveCalendar } from "@/components/calendar/interactive-calendar";
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
import { cn } from "@/lib/utils";
import type { ContactMethod, PublicAppointmentReceipt, PublicService } from "@/types/domain";

export interface BookingFormProps {
  services: PublicService[];
  preselectedServiceSlug?: string;
  className?: string;
}

export function BookingForm({ services, preselectedServiceSlug, className }: BookingFormProps) {
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
      setSubmissionError("Please confirm your acknowledgment of the consultation notice.");
      return;
    }
    if (!selectedDate || !selectedTime) {
      setSubmissionError("Please select an available consultation date and start time.");
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
        throw new Error(data.error || "Failed to submit booking request");
      }

      setCompletedReceipt(data.receipt);
    } catch (err) {
      setSubmissionError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while booking. Please try again.",
      );
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
    return (
      <div className={cn("mx-auto max-w-2xl space-y-8", className)}>
        <Card variant="elevated" className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald/10 text-emerald">
              <CheckIcon className="size-8" />
            </div>
            <h3 className="mt-4 font-display text-2xl font-semibold text-primary sm:text-3xl">
              Consultation Request Received
            </h3>
            <Ornament className="justify-center" />
            <p className="mt-2 text-sm leading-relaxed text-muted">
              JazakAllah Khair. Your consultation request has been successfully recorded in our
              system and is currently awaiting schedule review.
            </p>
          </div>

          {/* Reference Banner */}
          <div className="rounded-control border-2 border-accent/60 bg-cream/50 p-5 text-center">
            <span className="text-xs font-semibold tracking-wider text-accent-strong uppercase">
              Your Public Appointment Reference
            </span>
            <div className="mt-1 flex items-center justify-center gap-3">
              <span className="font-mono text-2xl font-bold tracking-wider text-primary sm:text-3xl">
                {completedReceipt.public_reference}
              </span>
              <button
                type="button"
                onClick={handleCopyReference}
                aria-label="Copy reference code"
                className="flex size-9 items-center justify-center rounded-control border border-border bg-surface text-primary hover:bg-surface-muted focus-visible:outline-3 focus-visible:outline-focus"
              >
                {copied ? (
                  <CheckIcon className="size-4 text-emerald" />
                ) : (
                  <CopyIcon className="size-4" />
                )}
              </button>
            </div>
            {copied && (
              <p className="mt-1 text-xs font-medium text-emerald">Copied to clipboard!</p>
            )}
          </div>

          {/* Appointment Details Summary */}
          <div className="space-y-3 rounded-control border border-border/80 bg-surface-muted/30 p-5 text-sm">
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted">Status:</span>
              <Badge variant="warning" size="sm">
                Request Pending Review
              </Badge>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted">Applicant Name:</span>
              <span className="font-medium text-foreground">{completedReceipt.customer_name}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted">Date:</span>
              <span className="font-medium text-foreground">
                {new Date(completedReceipt.appointment_start).toLocaleDateString("en-US", {
                  timeZone: completedReceipt.timezone,
                  weekday: "short",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted">Time:</span>
              <span className="font-medium text-foreground">
                {new Date(completedReceipt.appointment_start).toLocaleTimeString("en-US", {
                  timeZone: completedReceipt.timezone,
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                –{" "}
                {new Date(completedReceipt.appointment_end).toLocaleTimeString("en-US", {
                  timeZone: completedReceipt.timezone,
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                ({completedReceipt.timezone})
              </span>
            </div>
            <div className="pt-1">
              <span className="text-muted">Requested Guidance Services:</span>
              <ul className="mt-1 list-inside list-disc space-y-1 text-foreground">
                {completedReceipt.services.map((srv, idx) => (
                  <li key={idx}>
                    {srv.service_name_snapshot} ({srv.duration_minutes_snapshot} mins)
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Alert variant="info" title="Important Note Regarding Status">
            This receipt reflects your initial request. A confirmed slot notification will be
            communicated via your provided contact number. Please save your reference code above for
            direct inquiries.
          </Alert>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <LinkButton
              href={`/appointments/${completedReceipt.public_reference}`}
              variant="primary"
              size="md"
            >
              View Printable Receipt
            </LinkButton>
            <Button
              variant="outline"
              size="md"
              onClick={() => window.print()}
              leftIcon={<PrinterIcon className="size-4" />}
            >
              Print Receipt
            </Button>
            <LinkButton href="/" variant="ghost" size="md">
              Return Home
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
        Step {step} of 4:{" "}
        {step === 1
          ? "Choose Consultation Services"
          : step === 2
            ? "Select Consultation Date and Time"
            : step === 3
              ? "Enter Contact Information"
              : "Review and Confirm Request"}
      </div>

      {/* Wizard Step Indicator */}
      <nav aria-label="Booking steps" className="border-b border-border/60 pb-4">
        <ol className="flex items-center justify-between gap-2 sm:gap-4">
          {[
            { num: 1, title: "1. Select Service" },
            { num: 2, title: "2. Date & Time" },
            { num: 3, title: "3. Contact Info" },
            { num: 4, title: "4. Review & Confirm" },
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
        <Alert variant="error" title="Submission Error">
          {submissionError}
        </Alert>
      )}

      {/* STEP 1: Select Services */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-semibold text-primary">
              Choose Consultation Services
            </h3>
            <p className="text-sm text-muted">
              Select one or more guidance categories. You can combine multiple services into a
              single consultation session.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((srv) => {
              const isSelected = selectedServiceIds.includes(srv.id);

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
                    "w-full cursor-pointer rounded-card border p-4 text-left transition-all",
                    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-subtle"
                      : "border-border bg-surface hover:border-primary/50",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="pr-2">
                      <h4 className="text-base font-semibold text-primary">{srv.name}</h4>
                      {srv.short_description && (
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          {srv.short_description}
                        </p>
                      )}
                      <div className="mt-2.5">
                        <Badge variant="neutral" size="sm">
                          {srv.duration_minutes} mins
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
              Selected Services:{" "}
              <span className="font-bold text-primary">{selectedServices.length}</span> (
              {totalDuration} mins)
            </span>
            <Button
              variant="primary"
              size="md"
              disabled={selectedServiceIds.length === 0}
              onClick={() => setStep(2)}
            >
              Continue to Date &amp; Time →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Interactive Calendar & Slot Picker */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-semibold text-primary">
              Select Consultation Date &amp; Time
            </h3>
            <p className="text-sm text-muted">
              Choose an available date within the 60-day horizon and pick a consultation start time.
            </p>
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
              ← Back to Services
            </Button>
            <div className="flex items-center gap-3">
              {selectedDate && selectedTime && (
                <span className="hidden text-xs font-medium text-muted sm:inline">
                  Selected: {selectedDate} at {selectedTime}
                </span>
              )}
              <Button
                variant="primary"
                size="md"
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(3)}
              >
                Continue to Contact Details →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Contact Information */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-semibold text-primary">
              Contact Information
            </h3>
            <p className="text-sm text-muted">
              Please provide your direct contact number so the consultation coordinator can reach
              you.
            </p>
          </div>

          <Card variant="default" className="space-y-5 p-6">
            <Input
              id="booking-name"
              label="Your Full Name"
              required
              placeholder="e.g. Mohammed Abdullah"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              hint="The name the provider should use when greeting you."
            />

            <Input
              id="booking-phone"
              type="tel"
              label="Mobile / WhatsApp Number"
              required
              placeholder="+91 98765 43210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              hint="Include country code (e.g. +91 for India). Used to verify and coordinate your slot."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="booking-email"
                type="email"
                label="Email Address (Optional)"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                hint="For consultation confirmations and receipt copies."
              />

              <Select
                id="booking-contact-method"
                label="Preferred Contact Method"
                value={preferredContactMethod}
                onChange={(e) => setPreferredContactMethod(e.target.value as ContactMethod)}
                options={[
                  { value: "phone", label: "Direct Phone Call" },
                  { value: "whatsapp", label: "WhatsApp Message" },
                  { value: "email", label: "Email" },
                ]}
              />
            </div>

            <Textarea
              id="booking-message"
              label="Brief Consultation Topic (Optional)"
              rows={3}
              placeholder="Briefly state the general guidance area (e.g. family counsel, dua guidance, personal supplication)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              hint="Please keep sensitive private family matters for the direct private consultation session (Max 1000 characters)."
            />
          </Card>

          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <Button variant="outline" size="md" onClick={() => setStep(2)}>
              ← Back to Schedule
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={customerName.trim().length === 0 || phoneNumber.trim().length < 5}
              onClick={() => setStep(4)}
            >
              Review Booking →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Review and Submit */}
      {step === 4 && (
        <form onSubmit={handleSubmitBooking} className="space-y-6">
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-semibold text-primary">
              Review and Confirm Request
            </h3>
            <p className="text-sm text-muted">
              Please verify your consultation details before final submission.
            </p>
          </div>

          <Card variant="muted" className="space-y-4 p-6">
            <div className="flex justify-between border-b border-border/60 pb-3">
              <span className="text-sm text-muted">Services:</span>
              <span className="text-right text-sm font-semibold text-primary">
                {selectedServices.map((s) => s.name).join(", ")} ({totalDuration} mins)
              </span>
            </div>

            <div className="flex justify-between border-b border-border/60 pb-3">
              <span className="text-sm text-muted">Date &amp; Time:</span>
              <span className="text-right text-sm font-semibold text-primary">
                {selectedDate} at {selectedTime} (Asia/Kolkata IST)
              </span>
            </div>

            <div className="flex justify-between border-b border-border/60 pb-3">
              <span className="text-sm text-muted">Applicant:</span>
              <span className="text-right text-sm font-semibold text-foreground">
                {customerName}
              </span>
            </div>

            <div className="flex justify-between border-b border-border/60 pb-3">
              <span className="text-sm text-muted">Contact:</span>
              <span className="text-right text-sm font-semibold text-foreground">
                {phoneNumber} ({preferredContactMethod})
              </span>
            </div>

            {email && (
              <div className="flex justify-between border-b border-border/60 pb-3">
                <span className="text-sm text-muted">Email:</span>
                <span className="text-right text-sm font-semibold text-foreground">{email}</span>
              </div>
            )}

            {message && (
              <div className="pt-1">
                <span className="text-xs text-muted">Note:</span>
                <p className="mt-1 text-xs text-foreground/80 italic">{message}</p>
              </div>
            )}
          </Card>

          <div className="rounded-control border border-border/80 bg-surface p-4">
            <Checkbox
              id="booking-consent"
              label="Consultation Notice & Privacy Acknowledgment"
              description="I confirm that the details provided are accurate and understand that consultation slots are subject to confirmation by the provider in accordance with the ethical consultation policy."
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
              ← Edit Contact Info
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              disabled={!consentGiven || isSubmitting}
            >
              {isSubmitting ? "Submitting Request..." : "Confirm & Submit Request"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
