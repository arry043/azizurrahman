import type { z } from "zod";

/**
 * Thrown when required configuration is missing or malformed.
 * The message names the variables and the rule they failed — never their values.
 */
export class EnvValidationError extends Error {
  readonly variables: readonly string[];

  constructor(context: string, issues: readonly { variable: string; problem: string }[]) {
    const detail = issues.map((issue) => `${issue.variable}: ${issue.problem}`).join("; ");
    super(`Invalid ${context} configuration — ${detail}. See .env.example.`);
    this.name = "EnvValidationError";
    this.variables = issues.map((issue) => issue.variable);
  }
}

/** Treat empty strings as "not set" so blank lines copied from .env.example behave like missing values. */
export function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function parseEnv<Schema extends z.ZodType>(
  context: string,
  schema: Schema,
  input: Record<string, string | undefined>,
): z.output<Schema> {
  const normalized = Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, emptyToUndefined(value)]),
  );
  const result = schema.safeParse(normalized);
  if (result.success) {
    return result.data;
  }
  throw new EnvValidationError(
    context,
    result.error.issues.map((issue) => ({
      variable: issue.path.map(String).join(".") || "(root)",
      problem: issue.input === undefined ? "is required" : issue.message,
    })),
  );
}
