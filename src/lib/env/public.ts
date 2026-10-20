import { z } from "zod";

import { parseEnv } from "./parse";

/**
 * Public (browser-safe) configuration.
 *
 * `NEXT_PUBLIC_*` variables are inlined into client bundles at build time, so each one must be
 * referenced statically (`process.env.NEXT_PUBLIC_X`), not through dynamic lookups.
 * Nothing secret may ever be added here.
 */

export const DEFAULT_SITE_URL = "http://localhost:3000";

const siteSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url({ protocol: /^https?$/ }).default(DEFAULT_SITE_URL),
});

const supabasePublicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ protocol: /^https?$/ }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, "looks too short to be a Supabase key"),
});

export type SupabasePublicEnv = z.output<typeof supabasePublicSchema>;

/** Canonical site origin. Falls back to localhost when unset; throws if set to an invalid URL. */
export function getSiteUrl(): URL {
  const env = parseEnv("site", siteSchema, {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
  return new URL(env.NEXT_PUBLIC_SITE_URL);
}

/** Supabase URL + anon/publishable key. Validated lazily so the static shell builds without them. */
export function getSupabasePublicEnv(): SupabasePublicEnv {
  return parseEnv("Supabase (public)", supabasePublicSchema, {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
