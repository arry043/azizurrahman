"use client";

import { Button } from "@/components/ui/button";
import { PrinterIcon } from "@/components/ui/icons";

export function PrintButton({ className }: { className?: string }) {
  return (
    <Button
      variant="primary"
      size="md"
      className={className}
      onClick={() => window.print()}
      leftIcon={<PrinterIcon className="size-4" />}
    >
      Print Receipt
    </Button>
  );
}
