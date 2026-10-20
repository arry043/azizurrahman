import type { ReactNode } from "react";

import { InfoIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface-muted/60 p-8 text-center sm:p-12",
        className,
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-cream text-accent-strong shadow-subtle sm:size-14">
        {icon ?? <InfoIcon className="size-6 sm:size-7" />}
      </div>
      <h3 className="font-display text-xl font-semibold text-primary sm:text-2xl">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted sm:text-base">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
