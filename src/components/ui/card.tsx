import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type CardVariant = "default" | "muted" | "elevated" | "interactive";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-surface border-border text-foreground",
  muted: "bg-surface-muted border-border text-foreground",
  elevated: "bg-surface border-border/80 shadow-card text-foreground",
  interactive:
    "bg-surface border-border shadow-subtle text-foreground hover:shadow-card hover:border-primary/40 transition-all",
};

export function Card({ variant = "default", className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-card border p-6 sm:p-7", variantStyles[variant], className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 pb-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-display text-xl leading-tight font-semibold text-primary sm:text-2xl",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-relaxed text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center border-t border-border/60 pt-4", className)} {...props} />
  );
}
