/**
 * AWS EventBridge Service Module
 */

import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';

export interface EventBridgeConfig {
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export interface EventBridgeEvent {
  Source: string;
  DetailType: string;
  Detail: Record<string, any>;
  EventBusName?: string;
}

export class EventBridgeService {
  private client: EventBridgeClient;

  constructor(config: EventBridgeConfig) {
    this.client = new EventBridgeClient({ region: config.region });
  }

  async putEvent(event: EventBridgeEvent): Promise<string[]> {
    try {
      const command = new PutEventsCommand({
        Entries: [
          {
            Source: event.Source,
            DetailType: event.DetailType,
            Detail: JSON.stringify(event.Detail),
            EventBusName: event.EventBusName || 'default'
          }
        ]
      });
      const response = await this.client.send(command);
      return response.Entries?.map(e => e.EventId || '') || [];
    } catch (error) {
      throw new Error(`Failed to put event: ${String(error)}`);
    }
  }

  async putEvents(events: EventBridgeEvent[]): Promise<string[]> {
    try {
      const command = new PutEventsCommand({
        Entries: events.map(event => ({
          Source: event.Source,
          DetailType: event.DetailType,
          Detail: JSON.stringify(event.Detail),
          EventBusName: event.EventBusName || 'default'
        }))
      });
      const response = await this.client.send(command);
      return response.Entries?.map(e => e.EventId || '') || [];
    } catch (error) {
      throw new Error(`Failed to put events: ${String(error)}`);
    }
  }
}
