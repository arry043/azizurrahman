import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type SectionBackground = "default" | "muted" | "white" | "inverse";
export type SectionPadding = "none" | "sm" | "md" | "lg" | "xl";

export interface PageSectionProps extends HTMLAttributes<HTMLElement> {
  as?: "section" | "div" | "article";
  background?: SectionBackground;
  padding?: SectionPadding;
}

const backgroundStyles: Record<SectionBackground, string> = {
  default: "bg-background text-foreground",
  muted: "bg-surface-muted text-foreground",
  white: "bg-surface text-foreground",
  inverse: "bg-surface-inverse text-foreground-inverse",
};

const paddingStyles: Record<SectionPadding, string> = {
  none: "py-0",
  sm: "py-8 sm:py-10",
  md: "py-12 sm:py-16",
  lg: "py-16 sm:py-20 lg:py-24",
  xl: "py-20 sm:py-28 lg:py-32",
};

export function PageSection({
  as: Component = "section",
  background = "default",
  padding = "md",
  className,
  children,
  ...props
}: PageSectionProps) {
  return (
    <Component
      className={cn(
        "relative w-full",
        backgroundStyles[background],
        paddingStyles[padding],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
