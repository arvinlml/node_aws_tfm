/**
 * AWS Step Functions Service Module
 */

import { SFNClient, StartExecutionCommand, GetExecutionHistoryCommand, StopExecutionCommand } from '@aws-sdk/client-sfn';

export interface StepFunctionsConfig {
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export class StepFunctionsService {
  private client: SFNClient;

  constructor(config: StepFunctionsConfig) {
    this.client = new SFNClient({ region: config.region });
  }

  async startExecution(stateMachineArn: string, input?: Record<string, any>, name?: string): Promise<string> {
    try {
      const command = new StartExecutionCommand({
        stateMachineArn,
        name,
        input: input ? JSON.stringify(input) : undefined
      });
      const response = await this.client.send(command);
      return response.executionArn || '';
    } catch (error) {
      throw new Error(`Failed to start execution: ${String(error)}`);
    }
  }

  async getExecutionHistory(executionArn: string): Promise<any[]> {
    try {
      const command = new GetExecutionHistoryCommand({
        executionArn
      });
      const response = await this.client.send(command);
      return response.events || [];
    } catch (error) {
      throw new Error(`Failed to get execution history: ${String(error)}`);
    }
  }

  async stopExecution(executionArn: string, cause?: string): Promise<void> {
    try {
      const command = new StopExecutionCommand({
        executionArn,
        cause
      });
      await this.client.send(command);
    } catch (error) {
      throw new Error(`Failed to stop execution: ${String(error)}`);
    }
  }
}
