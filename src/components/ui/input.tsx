import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      hint,
      error,
      leftIcon,
      rightIcon,
      className,
      containerClassName,
      disabled,
      required,
      type = "text",
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className={cn("w-full space-y-1.5", containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
            {label}
            {required && (
              <span className="ml-1 text-error" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div
              className="pointer-events-none absolute left-3.5 flex items-center text-muted"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              "w-full rounded-control border bg-surface px-4 py-2.5 text-base text-foreground transition-colors",
              "placeholder:text-muted/60",
              "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus",
              "disabled:cursor-not-allowed disabled:bg-surface-muted/50 disabled:opacity-60",
              error
                ? "border-error focus-visible:outline-error"
                : "border-border hover:border-primary/50 focus-visible:border-primary",
              Boolean(leftIcon) && "pl-11",
              Boolean(rightIcon) && "pr-11",
              className,
            )}
            {...props}
          />

          {rightIcon && (
            <div
              className="pointer-events-none absolute right-3.5 flex items-center text-muted"
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
        </div>

        {hint && !error && (
          <p id={hintId} className="text-xs text-muted">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
