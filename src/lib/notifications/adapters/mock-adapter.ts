import type { SendEmailParams, SendEmailResult } from "../types";
import type { EmailProvider } from "./provider";

export type MockBehavior =
  | "success"
  | "rate_limit"
  | "server_error"
  | "invalid_address"
  | "network_timeout"
  | "not_configured";

export class MockEmailAdapter implements EmailProvider {
  readonly name = "mock";
  private behavior: MockBehavior = "success";
  public sentEmails: SendEmailParams[] = [];
  public attemptCount = 0;

  constructor(initialBehavior: MockBehavior = "success") {
    this.behavior = initialBehavior;
  }

  setBehavior(behavior: MockBehavior) {
    this.behavior = behavior;
  }

  clear() {
    this.sentEmails = [];
    this.attemptCount = 0;
  }

  isConfigured(): boolean {
    return this.behavior !== "not_configured";
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    this.attemptCount++;

    if (this.behavior === "not_configured") {
      return {
        success: false,
        errorCode: "PROVIDER_NOT_CONFIGURED",
        errorMessage: "Mock provider not configured",
        isRetryable: false,
      };
    }

    if (this.behavior === "invalid_address") {
      return {
        success: false,
        errorCode: "INVALID_EMAIL_ADDRESS",
        errorMessage: "The recipient address is invalid",
        isRetryable: false,
      };
    }

    if (this.behavior === "rate_limit") {
      return {
        success: false,
        errorCode: "RATE_LIMIT_EXCEEDED",
        errorMessage: "Too many requests to email provider",
        isRetryable: true,
      };
    }

    if (this.behavior === "server_error") {
      return {
        success: false,
        errorCode: "INTERNAL_SERVER_ERROR",
        errorMessage: "Provider temporary server error",
        isRetryable: true,
      };
    }

    if (this.behavior === "network_timeout") {
      return {
        success: false,
        errorCode: "TIMEOUT",
        errorMessage: "Mock network timeout",
        isRetryable: true,
      };
    }

    // Success
    this.sentEmails.push(params);
    return {
      success: true,
      providerMessageId: `mock_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
  }
}
