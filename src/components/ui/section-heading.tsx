import type { ReactNode } from "react";

import { Ornament } from "@/components/ui/ornament";
import { cn } from "@/lib/utils";

export interface SectionHeadingProps {
  kicker?: string;
  title: string;
  description?: ReactNode;
  align?: "center" | "left";
  inverse?: boolean;
  className?: string;
}

export function SectionHeading({
  kicker,
  title,
  description,
  align = "center",
  inverse = false,
  className,
}: SectionHeadingProps) {
  const isCentered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col",
        isCentered ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {kicker && (
        <p
          className={cn(
            "mb-2 text-xs font-semibold tracking-[0.2em] uppercase sm:text-sm",
            inverse ? "text-accent" : "text-accent-strong",
          )}
        >
          {kicker}
        </p>
      )}

      <h2
        className={cn(
          "font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl",
          inverse ? "text-foreground-inverse" : "text-primary",
        )}
      >
        {title}
      </h2>

      <Ornament className={cn("mt-4 mb-4", isCentered ? "justify-center" : "justify-start")} />

      {description && (
        <div
          className={cn(
            "max-w-2xl text-base leading-relaxed sm:text-lg",
            inverse ? "text-ivory/80" : "text-muted",
          )}
        >
          {description}
        </div>
      )}
    </div>
  );
}
