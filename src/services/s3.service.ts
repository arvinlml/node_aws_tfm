/**
 * AWS S3 Service Module
 */

import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

export interface S3Config {
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export class S3Service {
  private client: S3Client;

  constructor(config: S3Config) {
    this.client = new S3Client({ region: config.region });
  }

  async getObject(bucket: string, key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      const response = await this.client.send(command);
      
      // Handle the body as Buffer or stream
      if (Buffer.isBuffer(response.Body)) {
        return response.Body;
      }
      
      // For streams, convert to buffer
      if (response.Body) {
        const chunks: Uint8Array[] = [];
        const reader = (response.Body as any).getReader?.();
        
        if (reader) {
          let result = await reader.read();
          while (!result.done) {
            chunks.push(new Uint8Array(result.value));
            result = await reader.read();
          }
          return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
        }
      }
      
      return Buffer.alloc(0);
    } catch (error) {
      throw new Error(`Failed to get object from S3: ${String(error)}`);
    }
  }

  async putObject(bucket: string, key: string, data: Buffer): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: data
      });
      await this.client.send(command);
    } catch (error) {
      throw new Error(`Failed to put object to S3: ${String(error)}`);
    }
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
      await this.client.send(command);
    } catch (error) {
      throw new Error(`Failed to delete object from S3: ${String(error)}`);
    }
  }
}
