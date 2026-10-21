"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/ui/error-state";
import { Ornament } from "@/components/ui/ornament";
import { useTranslations } from "@/i18n/client";

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
  const { t } = useTranslations();

  useEffect(() => {
    console.error("Public route error:", error?.digest ?? error?.message ?? error);
  }, [error]);

  return (
    <section className="container-page flex flex-1 flex-col items-center justify-center py-20 text-center sm:py-28">
      <Ornament className="mb-4" />
      <ErrorState
        title={t.errors.publicErrorTitle}
        message={t.errors.publicErrorMessage}
        retryLabel={t.errors.tryAgain}
        homeLabel={t.common.returnHome}
        onRetry={onRetry}
        homeLink
      />
      {error?.digest && (
        <p className="mt-4 text-xs text-muted/80">
          {t.errors.errorReference}{" "}
          <code className="font-mono text-muted" dir="ltr">
            {error.digest}
          </code>
        </p>
      )}
    </section>
  );
}
