"use client";

import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  CheckIcon,
  InfoIcon,
  LockIcon,
  PhoneIcon,
  PrinterIcon,
  SearchIcon,
  ShieldCheckIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { LinkButton } from "@/components/ui/link-button";
import { scholarProfile } from "@/config/scholar-profile";
import { useTranslations } from "@/i18n/client";
import type { PublicAppointmentReceipt } from "@/types/domain";

export function LookupForm() {
  const { t, locale } = useTranslations();
  const isUr = locale === "ur";

  const [reference, setReference] = useState("");
  const [contact, setContact] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const [step, setStep] = useState<"initiate" | "challenge" | "verified">("initiate");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const [verifiedReceipt, setVerifiedReceipt] = useState<
    (PublicAppointmentReceipt & { customer_name: string; created_at: string }) | null
  >(null);

  // If local dev returns simulated token for testing
  const [devSimulatedCode, setDevSimulatedCode] = useState<string | null>(null);

  async function handleInitiate(e: FormEvent) {
    e.preventDefault();
    if (!reference.trim() || !contact.trim()) {
      setErrorMessage(t.lookup.errorEmptyInputs);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setStatusNotice(null);

    try {
      const res = await fetch("/api/appointments/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initiate",
          publicReference: reference.trim().toUpperCase(),
          contact: contact.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.lookup.errorFailedInitiate);
      }

      if (data.providerPending) {
        setStatusNotice(data.message);
        return;
      }

      if (data.simulatedTokenForTesting) {
        setDevSimulatedCode(data.simulatedTokenForTesting);
      }

      setStatusNotice(data.message);
      setStep("challenge");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t.lookup.errorFailedInitiate);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setErrorMessage(t.lookup.errorEmptyToken);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/appointments/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          publicReference: reference.trim().toUpperCase(),
          token: verificationCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || t.lookup.errorInvalidCode);
      }

      setVerifiedReceipt(data.receipt);
      setStep("verified");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t.lookup.errorInvalidCode);
    } finally {
      setLoading(false);
    }
  }

  // ── Verified Receipt State ──────────────────────────────────────────────────────────────
  if (step === "verified" && verifiedReceipt) {
    const isPending = verifiedReceipt.status === "pending";
    const isConfirmed = verifiedReceipt.status === "confirmed";
    const isCancelled = verifiedReceipt.status === "cancelled";
    const isDeclined = verifiedReceipt.status === "declined";

    const formattedDate = new Date(verifiedReceipt.appointment_start).toLocaleDateString(
      isUr ? "ur-PK" : "en-US",
      {
        timeZone: verifiedReceipt.timezone,
        weekday: "short",
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );

    const startTimeFormatted = new Date(verifiedReceipt.appointment_start).toLocaleTimeString(
      isUr ? "ur-PK" : "en-US",
      {
        timeZone: verifiedReceipt.timezone,
        hour: "2-digit",
        minute: "2-digit",
      },
    );

    const endTimeFormatted = new Date(verifiedReceipt.appointment_end).toLocaleTimeString(
      isUr ? "ur-PK" : "en-US",
      {
        timeZone: verifiedReceipt.timezone,
        hour: "2-digit",
        minute: "2-digit",
      },
    );

    const statusBadgeLabel = isConfirmed
      ? t.lookup.statusConfirmed
      : isPending
        ? t.lookup.statusPending
        : isCancelled
          ? t.lookup.statusCancelled
          : isDeclined
            ? t.lookup.statusDeclined
            : verifiedReceipt.status;

    return (
      <Card variant="elevated" className="space-y-6 p-6 text-start sm:p-8">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-emerald uppercase">
            <CheckIcon className="size-4" />
            <span>{t.lookup.identityVerified}</span>
          </div>
          <CardTitle className="text-2xl">{t.lookup.detailsTitle}</CardTitle>
          <p className="mt-1 text-xs text-muted sm:text-sm">{t.lookup.detailsSubtitle}</p>
        </div>

        <div className="rounded-control border-2 border-accent/60 bg-cream/50 p-4 text-center">
          <span className="text-xs font-semibold tracking-wider text-accent-strong uppercase">
            {t.lookup.referenceHeading}
          </span>
          <p className="font-mono text-2xl font-bold tracking-wider text-primary" dir="ltr">
            <bdi>{verifiedReceipt.public_reference}</bdi>
          </p>
        </div>

        <div className="space-y-3 rounded-control border border-border bg-surface-muted/30 p-5 text-sm">
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">{t.lookup.currentStatus}</span>
            <Badge variant={isConfirmed ? "success" : isPending ? "warning" : "neutral"} size="sm">
              {statusBadgeLabel}
            </Badge>
          </div>

          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">{t.booking.receiptApplicantLabel}</span>
            <span className="font-medium text-foreground">{verifiedReceipt.customer_name}</span>
          </div>

          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">{t.lookup.scheduledDate}</span>
            <span className="font-medium text-foreground">{formattedDate}</span>
          </div>

          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">{t.lookup.consultationTime}</span>
            <span className="font-medium text-foreground">
              <bdi dir="ltr">{startTimeFormatted}</bdi> – <bdi dir="ltr">{endTimeFormatted}</bdi> (
              {verifiedReceipt.timezone})
            </span>
          </div>

          <div className="pt-1">
            <span className="text-muted">{t.lookup.requestedServices}</span>
            <ul className="mt-1 list-inside list-disc space-y-1 text-foreground">
              {verifiedReceipt.services.map((srv, idx) => (
                <li key={idx}>
                  {srv.service_name_snapshot} ({srv.duration_minutes_snapshot} {t.common.minutes})
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <LinkButton
            href={`/appointments/${verifiedReceipt.public_reference}`}
            variant="primary"
            size="md"
          >
            {t.lookup.openDedicatedReceipt}
          </LinkButton>
          <Button
            variant="outline"
            size="md"
            onClick={() => window.print()}
            leftIcon={<PrinterIcon className="size-4" />}
          >
            {t.common.print}
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              setStep("initiate");
              setVerifiedReceipt(null);
              setVerificationCode("");
            }}
          >
            {t.lookup.lookupAnother}
          </Button>
        </div>
      </Card>
    );
  }

  // ── Step 2: Verification Challenge Form ──────────────────────────────────────────────────
  if (step === "challenge") {
    return (
      <Card variant="elevated" className="space-y-6 p-6 text-start sm:p-8">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-accent-strong uppercase">
            <LockIcon className="size-4" />
            <span>{t.lookup.step2Kicker}</span>
          </div>
          <CardTitle className="text-2xl">{t.lookup.step2Title}</CardTitle>
          <p className="mt-1 text-xs text-muted sm:text-sm">{t.lookup.step2Desc}</p>
        </div>

        {statusNotice && (
          <Alert variant="info" title={t.lookup.dispatchedTitle}>
            {statusNotice}
          </Alert>
        )}

        {devSimulatedCode && (
          <Alert variant="warning" title={t.lookup.devCodeTitle}>
            <p className="text-xs">
              {t.lookup.devCodeDescription}{" "}
              <strong className="font-mono text-sm font-bold text-primary" dir="ltr">
                <bdi>{devSimulatedCode}</bdi>
              </strong>
            </p>
          </Alert>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            id="lookup-token"
            label={t.lookup.tokenLabel}
            placeholder="123456"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            required
            autoComplete="one-time-code"
            hint={t.lookup.tokenHint}
            dir="ltr"
          />

          {errorMessage && (
            <p role="alert" className="text-xs font-medium text-error">
              {errorMessage}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                setStep("initiate");
                setErrorMessage(null);
              }}
            >
              {isUr ? "واپس →" : "← Back"}
            </Button>
            <Button type="submit" variant="primary" size="lg" loading={loading} disabled={loading}>
              {loading ? t.lookup.verifying : t.lookup.verifyAndView}
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  // ── Step 1: Initial Reference & Contact Form ─────────────────────────────────────────────
  const waDefaultMessage = isUr
    ? scholarProfile.contact.whatsapp.defaultMessageUr
    : scholarProfile.contact.whatsapp.defaultMessageEn;

  return (
    <Card variant="elevated" className="space-y-6 p-6 text-start sm:p-8">
      <div>
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-accent-strong uppercase">
          <ShieldCheckIcon className="size-4" />
          <span>{t.lookup.kicker}</span>
        </div>
        <CardTitle className="text-2xl">{t.lookup.title}</CardTitle>
        <p className="mt-1 text-xs text-muted sm:text-sm">{t.lookup.description}</p>

        <div className="mt-3.5 rounded-control border border-accent/40 bg-cream/40 p-3 text-xs text-muted">
          <p className="font-semibold text-primary">{t.lookup.selfServiceStatusTitle}</p>
          <p className="mt-0.5 leading-relaxed">{t.lookup.selfServiceStatusNotice}</p>
        </div>
      </div>

      <form onSubmit={handleInitiate} className="space-y-4">
        <Input
          id="lookup-reference"
          label={t.lookup.referenceLabel}
          placeholder={t.lookup.referencePlaceholder}
          value={reference}
          onChange={(e) => {
            setReference(e.target.value);
            setErrorMessage(null);
            setStatusNotice(null);
          }}
          hint={t.lookup.referenceHint}
          required
          dir="ltr"
        />

        <Input
          id="lookup-contact"
          label={t.lookup.contactLabel}
          placeholder={t.lookup.contactPlaceholder}
          value={contact}
          onChange={(e) => {
            setContact(e.target.value);
            setErrorMessage(null);
            setStatusNotice(null);
          }}
          hint={t.lookup.contactHint}
          required
          dir="ltr"
        />

        {errorMessage && (
          <p role="alert" className="text-xs font-medium text-error">
            {errorMessage}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          disabled={loading}
          leftIcon={<SearchIcon className="size-4" />}
        >
          {loading ? t.lookup.checking : t.lookup.verifyAndRetrieve}
        </Button>
      </form>

      <div className="border-t border-border/70 pt-4 text-xs text-muted">
        <p className="font-semibold text-primary">{t.lookup.privacyGuaranteeTitle}</p>
        <p className="mt-0.5 text-muted">{t.lookup.privacyGuaranteeNotice}</p>
      </div>

      {statusNotice && (
        <Alert
          variant="info"
          title={t.lookup.assistanceTitle}
          icon={<InfoIcon className="size-5 text-primary" />}
        >
          <p className="text-xs leading-relaxed text-muted sm:text-sm">{statusNotice}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <LinkButton href="/contact" variant="secondary" size="sm">
              {t.lookup.contactDesk}
            </LinkButton>
            <a
              href={`tel:${scholarProfile.contact.phone.internationalCandidate}`}
              className="inline-flex items-center gap-1.5 rounded-control border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <PhoneIcon className="size-3.5 text-accent-strong" />
              <span>{t.lookup.callDesk}</span>
            </a>
            <a
              href={`https://wa.me/${scholarProfile.contact.phone.internationalCandidate.replace(/\D/g, "")}?text=${encodeURIComponent(
                waDefaultMessage,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-800 dark:text-emerald-200 inline-flex items-center gap-1.5 rounded-control border border-emerald/40 bg-emerald/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-emerald/20 focus-visible:ring-2 focus-visible:ring-emerald focus-visible:outline-none"
            >
              <WhatsAppIcon className="size-3.5 text-emerald" />
              <span>{t.lookup.whatsappDesk}</span>
            </a>
          </div>
        </Alert>
      )}
    </Card>
  );
}
