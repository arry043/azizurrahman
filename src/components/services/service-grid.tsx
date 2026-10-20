import { ServiceCard } from "@/components/services/service-card";
import { cn } from "@/lib/utils";
import type { PublicService } from "@/types/domain";

export interface ServiceGridProps {
  services: readonly PublicService[];
  showBookButton?: boolean;
  className?: string;
}

export function ServiceGrid({ services, showBookButton = true, className }: ServiceGridProps) {
  if (services.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3",
        className,
      )}
    >
      {services.map((service) => (
        <ServiceCard key={service.id} service={service} showBookButton={showBookButton} />
      ))}
    </div>
  );
}
