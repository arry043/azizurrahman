"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  deleteServiceAction,
  reorderServicesAction,
  toggleServiceActiveAction,
} from "@/lib/admin/services-actions";
import type { ServiceRow } from "@/types/domain";

interface ServicesTableProps {
  initialServices: ServiceRow[];
}

export function ServicesTable({ initialServices }: ServicesTableProps) {
  const [services, setServices] = useState<ServiceRow[]>(initialServices);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggleActive(service: ServiceRow) {
    setFeedback(null);
    const newActive = !service.is_active;

    startTransition(async () => {
      const res = await toggleServiceActiveAction(service.id, newActive);
      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to update service status." });
      } else {
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, is_active: newActive } : s)),
        );
        setFeedback({
          type: "success",
          message: `Service "${service.name}" is now ${newActive ? "active" : "inactive"}.`,
        });
      }
    });
  }

  function handleMove(index: number, direction: "up" | "down") {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === services.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...services];
    const currentItem = reordered[index];
    const targetItem = reordered[targetIndex];
    if (!currentItem || !targetItem) return;

    reordered[index] = targetItem;
    reordered[targetIndex] = currentItem;

    setServices(reordered);

    startTransition(async () => {
      const res = await reorderServicesAction(reordered.map((s) => s.id));
      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to reorder services." });
      } else {
        setFeedback({ type: "success", message: "Service order updated successfully." });
      }
    });
  }

  function handleDelete(id: string) {
    setFeedback(null);

    startTransition(async () => {
      const res = await deleteServiceAction(id);
      setDeleteConfirmId(null);

      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to delete service." });
      } else {
        setServices((prev) => prev.filter((s) => s.id !== id));
        setFeedback({ type: "success", message: "Service deleted successfully." });
      }
    });
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <Alert variant={feedback.type === "success" ? "info" : "error"}>{feedback.message}</Alert>
      )}

      {/* Delete Confirmation Alert */}
      {deleteConfirmId && (
        <div className="space-y-3 rounded-lg border border-error bg-error/10 p-4">
          <p className="text-sm font-semibold text-error">Confirm Service Deletion</p>
          <p className="text-xs text-foreground">
            Are you sure you want to permanently delete this service? Services that have been booked
            by visitors in the past cannot be deleted and must be deactivated instead.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              variant="destructive"
              size="sm"
              loading={isPending}
              onClick={() => handleDelete(deleteConfirmId)}
              className="min-h-[44px] sm:min-h-[36px]"
            >
              Delete Permanently
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setDeleteConfirmId(null)}
              className="min-h-[44px] sm:min-h-[36px]"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Card List: screens < sm */}
      <div className="divide-y divide-border/60 rounded-lg border border-border bg-surface shadow-card sm:hidden">
        {services.length === 0 ? (
          <div className="text-foreground-muted p-8 text-center text-sm">
            No services configured yet.
          </div>
        ) : (
          services.map((service, idx) => (
            <div
              key={service.id}
              className="space-y-3 p-4 transition-colors hover:bg-surface-muted/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded bg-surface-muted font-mono text-xs font-bold text-foreground">
                    #{idx + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{service.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleActive(service)}
                  disabled={isPending}
                  className="cursor-pointer"
                  aria-label={`Toggle active status for ${service.name}`}
                >
                  {service.is_active ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="neutral">Draft</Badge>
                  )}
                </button>
              </div>

              <div className="text-foreground-muted font-mono text-xs">/{service.slug}</div>

              {service.short_description && (
                <p className="text-foreground-muted line-clamp-2 text-xs">
                  {service.short_description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className="font-medium text-foreground">
                  {service.duration_minutes} mins duration
                </span>
                <span className="text-foreground-muted">
                  {service.buffer_after_minutes > 0
                    ? `+${service.buffer_after_minutes}m buffer`
                    : "No buffer"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-3">
                <div className="flex items-center gap-1">
                  <span className="text-foreground-muted mr-1 text-xs">Move:</span>
                  <button
                    type="button"
                    disabled={idx === 0 || isPending}
                    onClick={() => handleMove(idx, "up")}
                    className="text-foreground-muted flex size-10 items-center justify-center rounded-md border border-border bg-surface shadow-xs transition-colors hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Move ${service.name} up`}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={idx === services.length - 1 || isPending}
                    onClick={() => handleMove(idx, "down")}
                    className="text-foreground-muted flex size-10 items-center justify-center rounded-md border border-border bg-surface shadow-xs transition-colors hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Move ${service.name} down`}
                  >
                    ▼
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/services/${service.id}`}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-xs font-semibold text-primary shadow-xs transition-colors hover:bg-surface-muted"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(service.id)}
                    disabled={isPending}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border/80 bg-surface px-3 py-2 text-xs font-semibold text-error shadow-xs transition-colors hover:bg-error/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table: screens >= sm */}
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface shadow-card sm:block">
        <table className="w-full text-left text-sm" aria-label="Services table">
          <thead className="text-foreground-muted border-b border-border bg-surface-muted/60 text-xs font-semibold uppercase">
            <tr>
              <th scope="col" className="w-16 px-4 py-3.5">
                Order
              </th>
              <th scope="col" className="px-4 py-3.5">
                Service Details
              </th>
              <th scope="col" className="px-4 py-3.5">
                Duration & Buffers
              </th>
              <th scope="col" className="px-4 py-3.5">
                Status
              </th>
              <th scope="col" className="px-4 py-3.5 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {services.map((service, idx) => (
              <tr key={service.id} className="transition-colors hover:bg-surface-muted/30">
                <td className="px-4 py-3.5 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0 || isPending}
                      onClick={() => handleMove(idx, "up")}
                      className="text-foreground-muted rounded p-1 hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label={`Move ${service.name} up`}
                    >
                      ▲
                    </button>
                    <span className="text-foreground-muted font-mono text-xs font-medium">
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      disabled={idx === services.length - 1 || isPending}
                      onClick={() => handleMove(idx, "down")}
                      className="text-foreground-muted rounded p-1 hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label={`Move ${service.name} down`}
                    >
                      ▼
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-foreground">{service.name}</div>
                  <div className="text-foreground-muted font-mono text-xs">/{service.slug}</div>
                  {service.short_description && (
                    <div className="text-foreground-muted mt-1 line-clamp-1 text-xs">
                      {service.short_description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <div className="font-medium text-foreground">{service.duration_minutes} mins</div>
                  <div className="text-foreground-muted text-xs">
                    {service.buffer_after_minutes > 0
                      ? `+${service.buffer_after_minutes}m buffer`
                      : "No buffer"}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(service)}
                    disabled={isPending}
                    className="cursor-pointer"
                    aria-label={`Toggle active status for ${service.name}`}
                  >
                    {service.is_active ? (
                      <Badge variant="success">Active (Public)</Badge>
                    ) : (
                      <Badge variant="neutral">Archived / Draft</Badge>
                    )}
                  </button>
                </td>
                <td className="space-x-2 px-4 py-3.5 text-right">
                  <Link
                    href={`/admin/services/${service.id}`}
                    className="inline-flex items-center rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-primary shadow-xs transition-colors hover:bg-surface-muted"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(service.id)}
                    disabled={isPending}
                    className="inline-flex items-center rounded-md border border-border/80 bg-surface px-2.5 py-1 text-xs font-medium text-error shadow-xs transition-colors hover:bg-error/10"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
