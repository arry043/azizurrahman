import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type ContainerSize = "default" | "wide" | "prose";

export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
}

const sizeClasses: Record<ContainerSize, string> = {
  default: "container-page",
  wide: "container-wide",
  prose: "container-prose",
};

export function PageContainer({ size = "default", className, ...props }: PageContainerProps) {
  return <div className={cn(sizeClasses[size], className)} {...props} />;
}
