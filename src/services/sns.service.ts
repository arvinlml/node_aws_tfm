/**
 * AWS SNS Service Module
 */

import { SNSClient, PublishCommand, SubscribeCommand, UnsubscribeCommand } from '@aws-sdk/client-sns';

export interface SNSConfig {
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export class SNSService {
  private client: SNSClient;

  constructor(config: SNSConfig) {
    this.client = new SNSClient({ region: config.region });
  }

  async publishMessage(topicArn: string, message: string, subject?: string): Promise<string> {
    try {
      const command = new PublishCommand({
        TopicArn: topicArn,
        Message: message,
        Subject: subject
      });
      const response = await this.client.send(command);
      return response.MessageId || '';
    } catch (error) {
      throw new Error(`Failed to publish message: ${String(error)}`);
    }
  }

  async subscribe(topicArn: string, protocol: string, endpoint: string): Promise<string> {
    try {
      const command = new SubscribeCommand({
        TopicArn: topicArn,
        Protocol: protocol,
        Endpoint: endpoint
      });
      const response = await this.client.send(command);
      return response.SubscriptionArn || '';
    } catch (error) {
      throw new Error(`Failed to subscribe: ${String(error)}`);
    }
  }

  async unsubscribe(subscriptionArn: string): Promise<void> {
    try {
      const command = new UnsubscribeCommand({
        SubscriptionArn: subscriptionArn
      });
      await this.client.send(command);
    } catch (error) {
      throw new Error(`Failed to unsubscribe: ${String(error)}`);
    }
  }
}
