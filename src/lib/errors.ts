/**
 * Application error contract (PRD §10.1).
 *
 * Server code throws or returns `AppError`s with a stable `code`. Anything else that reaches a
 * boundary is converted to a generic `INTERNAL_ERROR` so stack traces, SQL and identifiers never
 * reach the browser.
 */

export const ERROR_CODES = [
  "VALIDATION_FAILED",
  "NOT_FOUND",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "RATE_LIMITED",
  "SLOT_UNAVAILABLE",
  "DAILY_LIMIT_REACHED",
  "INVALID_STATUS_TRANSITION",
  "VERIFICATION_REQUIRED",
  "CONFIGURATION_ERROR",
  "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export type FieldErrors = Readonly<Record<string, readonly string[]>>;

export interface PublicError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly fieldErrors?: FieldErrors;
}

export type Result<T> =
  { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: PublicError };

const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_FAILED: "Please check the highlighted fields and try again.",
  NOT_FOUND: "We could not find what you were looking for.",
  UNAUTHORIZED: "Please sign in to continue.",
  FORBIDDEN: "You do not have permission to do that.",
  RATE_LIMITED: "Too many attempts. Please wait a moment and try again.",
  SLOT_UNAVAILABLE: "That time is no longer available. Please choose another time.",
  DAILY_LIMIT_REACHED:
    "An appointment already exists for this phone number on that date. Please choose another date.",
  INVALID_STATUS_TRANSITION: "That status change is not allowed for this appointment.",
  VERIFICATION_REQUIRED: "Please verify your contact details to continue.",
  CONFIGURATION_ERROR: "This feature is not available right now.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly publicMessage: string;
  readonly fieldErrors?: FieldErrors;

  constructor(
    code: ErrorCode,
    options: { publicMessage?: string; fieldErrors?: FieldErrors; cause?: unknown } = {},
  ) {
    super(options.publicMessage ?? DEFAULT_MESSAGES[code], { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.publicMessage = options.publicMessage ?? DEFAULT_MESSAGES[code];
    this.fieldErrors = options.fieldErrors;
  }
}

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail(code: ErrorCode, options?: { message?: string; fieldErrors?: FieldErrors }) {
  return {
    ok: false,
    error: {
      code,
      message: options?.message ?? DEFAULT_MESSAGES[code],
      ...(options?.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
    },
  } as const satisfies Result<never>;
}

/** Convert any thrown value into a browser-safe error. Unknown errors become INTERNAL_ERROR. */
export function toPublicError(error: unknown): PublicError {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.publicMessage,
      ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
    };
  }
  return { code: "INTERNAL_ERROR", message: DEFAULT_MESSAGES.INTERNAL_ERROR };
}

/** Shape of errors returned by supabase-js / PostgREST. */
export interface DatabaseErrorLike {
  readonly code?: string;
  readonly message?: string;
}

/**
 * Map PostgreSQL errors raised by our constraints/triggers to stable application codes.
 * Constraint names are defined in supabase/migrations and documented in docs/database/SCHEMA.md.
 */
export function mapDatabaseError(error: DatabaseErrorLike): AppError {
  const message = error.message ?? "";
  switch (error.code) {
    case "23P01": // exclusion_violation
      if (message.includes("appointments_no_overlap")) {
        return new AppError("SLOT_UNAVAILABLE", { cause: error });
      }
      break;
    case "23505": // unique_violation
      if (message.includes("appointments_one_active_per_phone_per_day")) {
        return new AppError("DAILY_LIMIT_REACHED", { cause: error });
      }
      break;
    case "P0001": // raise_exception from our triggers
      if (message.includes("invalid appointment status transition")) {
        return new AppError("INVALID_STATUS_TRANSITION", { cause: error });
      }
      break;
    case "23514": // check_violation
    case "22023": // invalid_parameter_value (e.g. timezone validation)
    case "22P02": // invalid_text_representation (e.g. bad enum value)
      return new AppError("VALIDATION_FAILED", { cause: error });
    case "42501": // insufficient_privilege (RLS/grants)
      return new AppError("FORBIDDEN", { cause: error });
  }
  return new AppError("INTERNAL_ERROR", { cause: error });
}
