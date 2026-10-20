import type { HTMLAttributes, ReactNode } from "react";

import { AlertCircleIcon, AlertTriangleIcon, CheckIcon, InfoIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  icon?: ReactNode;
}

const variantConfig: Record<
  AlertVariant,
  { container: string; iconClass: string; defaultIcon: ReactNode; role: "alert" | "status" }
> = {
  info: {
    container: "bg-surface-muted border-border text-foreground",
    iconClass: "text-primary",
    defaultIcon: <InfoIcon className="size-5" />,
    role: "status",
  },
  success: {
    container: "bg-emerald/10 border-emerald/30 text-foreground",
    iconClass: "text-emerald",
    defaultIcon: <CheckIcon className="size-5" />,
    role: "status",
  },
  warning: {
    container: "bg-warning/15 border-warning/40 text-foreground",
    iconClass: "text-warning",
    defaultIcon: <AlertTriangleIcon className="size-5" />,
    role: "alert",
  },
  error: {
    container: "bg-error/10 border-error/30 text-foreground",
    iconClass: "text-error",
    defaultIcon: <AlertCircleIcon className="size-5" />,
    role: "alert",
  },
};

export function Alert({
  variant = "info",
  title,
  icon,
  className,
  children,
  ...props
}: AlertProps) {
  const config = variantConfig[variant];

  return (
    <div
      role={config.role}
      className={cn(
        "flex items-start gap-3.5 rounded-card border p-4 sm:p-5",
        config.container,
        className,
      )}
      {...props}
    >
      <div className={cn("mt-0.5 shrink-0", config.iconClass)} aria-hidden="true">
        {icon ?? config.defaultIcon}
      </div>
      <div className="flex-1 space-y-1">
        {title && <h5 className="leading-none font-medium tracking-tight">{title}</h5>}
        {children && <div className="text-sm leading-relaxed text-foreground/90">{children}</div>}
      </div>
    </div>
  );
}
