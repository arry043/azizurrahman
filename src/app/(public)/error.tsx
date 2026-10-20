"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/ui/error-state";
import { Ornament } from "@/components/ui/ornament";

export default function PublicError({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
  retry?: () => void;
}) {
  const onRetry = reset ?? retry;

  useEffect(() => {
    console.error("Public route error:", error?.digest ?? error?.message ?? error);
  }, [error]);

  return (
    <section className="container-page flex flex-1 flex-col items-center justify-center py-20 text-center sm:py-28">
      <Ornament className="mb-4" />
      <ErrorState
        title="We encountered an issue loading this page"
        message="A temporary issue prevented this content from displaying properly. Please try again or return to the home page."
        onRetry={onRetry}
        homeLink
      />
      {error?.digest && (
        <p className="mt-4 text-xs text-muted/80">
          Error Reference: <code className="font-mono text-muted">{error.digest}</code>
        </p>
      )}
    </section>
  );
}
