import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { AlertCircleIcon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  homeLink?: boolean;
  action?: ReactNode;
  className?: string;
  retryLabel?: string;
  homeLabel?: string;
}

export function ErrorState({
  title = "Unable to load information",
  message = "A temporary issue prevented this content from loading. Please try again.",
  onRetry,
  homeLink = true,
  action,
  className,
  retryLabel = "Try Again",
  homeLabel = "Return Home",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-error/30 bg-error/5 p-8 text-center sm:p-12",
        className,
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-error/10 text-error sm:size-14">
        <AlertCircleIcon className="size-6 sm:size-7" />
      </div>
      <h3 className="font-display text-xl font-semibold text-foreground sm:text-2xl">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted sm:text-base">{message}</p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button variant="primary" size="md" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
        {homeLink && (
          <LinkButton href="/" variant="secondary" size="md">
            {homeLabel}
          </LinkButton>
        )}
        {action}
      </div>
    </div>
  );
}
