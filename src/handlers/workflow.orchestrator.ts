import { Context } from "aws-lambda";
import {
  SFNClient,
  StartExecutionCommand,
  CreateStateMachineCommand,
  DescribeStateMachineCommand,
} from "@aws-sdk/client-sfn";
import {
  WorkflowDefinition,
  WorkflowStep,
} from "../types/workflow.orchestration.types";
import { findWorkflowByEvent } from "../services/workflow.orchestration.finder.service";

const sfnClient = new SFNClient({});

const WORKFLOW_METADATA_TABLE =
  process.env.WORKFLOW_METADATA_TABLE || "WorkflowMetadataTable";
const STATE_MACHINE_ROLE_ARN =
  process.env.STATE_MACHINE_ROLE_ARN ||
  "arn:aws:states:us-east-1:123456789012:stateMachine:MyStateMachine";

export const workflowOrchestrator = async (event: any, context: Context) => {
  console.log("Workflow Orchestrator invoked with event:", {
    event: JSON.stringify(event),
    requestId: context.awsRequestId,
    eventType: event?.detail?.type || "unknown",
    functionName: context.functionName,
  });
  try {
    const detailType = event?.detail?.type || "unknown";
    const { detail } = event || {};

    // Find the appropriate workflow based on the event
    const workflowDefinition = await findWorkflowByEvent(
      detailType,
      WORKFLOW_METADATA_TABLE || "WorkflowMetadataTable",
    );
    if (!workflowDefinition) {
      console.warn("No matching workflow found for event:", {
        eventType: event?.detail?.type || "unknown",
      });
      return;
    }

    console.log("Found matching workflow:", {
      workflowId: workflowDefinition.workflowId,
      workflowName: workflowDefinition.workflowName,
    });
    console.log("Executing Workflow:", {
      workflowDefinition: JSON.stringify(workflowDefinition),
    });

    const stateMachineDefinition =
      generateStateMachineDefinition(workflowDefinition);

    const stateMachineArn = await ensureStateMachine(
      workflowDefinition.workflowId,
      workflowDefinition.workflowName,
      stateMachineDefinition,
    );

    const executionArn = await startStateMachineExecution(
      stateMachineArn,
      workflowDefinition,
      detail,
    );

    return {
      status: "success",
      workflowId: workflowDefinition.workflowId,
      executionArn,
    };
  } catch (error) {
    console.error("Error in Workflow Orchestrator:", error);
    throw error;
  }
};

export function generateStateMachineDefinition(
  workflow: WorkflowDefinition,
): string {
  const states: Record<string, any> = {};
  workflow.steps.forEach((step: WorkflowStep, index: number) => {
    const isLastStep = index === workflow.steps.length - 1;
    switch (step.stepName) {
      case "TASK":
        states[step.stepName] = {
          Type: "Task",
          Resource: "arn:aws:states:::lambda:invoke",
          Parameters: {
            FunctionName: `${step.executor}:$LATEST`,
            payload: {
              "executionId.$": "$$.Execution.Name",
              stepId: step.stepId,
              stepName: step.stepName,
              parameters: step.parameters || {},
              "input.$": "$",
            },
          },
          ResultPath: `$.${step.stepId.replace(/-/g, "_")}`,
          ResultSelector: {
            "output.$": "$.Payload",
          },
          Retry: [
            {
              ErrorEquals: ["States.TaskFailed", "States.Timeout"],
              IntervalSeconds: 2,
              MaxAttempts:
                step.errorHandler?.retries ||
                workflow.configuration?.retryPolicy?.maxAttempts,
              BackoffRate: workflow.configuration?.retryPolicy?.backoffRate,
            },
          ],
          Catch: step.errorHandler?.fallbackStep
            ? [
                {
                  ErrorEquals: ["States.ALL"],
                  Next: step.errorHandler?.fallbackStep,
                  ResultPath: `$.error`,
                },
              ]
            : undefined,
          Next: isLastStep
            ? "Success"
            : step.nextStep || workflow.steps[index + 1].stepName,
          TimeoutSeconds: 300,
        };
        break;
      case "CHOICE":
        states[step.stepName] = {
          Type: "Choice",
          Choices:
            step.choices?.map((choice) => {
              const conditionParts = choice.condition.split(" ");
              return {
                Variable: conditionParts[0],
                StringEquals: conditionParts[2]
                  ? conditionParts[2].replace(/['"]/g, "")
                  : undefined,
                Next: choice.nextStep,
              };
            }) || [],
          Default: step.nextStep || "Success",
        };
        break;
      case "PARALLEL":
        states[step.stepName] = {
          Type: "Parallel",
          Branches:
            step.branches?.map((branch) => ({
              StartAt: branch[0].stepName,
              States: generateBranchStates(branch),
            })) || [],
          Next: isLastStep
            ? "Success"
            : step.nextStep || workflow.steps[index + 1].stepName,
          ResultPath: `$.result_${step.stepId.replace(/-/g, "_")}`,
        };
        break;
      case "WAIT":
        states[step.stepName] = {
          Type: "Wait",
          Seconds: step.parameters?.seconds || 60,
          Next: isLastStep
            ? "Success"
            : step.nextStep || workflow.steps[index + 1].stepName,
        };
        break;
      case "PASS":
        states[step.stepName] = {
          Type: "Pass",
          Result: step.parameters || {},
          ResultPath: `$.steps.${step.stepName}`,
          Next: isLastStep
            ? "Success"
            : step.nextStep || workflow.steps[index + 1].stepName,
        };
        break;
      default:
        console.warn("Unsupported step type in workflow definition:", {
          stepName: step.stepName,
          stepType: step.stepType,
        });
        break;
    }
  });

  states["Success"] = {
    Type: "Succeed",
  };

  const stateMachine = {
    Comment: `State machine for workflow ${workflow.workflowName}`,
    StartAt: workflow.steps[0].stepName,
    States: states,
    TimeoutSeconds: workflow.configuration?.timeout,
  };

  return JSON.stringify(stateMachine);
}

export async function ensureStateMachine(
  workflowId: string,
  workflowName: string,
  definition: string,
): Promise<string> {
  const stateMachineName = `Workflow_${workflowName}_${workflowId}`;
  try {
    const describeCommand = new DescribeStateMachineCommand({
      stateMachineArn: `arn:aws:states:us-east-1:123456789012:stateMachine:${stateMachineName}`,
    });
    const describeResponse = await sfnClient.send(describeCommand);
    if (describeResponse.stateMachineArn) {
      console.log("State machine already exists:", {
        stateMachineArn: describeResponse.stateMachineArn,
      });
      return describeResponse.stateMachineArn;
    }
  } catch (error: any) {
    if (error.name !== "StateMachineDoesNotExist") {
      console.error("Error describing state machine:", error);
      throw error;
    } else {
      console.log("State machine does not exist, creating new one:", {
        stateMachineName,
      });
    }
  }
  const createCommand = new CreateStateMachineCommand({
    name: stateMachineName,
    definition,
    roleArn: STATE_MACHINE_ROLE_ARN,
  });
  const createResponse = await sfnClient.send(createCommand);
  console.log("Created new state machine:", {
    stateMachineArn: createResponse.stateMachineArn,
  });
  return createResponse.stateMachineArn!;
}

export async function startStateMachineExecution(
  stateMachineArn: string,
  workflowDefinition: WorkflowDefinition,
  eventDetail: any,
): Promise<string> {
  const input = JSON.stringify({
    workflowId: workflowDefinition.workflowId,
    workflowName: workflowDefinition.workflowName,
    eventDetail,
  });
  const command = new StartExecutionCommand({
    stateMachineArn,
    input,
  });
  const response = await sfnClient.send(command);
  console.log("Started Step Functions execution:", {
    executionArn: response.executionArn,
  });
  return response.executionArn!;
}

export function generateBranchStates(
  branch: WorkflowStep[],
): Record<string, any> {
  const states: Record<string, any> = {};

  branch.forEach((step: WorkflowStep, index: number) => {
    const isLastStep = index === branch.length - 1;

    states[step.stepName] = {
      Type: "Task",
      Resource: "arn:aws:states:::lambda:invoke",
      Parameters: {
        FunctionName: `${step.executor}:$LATEST`,
        payload: {
          "executionId.$": "$$.Execution.Name",
          stepId: step.stepId,
          // stepName: step.stepName,
          parameters: step.parameters || {},
          "input.$": "$",
        },
      },
      // ResultPath: `$.${step.stepId.replace(/-/g, "_")}`,
      // ResultSelector: {
      //   "output.$": "$.Payload",
      // },
      // Retry: [
      //   {
      //     ErrorEquals: ["States.TaskFailed", "States.Timeout"],
      //     IntervalSeconds: 2,
      //     MaxAttempts: step.errorHandler?.retries || 3,
      //     BackoffRate: 2,
      //   },
      // ],
      // Catch: step.errorHandler?.fallbackStep
      //   ? [
      //       {
      //         ErrorEquals: ["States.ALL"],
      //         Next: step.errorHandler.fallbackStep,
      //         ResultPath: "$.error",
      //       },
      //     ]
      //   : undefined,
      End: isLastStep,
      Next: isLastStep ? undefined : branch[index + 1].stepName,
      // TimeoutSeconds: 300,
    };
  });
  return states;
}
