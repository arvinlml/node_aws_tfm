/**
 * AWS SES Service Module
 */

import { SESClient, SendEmailCommand, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';

export interface SESConfig {
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export class SESService {
  private client: SESClient;

  constructor(config: SESConfig) {
    this.client = new SESClient({ region: config.region });
  }

  async sendEmail(from: string, to: string | string[], subject: string, htmlBody: string, textBody?: string): Promise<string> {
    try {
      const command = new SendEmailCommand({
        Source: from,
        Destination: {
          ToAddresses: Array.isArray(to) ? to : [to]
        },
        Message: {
          Subject: { Data: subject },
          Body: {
            Html: { Data: htmlBody },
            Text: textBody ? { Data: textBody } : undefined
          }
        }
      });
      const response = await this.client.send(command);
      return response.MessageId || '';
    } catch (error) {
      throw new Error(`Failed to send email: ${String(error)}`);
    }
  }

  async sendTemplatedEmail(from: string, to: string | string[], templateName: string, templateData: Record<string, any>): Promise<string> {
    try {
      const command = new SendTemplatedEmailCommand({
        Source: from,
        Destination: {
          ToAddresses: Array.isArray(to) ? to : [to]
        },
        Template: templateName,
        TemplateData: JSON.stringify(templateData)
      });
      const response = await this.client.send(command);
      return response.MessageId || '';
    } catch (error) {
      throw new Error(`Failed to send templated email: ${String(error)}`);
    }
  }
}
