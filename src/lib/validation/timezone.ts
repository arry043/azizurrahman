const IANA_NAME = /^(?:UTC|[A-Za-z]+(?:\/[A-Za-z0-9_+-]+)+)$/;

/**
 * True for IANA zone names (e.g. `Asia/Kolkata`, `UTC`). Rejects raw offsets such as `+05:30`,
 * which cannot represent daylight-saving rules and are not valid PostgreSQL zone names for us.
 */
export function isValidTimeZone(value: string): boolean {
  if (!IANA_NAME.test(value)) {
    return false;
  }
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
