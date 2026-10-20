"use client";

import { useEffect } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected admin client error
    console.error("Admin dashboard error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl py-12">
      <Alert variant="error" title="Dashboard Error">
        An unexpected error occurred while loading this administrative section. Sensitive error
        details have been suppressed for security.
      </Alert>
      <div className="mt-6 flex justify-start gap-4">
        <Button variant="primary" onClick={() => reset()}>
          Try Again
        </Button>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </div>
    </div>
  );
}
