export interface WorkflowEvent {
  detailType: string;
  source: string;
  detail: {
    incidentId: string;
    eventType: string;
    timestamp: string;
    data: Record<string, any>;
  };
}

export interface WorkflowDefinition {
  workflowId: string;
  workflowName: string;
  version: string;
  triggerEvents: string[];
  steps: WorkflowStep[];
  configuration?: {
    timeout: number; // in seconds
    retryPolicy?: {
      maxAttempts: number;
      backoffRate: number;
    };
  };
  status: string; // e.g., "active", "inactive", "deprecated";
}

export interface WorkflowStep {
  stepId: string;
  stepName: string;
  stepType: "TASK" | "WAIT" | "CHOICE" | "PARALLEL" | "MAP" | "PASS" | "FAIL";
  executor?: string;
  parameters?: Record<string, any>;
  nextStep?: string;
  errorHandler?: {
    retries: number;
    fallbackStep: string;
  };
  choices?: Array<{
    condition: string;
    nextStep: string;
  }>;
  branches?: WorkflowStep[][];
}
