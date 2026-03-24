import { Logger, LogLevel } from "../utils/logger";
const logger = new Logger(LogLevel.INFO, "NotificationService");

export interface EmailRecipient {
  to: string;
  from: string;
  cc?: string[];
  bcc?: string[];
}

export interface NotificationPayload {
  subject: string;
  message: string;
  recipientEmail: EmailRecipient;
  channel: "email" | "sms" | "push";
  body?: string;
  userId?: string;
  serviceName?: string;
}

export interface NotificationResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class NotificationService {
  private readonly apiEndpoint: string;

  constructor(apiEndpoint: string) {
    this.apiEndpoint =
      apiEndpoint ||
      process.env.NOTIFICATION_API_ENDPOINT ||
      "http://localhost:3000/notify";
  }

  async sendEmail(payload: NotificationPayload): Promise<NotificationResponse> {
    const { subject, message, recipientEmail } = payload;
    logger.info("Sending notification", { payload: JSON.stringify(payload) });
    // Simulate sending notification (e.g., via email or SMS)
    try {
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API responded with status ${response.status}: ${errorText}`,
        );
      }

      const result: any = await response.json();
      logger.info("Notification sent successfully", { result });

      return {
        success: true,
        messageId: result.messageId || result.id || undefined,
      };
    } catch (error) {
      logger.error("Failed to send notification", { error: String(error) });
      throw new Error(`Failed to send notification: ${String(error)}`);
    }
  }
}
