import "server-only";

import { getResendApiKey, getResendFromEmail } from "@/lib/env/server";
import { logger } from "@/lib/logger";
import type { SendEmailParams, SendEmailResult } from "../types";
import type { EmailProvider } from "./provider";

export class ResendEmailAdapter implements EmailProvider {
  readonly name = "resend";

  isConfigured(): boolean {
    return Boolean(getResendApiKey()?.trim());
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const apiKey = getResendApiKey();
    if (!apiKey) {
      return {
        success: false,
        errorCode: "PROVIDER_NOT_CONFIGURED",
        errorMessage: "Resend API key is not configured.",
        isRetryable: false,
      };
    }

    const fromAddress = getResendFromEmail();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...(params.idempotencyKey ? { "Idempotency-Key": params.idempotencyKey } : {}),
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [params.to],
          subject: params.subject,
          html: params.html,
          text: params.text,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = (await response.json().catch(() => null)) as {
        id?: string;
        message?: string;
        name?: string;
      } | null;

      if (response.ok && data?.id) {
        return {
          success: true,
          providerMessageId: data.id,
        };
      }

      const status = response.status;
      const isRetryable = status === 429 || (status >= 500 && status <= 599);
      const errorCode = data?.name || `HTTP_${status}`;
      const errorMessage = data?.message || `Resend API returned HTTP ${status}`;

      logger.warn("email_provider_send_failed", {
        provider: this.name,
        status,
        errorCode,
        isRetryable,
      });

      return {
        success: false,
        errorCode,
        errorMessage,
        isRetryable,
      };
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      const isRetryable = true;
      const errorMessage = isAbort ? "Request timed out after 8s" : String(err);

      logger.warn("email_provider_network_error", {
        provider: this.name,
        error: isAbort ? "TIMEOUT" : "NETWORK_ERROR",
      });

      return {
        success: false,
        errorCode: isAbort ? "TIMEOUT" : "NETWORK_ERROR",
        errorMessage,
        isRetryable,
      };
    }
  }
}
