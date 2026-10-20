import "server-only";

/**
 * Minimal structured server logger with redaction.
 * Never log passwords, tokens, keys, or unnecessary personal data (PRD §11). Context keys that look
 * sensitive are replaced with "[REDACTED]" recursively before writing.
 */

type LogLevel = "info" | "warn" | "error";
export type LogContext = Readonly<Record<string, unknown>>;

const SENSITIVE_KEY =
  /pass(word)?|secret|token|api[-_]?key|authorization|cookie|session|otp|phone|email|message|notes?|customer[-_]?name/i;
const MAX_DEPTH = 5;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) {
    return "[TRUNCATED]";
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }
  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        SENSITIVE_KEY.test(key) ? "[REDACTED]" : redact(entry, depth + 1),
      ]),
    );
  }
  return value;
}

function getTimestamp(): string {
  // During Next.js static build prerendering, avoid calling parameterless new Date()
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new Date(0).toISOString();
  }
  return new Date().toISOString();
}

function write(level: LogLevel, event: string, context?: LogContext): void {
  const line = JSON.stringify({
    level,
    event,
    time: getTimestamp(),
    ...(context ? { context: redact(context) } : {}),
  });
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

export const logger = {
  info: (event: string, context?: LogContext) => write("info", event, context),
  warn: (event: string, context?: LogContext) => write("warn", event, context),
  error: (event: string, context?: LogContext) => write("error", event, context),
};
