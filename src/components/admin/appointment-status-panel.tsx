"use client";

import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { updateAppointmentStatusAction } from "@/lib/admin/appointment-actions";
import { ALLOWED_STATUS_TRANSITIONS } from "@/lib/booking/status";
import type { AppointmentStatus } from "@/types/domain";

interface StatusPanelProps {
  appointmentId: string;
  currentStatus: AppointmentStatus;
}

const ACTION_LABELS: Record<
  AppointmentStatus,
  { label: string; variant: "primary" | "secondary" | "destructive" | "outline" }
> = {
  confirmed: { label: "Confirm Appointment", variant: "primary" },
  reschedule_requested: { label: "Request Reschedule", variant: "secondary" },
  declined: { label: "Decline Appointment", variant: "destructive" },
  cancelled: { label: "Cancel Appointment", variant: "destructive" },
  pending: { label: "Reset to Pending", variant: "outline" },
};

export function AppointmentStatusPanel({ appointmentId, currentStatus }: StatusPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AppointmentStatus | null>(null);
  const [reason, setReason] = useState("");

  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

  if (allowed.length === 0) {
    return (
      <div className="text-foreground-muted rounded-md border border-border bg-surface-muted/40 p-4 text-sm">
        <p className="font-semibold text-foreground">Terminal Status</p>
        <p className="mt-1 text-xs">
          This appointment is in a terminal state (
          <span className="font-semibold">{currentStatus}</span>). No further status transitions are
          permitted by business rules.
        </p>
      </div>
    );
  }

  function handleTransition(targetStatus: AppointmentStatus) {
    setError(null);

    startTransition(async () => {
      const result = await updateAppointmentStatusAction({
        appointmentId,
        newStatus: targetStatus,
        expectedCurrentStatus: currentStatus,
        reason: reason.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error || "Failed to update appointment status.");
      } else {
        setConfirmTarget(null);
        setReason("");
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="error" title="Status Transition Failed">
          {error}
        </Alert>
      )}

      {confirmTarget ? (
        <div className="space-y-3 rounded-lg border border-warning/40 bg-warning/5 p-4">
          <p className="text-sm font-semibold text-foreground">
            Confirm transition to <span className="text-forest uppercase">{confirmTarget}</span>?
          </p>
          <p className="text-foreground-muted text-xs leading-relaxed">
            {confirmTarget === "cancelled" || confirmTarget === "declined"
              ? "This will release the reserved capacity on the consultation calendar. This action cannot be easily undone."
              : "The appointment status will be updated immediately in the database."}
          </p>

          <div>
            <label htmlFor="reason" className="mb-1 block text-xs font-medium text-foreground">
              Internal Reason (optional)
            </label>
            <input
              id="reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Client requested via telephone"
              className="min-h-[44px] w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-primary sm:min-h-[36px]"
            />
          </div>

          <div className="flex flex-col gap-2.5 pt-2 sm:flex-row sm:items-center">
            <Button
              variant={
                confirmTarget === "declined" || confirmTarget === "cancelled"
                  ? "destructive"
                  : "primary"
              }
              size="sm"
              loading={isPending}
              onClick={() => handleTransition(confirmTarget)}
              className="min-h-[44px] w-full sm:w-auto"
            >
              Confirm Status Change
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setConfirmTarget(null);
                setReason("");
              }}
              className="min-h-[44px] w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2.5">
          {allowed.map((target) => {
            const config = ACTION_LABELS[target] || { label: target, variant: "outline" };
            const isHighImpact = target === "declined" || target === "cancelled";

            return (
              <Button
                key={target}
                variant={config.variant}
                size="sm"
                disabled={isPending}
                onClick={() => {
                  if (isHighImpact) {
                    setConfirmTarget(target);
                  } else {
                    handleTransition(target);
                  }
                }}
                className="min-h-[44px] w-full sm:w-auto"
              >
                {config.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
