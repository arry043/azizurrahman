import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BadgeVariant = "neutral" | "success" | "warning" | "error" | "gold" | "primary";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral: "bg-surface-muted text-foreground border-border",
  success: "bg-emerald/10 text-emerald border-emerald/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  error: "bg-error/10 text-error border-error/30",
  gold: "bg-accent/15 text-accent-strong border-accent/40",
  primary: "bg-primary text-primary-foreground border-primary",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2.5 py-0.5 text-xs font-medium gap-1",
  md: "px-3 py-1 text-sm font-medium gap-1.5",
};

export function Badge({
  variant = "neutral",
  size = "sm",
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border tracking-wide transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
}
