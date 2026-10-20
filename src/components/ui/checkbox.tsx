import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: ReactNode;
  error?: string;
  containerClassName?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { id, label, description, error, className, containerClassName, disabled, required, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;
    const descId = description ? `${checkboxId}-desc` : undefined;
    const errorId = error ? `${checkboxId}-error` : undefined;

    const describedBy = [descId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className={cn("flex flex-col space-y-1.5", containerClassName)}>
        <label
          htmlFor={checkboxId}
          className={cn(
            "group flex cursor-pointer items-start gap-3 select-none",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <div className="relative flex items-center pt-0.5">
            <input
              ref={ref}
              id={checkboxId}
              type="checkbox"
              disabled={disabled}
              required={required}
              aria-invalid={Boolean(error)}
              aria-describedby={describedBy}
              className={cn(
                "peer size-5 appearance-none rounded border bg-surface transition-colors",
                "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus",
                "checked:border-primary checked:bg-primary",
                "disabled:cursor-not-allowed disabled:bg-surface-muted",
                error ? "border-error" : "border-border hover:border-primary/60",
                className,
              )}
              {...props}
            />
            <CheckIcon
              className="pointer-events-none absolute inset-0 m-auto size-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100"
              aria-hidden="true"
            />
          </div>

          <div className="flex flex-col text-sm">
            <span className="leading-snug font-medium text-foreground">
              {label}
              {required && (
                <span className="ml-1 text-error" aria-hidden="true">
                  *
                </span>
              )}
            </span>
            {description && (
              <span id={descId} className="mt-0.5 text-xs leading-relaxed text-muted">
                {description}
              </span>
            )}
          </div>
        </label>

        {error && (
          <p id={errorId} role="alert" className="pl-8 text-xs font-medium text-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
