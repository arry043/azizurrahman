"use client";

import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { updateAppointmentNotesAction } from "@/lib/admin/appointment-actions";

interface NotesEditorProps {
  appointmentId: string;
  initialNotes?: string | null;
}

export function AdminNotesEditor({ appointmentId, initialNotes = "" }: NotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes || "");
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const maxLength = 5000;
  const charsRemaining = maxLength - notes.length;
  const isTooLong = charsRemaining < 0;

  function handleSave() {
    setStatusMessage(null);

    startTransition(async () => {
      const result = await updateAppointmentNotesAction({
        appointmentId,
        notes,
      });

      if (!result.success) {
        setStatusMessage({
          type: "error",
          message: result.error || "Failed to save internal notes.",
        });
      } else {
        setStatusMessage({
          type: "success",
          message: "Private administrator notes saved successfully.",
        });
      }
    });
  }

  return (
    <div className="space-y-3">
      {statusMessage && (
        <Alert variant={statusMessage.type === "success" ? "info" : "error"}>
          {statusMessage.message}
        </Alert>
      )}

      <div>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter confidential notes, internal reminders, or consultation details. These are never shown to visitors."
          className="w-full rounded-md border border-border bg-surface p-3 text-sm text-foreground focus:border-primary focus:outline-primary disabled:opacity-60"
          disabled={isPending}
        />
        <div className="text-foreground-muted mt-1 flex items-center justify-between text-xs">
          <span>Private to authorized administrators</span>
          <span className={isTooLong ? "font-bold text-error" : ""}>
            {charsRemaining} characters remaining
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="primary"
          size="sm"
          loading={isPending}
          disabled={isTooLong || isPending}
          onClick={handleSave}
          className="min-h-[44px] w-full sm:w-auto"
        >
          Save Notes
        </Button>
      </div>
    </div>
  );
}
