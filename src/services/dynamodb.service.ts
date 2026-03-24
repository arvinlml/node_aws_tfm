/**
 * AWS DynamoDB Service Module
 */

import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  DeleteItemCommand,
  QueryCommand
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

export interface DynamoDBConfig {
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export class DynamoDBService {
  private client: DynamoDBClient;

  constructor(config: DynamoDBConfig) {
    this.client = new DynamoDBClient({ region: config.region });
  }

  async getItem(tableName: string, key: Record<string, any>): Promise<Record<string, any> | undefined> {
    try {
      const command = new GetItemCommand({
        TableName: tableName,
        Key: marshall(key)
      });
      const response = await this.client.send(command);
      return response.Item ? unmarshall(response.Item) : undefined;
    } catch (error) {
      throw new Error(`Failed to get item from DynamoDB: ${String(error)}`);
    }
  }

  async putItem(tableName: string, item: Record<string, any>): Promise<void> {
    try {
      const command = new PutItemCommand({
        TableName: tableName,
        Item: marshall(item)
      });
      await this.client.send(command);
    } catch (error) {
      throw new Error(`Failed to put item to DynamoDB: ${String(error)}`);
    }
  }

  async deleteItem(tableName: string, key: Record<string, any>): Promise<void> {
    try {
      const command = new DeleteItemCommand({
        TableName: tableName,
        Key: marshall(key)
      });
      await this.client.send(command);
    } catch (error) {
      throw new Error(`Failed to delete item from DynamoDB: ${String(error)}`);
    }
  }

  async query(tableName: string, indexName: string, expressionAttributeNames: Record<string, string>, keyConditionExpression: string, expressionAttributeValues?: Record<string, any>): Promise<Record<string, any>[]> {
    try {
      const command = new QueryCommand({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues ? marshall(expressionAttributeValues) : undefined
      });
      const response = await this.client.send(command);
      return response.Items ? response.Items.map(item => unmarshall(item)) : [];
    } catch (error) {
      throw new Error(`Failed to query DynamoDB: ${String(error)}`);
    }
  }
}
