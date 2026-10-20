import type { ButtonHTMLAttributes, ReactNode } from "react";

import { SpinnerIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors " +
  "focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-card hover:bg-primary-hover active:bg-forest",
  secondary: "border border-primary bg-surface text-primary hover:bg-surface-muted active:bg-cream",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-surface-muted hover:border-primary/40",
  ghost: "text-primary underline-offset-4 hover:underline hover:bg-cream/40",
  destructive: "bg-error text-white shadow-card hover:opacity-90 active:opacity-100",
};

// Touch target standards: sm (36px min with padding), md (44px min touch target), lg (48px min)
const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3.5 py-1.5 text-sm",
  md: "min-h-11 px-5 py-2.5 text-base",
  lg: "min-h-12 px-6 py-3 text-lg",
};

/** Shared button styling for <button>, <Link> and <a> so every action looks and behaves alike. */
export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className,
  type = "button",
  children,
  leftIcon,
  rightIcon,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading ? "true" : undefined}
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      {loading ? <SpinnerIcon className="size-4 animate-spin text-current" /> : leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
}
