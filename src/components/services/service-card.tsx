import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ClockIcon } from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/link-button";
import type { PublicService } from "@/types/domain";

export interface ServiceCardProps {
  service: PublicService;
  showBookButton?: boolean;
}

export function ServiceCard({ service, showBookButton = true }: ServiceCardProps) {
  const detailUrl = `/services/${service.slug}`;
  const bookUrl = `/book?service=${service.slug}`;

  return (
    <Card
      variant="interactive"
      className="flex h-full flex-col justify-between overflow-hidden p-0"
    >
      {/* Visual / Image header */}
      <div className="relative aspect-16/9 w-full overflow-hidden border-b border-border/60 bg-forest/5">
        {service.image_url ? (
          <Image
            src={service.image_url}
            alt={service.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          /* Graceful Islamic ornamental fallback */
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center bg-linear-to-br from-forest/10 via-cream to-accent/15 p-6"
          >
            <div className="flex size-14 items-center justify-center rounded-full border border-accent/40 bg-white/70 shadow-subtle">
              <svg viewBox="0 0 24 24" className="size-7 text-accent-strong" fill="currentColor">
                <path d="M12 2l2.2 5.3L19.5 5l-2.3 5.3L22 12l-4.8 1.7 2.3 5.3-5.3-2.3L12 22l-2.2-5.3L4.5 19l2.3-5.3L2 12l4.8-1.7L4.5 5l5.3 2.3z" />
              </svg>
            </div>
          </div>
        )}

        {/* Duration badge */}
        {service.duration_minutes > 0 && (
          <div className="absolute right-3 bottom-3">
            <Badge
              variant="neutral"
              size="sm"
              icon={<ClockIcon className="size-3 text-primary" />}
              className="bg-surface/90 font-medium text-foreground shadow-subtle backdrop-blur-xs"
            >
              {service.duration_minutes} mins
            </Badge>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="font-display text-xl leading-tight font-semibold text-primary sm:text-2xl">
          <Link
            href={detailUrl}
            className="rounded-xs hover:underline focus-visible:outline-2 focus-visible:outline-focus"
          >
            {service.name}
          </Link>
        </h3>

        <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted">
          {service.short_description ||
            service.description ||
            "Spiritual consultation and ethical guidance."}
        </p>

        {/* Card Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
          <Link
            href={detailUrl}
            className="py-1 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-focus"
          >
            View Details
          </Link>

          {showBookButton && (
            <div className="ml-auto">
              <LinkButton href={bookUrl} variant="primary" size="sm">
                Request Slot
              </LinkButton>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
