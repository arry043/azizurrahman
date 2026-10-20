import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { AppointmentStatus } from "@/types/domain";

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: "Pending", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "success" },
  reschedule_requested: { label: "Reschedule Req.", variant: "gold" },
  declined: { label: "Declined", variant: "error" },
  cancelled: { label: "Cancelled", variant: "neutral" },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const config = STATUS_CONFIG[status] || { label: status, variant: "neutral" };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
