"use client";

import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateSiteSettingsAction } from "@/lib/admin/settings-actions";
import type { SettingsInput } from "@/lib/admin/settings-admin-service";
import type { SiteSettingsRow } from "@/types/domain";

interface SettingsFormProps {
  initialSettings: SiteSettingsRow;
}

export function SiteSettingsForm({ initialSettings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [showHighImpactConfirm, setShowHighImpactConfirm] = useState(false);

  const [horizonDays, setHorizonDays] = useState(initialSettings.booking_horizon_days);
  const [minNoticeMins, setMinNoticeMins] = useState(initialSettings.min_advance_notice_minutes);
  const [slotIntervalMins, setSlotIntervalMins] = useState(initialSettings.slot_interval_minutes);

  const [phone, setPhone] = useState(initialSettings.public_phone || "");
  const [whatsapp, setWhatsapp] = useState(initialSettings.public_whatsapp || "");
  const [email, setEmail] = useState(initialSettings.public_email || "");
  const [address, setAddress] = useState(initialSettings.public_address || "");
  const [hoursText, setHoursText] = useState(initialSettings.consultation_hours_text || "");
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    initialSettings.whatsapp_message_template || "",
  );

  // Detect whether core scheduling parameters changed
  const schedulingParametersChanged =
    horizonDays !== initialSettings.booking_horizon_days ||
    minNoticeMins !== initialSettings.min_advance_notice_minutes ||
    slotIntervalMins !== initialSettings.slot_interval_minutes;

  function handleSave(force = false) {
    if (schedulingParametersChanged && !force && !showHighImpactConfirm) {
      setShowHighImpactConfirm(true);
      return;
    }

    setFeedback(null);
    setShowHighImpactConfirm(false);

    const input: SettingsInput = {
      booking_horizon_days: Number(horizonDays),
      min_advance_notice_minutes: Number(minNoticeMins),
      slot_interval_minutes: Number(slotIntervalMins),
      public_phone: phone.trim() || null,
      public_whatsapp: whatsapp.trim() || null,
      public_email: email.trim() || null,
      public_address: address.trim() || null,
      consultation_hours_text: hoursText.trim() || null,
      whatsapp_message_template: whatsappTemplate.trim() || null,
    };

    startTransition(async () => {
      const res = await updateSiteSettingsAction(input);

      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to update settings." });
      } else {
        setFeedback({ type: "success", message: "Site settings updated successfully." });
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave(false);
      }}
      className="space-y-6"
    >
      {feedback && (
        <Alert variant={feedback.type === "success" ? "info" : "error"}>{feedback.message}</Alert>
      )}

      {/* High-Impact Confirmation Alert */}
      {showHighImpactConfirm && (
        <div className="space-y-3 rounded-lg border border-warning bg-warning/10 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-warning">
            <span>⚠</span>
            <span>Confirm High-Impact Scheduling Changes</span>
          </div>
          <p className="text-xs leading-relaxed text-foreground">
            You have altered core scheduling parameters (Slot Interval, Booking Horizon, or Advance
            Notice). Modifying these values immediately recalculates bookable appointment slots
            across the public website.
          </p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={isPending}
              onClick={() => handleSave(true)}
              className="min-h-[44px] w-full sm:w-auto"
            >
              Confirm and Apply Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setShowHighImpactConfirm(false)}
              className="min-h-[44px] w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Scheduling Engine Parameters */}
      <Card className="space-y-5 border-border bg-surface p-6 shadow-card">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Scheduling & Booking Horizon Parameters
          </h2>
          <p className="text-foreground-muted text-xs">
            These settings govern the availability engine algorithm and slot generation.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Input
            label="Booking Horizon (Days)"
            type="number"
            min={1}
            max={365}
            value={horizonDays}
            onChange={(e) => setHorizonDays(Number(e.target.value))}
            required
            hint="How many days in advance visitors can book (e.g. 60)."
          />

          <Input
            label="Min Advance Notice (Minutes)"
            type="number"
            min={0}
            max={43200}
            value={minNoticeMins}
            onChange={(e) => setMinNoticeMins(Number(e.target.value))}
            required
            hint="Lead time before an appointment (e.g. 1440 = 24 hrs)."
          />

          <Input
            label="Slot Interval (Minutes)"
            type="number"
            min={5}
            max={240}
            value={slotIntervalMins}
            onChange={(e) => setSlotIntervalMins(Number(e.target.value))}
            required
            hint="Time between slot start times (e.g. 30 mins)."
          />
        </div>
      </Card>

      {/* Public Contact Information */}
      <Card className="space-y-5 border-border bg-surface p-6 shadow-card">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Public Contact & Business Information
          </h2>
          <p className="text-foreground-muted text-xs">
            Displayed across header, footer, contact page, and appointment receipts.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Public Phone (E.164)"
            placeholder="+919876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            hint="Must include country code (e.g. +91...)"
          />

          <Input
            label="Public WhatsApp (E.164)"
            placeholder="+919876543210"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            hint="For direct WhatsApp chat links"
          />

          <Input
            label="Public Contact Email"
            type="email"
            placeholder="contact@azizurrahman.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Consultation Hours Text"
            placeholder="e.g. Mon–Sat: 10:00 AM – 7:00 PM IST"
            value={hoursText}
            onChange={(e) => setHoursText(e.target.value)}
            hint="Summary shown in contact cards and footer"
          />
        </div>

        <Textarea
          label="Physical Consultation Address"
          placeholder="Consultation office address, landmarks, city, pin code..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          maxLength={500}
        />

        <Textarea
          label="Default WhatsApp Pre-filled Inquiry Template"
          placeholder="e.g. Assalamu Alaikum, I would like to inquire about scheduling a consultation with AZIZURRAHMAN."
          value={whatsappTemplate}
          onChange={(e) => setWhatsappTemplate(e.target.value)}
          rows={2}
          maxLength={500}
          hint="Text pre-populated when a visitor clicks 'Chat on WhatsApp'."
        />
      </Card>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          variant="primary"
          loading={isPending}
          className="min-h-[44px] w-full sm:w-auto"
        >
          Save Settings
        </Button>
      </div>
    </form>
  );
}
