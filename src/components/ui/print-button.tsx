"use client";

import { Button } from "@/components/ui/button";
import { PrinterIcon } from "@/components/ui/icons";
import { useTranslations } from "@/i18n/client";

export function PrintButton({ className, label }: { className?: string; label?: string }) {
  const { t } = useTranslations();

  return (
    <Button
      variant="primary"
      size="md"
      className={className}
      onClick={() => window.print()}
      leftIcon={<PrinterIcon className="size-4" />}
    >
      {label || t.receipt.printButton}
    </Button>
  );
}
