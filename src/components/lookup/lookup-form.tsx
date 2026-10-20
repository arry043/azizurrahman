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
  PrinterIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { LinkButton } from "@/components/ui/link-button";
import type { PublicAppointmentReceipt } from "@/types/domain";

export function LookupForm() {
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
      setErrorMessage("Please enter both your reference code and contact details.");
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
        throw new Error(data.error || "Failed to initiate verification challenge");
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
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while initiating lookup.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setErrorMessage("Please enter the verification code.");
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
        throw new Error(data.error || "Incorrect or expired verification code.");
      }

      setVerifiedReceipt(data.receipt);
      setStep("verified");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Verification failed. Please check your code and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Verified Receipt State ──────────────────────────────────────────────────────────────
  if (step === "verified" && verifiedReceipt) {
    const isPending = verifiedReceipt.status === "pending";
    const isConfirmed = verifiedReceipt.status === "confirmed";

    return (
      <Card variant="elevated" className="space-y-6 p-6 sm:p-8">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-emerald uppercase">
            <CheckIcon className="size-4" />
            <span>Identity Verified</span>
          </div>
          <CardTitle className="text-2xl">Consultation Request Details</CardTitle>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Retrieved securely via two-factor verification.
          </p>
        </div>

        <div className="rounded-control border-2 border-accent/60 bg-cream/50 p-4 text-center">
          <span className="text-xs font-semibold tracking-wider text-accent-strong uppercase">
            Appointment Reference
          </span>
          <p className="font-mono text-2xl font-bold tracking-wider text-primary">
            {verifiedReceipt.public_reference}
          </p>
        </div>

        <div className="space-y-3 rounded-control border border-border bg-surface-muted/30 p-5 text-sm">
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Current Status:</span>
            <Badge variant={isConfirmed ? "success" : isPending ? "warning" : "neutral"} size="sm">
              {isConfirmed
                ? "Appointment Confirmed"
                : isPending
                  ? "Pending Provider Review"
                  : verifiedReceipt.status}
            </Badge>
          </div>

          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Applicant Name:</span>
            <span className="font-medium text-foreground">{verifiedReceipt.customer_name}</span>
          </div>

          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Scheduled Date:</span>
            <span className="font-medium text-foreground">
              {new Date(verifiedReceipt.appointment_start).toLocaleDateString("en-US", {
                timeZone: verifiedReceipt.timezone,
                weekday: "short",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Consultation Time:</span>
            <span className="font-medium text-foreground">
              {new Date(verifiedReceipt.appointment_start).toLocaleTimeString("en-US", {
                timeZone: verifiedReceipt.timezone,
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              –{" "}
              {new Date(verifiedReceipt.appointment_end).toLocaleTimeString("en-US", {
                timeZone: verifiedReceipt.timezone,
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              ({verifiedReceipt.timezone})
            </span>
          </div>

          <div className="pt-1">
            <span className="text-muted">Requested Services:</span>
            <ul className="mt-1 list-inside list-disc space-y-1 text-foreground">
              {verifiedReceipt.services.map((srv, idx) => (
                <li key={idx}>
                  {srv.service_name_snapshot} ({srv.duration_minutes_snapshot} mins)
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
            Open Dedicated Receipt
          </LinkButton>
          <Button
            variant="outline"
            size="md"
            onClick={() => window.print()}
            leftIcon={<PrinterIcon className="size-4" />}
          >
            Print
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
            Lookup Another
          </Button>
        </div>
      </Card>
    );
  }

  // ── Step 2: Verification Challenge Form ──────────────────────────────────────────────────
  if (step === "challenge") {
    return (
      <Card variant="elevated" className="space-y-6 p-6 sm:p-8">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-accent-strong uppercase">
            <LockIcon className="size-4" />
            <span>Step 2: Enter Verification Code</span>
          </div>
          <CardTitle className="text-2xl">Confirm Your Identity</CardTitle>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Enter the 6-digit verification code sent to your contact channel.
          </p>
        </div>

        {statusNotice && (
          <Alert variant="info" title="Verification Dispatched">
            {statusNotice}
          </Alert>
        )}

        {devSimulatedCode && (
          <Alert variant="warning" title="Development Test Code">
            <p className="text-xs">
              Simulated verification code for testing:{" "}
              <strong className="font-mono text-sm font-bold text-primary">
                {devSimulatedCode}
              </strong>
            </p>
          </Alert>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            id="lookup-token"
            label="6-Digit Verification Code"
            placeholder="123456"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            required
            autoComplete="one-time-code"
            hint="The code is valid for 15 minutes. Maximum 5 attempts allowed."
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
              ← Back
            </Button>
            <Button type="submit" variant="primary" size="lg" loading={loading} disabled={loading}>
              {loading ? "Verifying..." : "Verify & View Appointment"}
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  // ── Step 1: Initial Reference & Contact Form ─────────────────────────────────────────────
  return (
    <Card variant="elevated" className="space-y-6 p-6 sm:p-8">
      <div>
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-accent-strong uppercase">
          <ShieldCheckIcon className="size-4" />
          <span>Secure Guest Verification</span>
        </div>
        <CardTitle className="text-2xl">Appointment Verification</CardTitle>
        <p className="mt-1 text-xs text-muted sm:text-sm">
          Enter your reference code and the contact details provided at booking.
        </p>
      </div>

      <form onSubmit={handleInitiate} className="space-y-4">
        <Input
          id="lookup-reference"
          label="Appointment Reference Code"
          placeholder="e.g. AZR-7K2QX-M9D4T"
          value={reference}
          onChange={(e) => {
            setReference(e.target.value);
            setErrorMessage(null);
            setStatusNotice(null);
          }}
          hint="Provided on your booking confirmation receipt"
          required
        />

        <Input
          id="lookup-contact"
          label="Phone Number or Email Address"
          placeholder="+91 98765 43210 or name@example.com"
          value={contact}
          onChange={(e) => {
            setContact(e.target.value);
            setErrorMessage(null);
            setStatusNotice(null);
          }}
          hint="Must match the contact details submitted with your request"
          required
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
          {loading ? "Checking..." : "Verify & Retrieve Details"}
        </Button>
      </form>

      <div className="border-t border-border/70 pt-4 text-xs text-muted">
        <p className="font-semibold text-primary">Privacy Guarantee</p>
        <p className="mt-0.5 text-muted">
          Your personal consultation notes and private records remain strictly confidential and are
          never shown to unverified visitors.
        </p>
      </div>

      {statusNotice && (
        <Alert
          variant="info"
          title="Direct Consultation Line Assistance"
          icon={<InfoIcon className="size-5 text-primary" />}
        >
          <p className="text-xs leading-relaxed text-muted sm:text-sm">{statusNotice}</p>
          <div className="mt-3">
            <LinkButton href="/contact" variant="secondary" size="sm">
              Contact Consultation Line
            </LinkButton>
          </div>
        </Alert>
      )}
    </Card>
  );
}
