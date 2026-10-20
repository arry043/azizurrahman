import { z } from "zod";

/**
 * Contact normalisation shared by the booking flow and admin search.
 * The database re-checks the normalised formats (see `appointments` check constraints), so these
 * helpers and the SQL must stay aligned — tests cover both sides.
 */

/** E.164: `+` followed by 7–15 digits, no leading zero in the country code. Mirrors the DB check. */
export const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

const CALLING_CODE_PATTERN = /^[1-9]\d{0,3}$/;
const SEPARATORS = /[\s().\-/]/g;

/**
 * Normalise a phone number to E.164, or return `null` when it cannot be normalised safely.
 *
 * - `+…` and `00…` prefixes are treated as international.
 * - Otherwise `defaultCallingCode` (e.g. `"91"`) is applied after removing one trunk `0`.
 *   The default country is pending client approval (OPEN_QUESTIONS Q20); without it, numbers that
 *   lack an international prefix are rejected rather than guessed.
 */
export function normalizePhone(input: string, defaultCallingCode?: string): string | null {
  const compact = input.trim().replace(SEPARATORS, "");
  if (compact === "") {
    return null;
  }

  let candidate: string;
  if (compact.startsWith("+")) {
    candidate = compact;
  } else if (compact.startsWith("00")) {
    candidate = `+${compact.slice(2)}`;
  } else if (defaultCallingCode !== undefined) {
    if (!CALLING_CODE_PATTERN.test(defaultCallingCode)) {
      throw new RangeError("defaultCallingCode must be 1–4 digits without a leading zero");
    }
    candidate = `+${defaultCallingCode}${compact.replace(/^0/, "")}`;
  } else {
    return null;
  }

  return E164_PATTERN.test(candidate) ? candidate : null;
}

/** Lower-cased, trimmed email, or `null` when empty. Format is validated separately. */
export function normalizeEmail(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  return trimmed === "" ? null : trimmed;
}

export const emailSchema = z.email().max(254);

/** Lowercase words separated by single hyphens. Mirrors the `services.slug` DB check. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const slugSchema = z.string().min(1).max(80).regex(SLUG_PATTERN);
