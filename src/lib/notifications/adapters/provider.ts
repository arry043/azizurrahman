import type { SendEmailParams, SendEmailResult } from "../types";

export interface EmailProvider {
  readonly name: string;
  isConfigured(): boolean;
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
}
