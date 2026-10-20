import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";

/** Logo + wordmark linking home. Used in the header and on standalone pages (404). */
export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      className="inline-flex min-h-11 items-center gap-3 rounded-md"
      aria-label={`${siteConfig.name} — home`}
    >
      <Image
        src={siteConfig.logo.src}
        alt=""
        width={44}
        height={44}
        className="size-10 rounded-full sm:size-11"
      />
      <span
        className={
          inverse
            ? "font-display text-lg font-semibold tracking-wide text-foreground-inverse sm:text-xl"
            : "font-display text-lg font-semibold tracking-wide text-primary sm:text-xl"
        }
      >
        {siteConfig.name}
      </span>
    </Link>
  );
}
