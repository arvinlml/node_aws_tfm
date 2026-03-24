import { Context } from "aws-lambda";
import {
  SFNClient,
  StartExecutionCommand,
  CreateStateMachineCommand,
  DescribeStateMachineCommand,
} from "@aws-sdk/client-sfn";
import {
  workflowOrchestrator,
  generateStateMachineDefinition,
  ensureStateMachine,
  startStateMachineExecution,
  generateBranchStates,
} from "../../src/handlers/workflow.orchestrator";
import { findWorkflowByEvent } from "../../src/services/workflow.orchestration.finder.service";
import {
  WorkflowDefinition,
  WorkflowStep,
} from "../../src/types/workflow.orchestration.types";

jest.mock("@aws-sdk/client-sfn");
jest.mock("../../src/services/workflow.orchestration.finder.service");

const mockSFNClient = SFNClient as jest.MockedClass<typeof SFNClient>;
const mockFindWorkflowByEvent = findWorkflowByEvent as jest.MockedFunction<
  typeof findWorkflowByEvent
>;

describe("Workflow Orchestrator", () => {
  let mockContext: Context;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WORKFLOW_METADATA_TABLE = "TestWorkflowTable";
    process.env.STATE_MACHINE_ROLE_ARN =
      "arn:aws:iam::123456789012:role/StateMachineRole";

    mockContext = {
      awsRequestId: "test-request-id-12345",
      functionName: "testFunction",
      invokedFunctionArn: "arn:aws:lambda:us-east-1:123456789012:function:test",
      memoryLimitInMB: "128",
      logGroupName: "/aws/lambda/test",
      logStreamName: "2024/01/01/[$LATEST]abc123",
      callbackWaitsForEmptyEventLoop: true,
      getRemainingTimeInMillis: jest.fn(() => 30000),
    } as unknown as Context;

    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("workflowOrchestrator", () => {
    it("should successfully orchestrate a workflow with matching event", async () => {
      const mockWorkflow: WorkflowDefinition = {
        workflowId: "wf-001",
        workflowName: "TestWorkflow",
        version: "1.0.0",
        triggerEvents: ["order.created"],
        status: "active",
        steps: [
          {
            stepName: "TASK",
            stepId: "step-001",
            stepType: "TASK",
            executor: "arn:aws:lambda:us-east-1:123456789012:function:task1",
            nextStep: undefined,
            parameters: {},
          },
        ],
        configuration: {
          timeout: 3600,
          retryPolicy: {
            maxAttempts: 3,
            backoffRate: 2,
          },
        },
      };

      mockFindWorkflowByEvent.mockResolvedValue(mockWorkflow);

      const mockDescribeResponse = {
        stateMachineArn:
          "arn:aws:states:us-east-1:123456789012:stateMachine:test",
      };
      const mockSendDescribe = jest
        .fn()
        .mockResolvedValue(mockDescribeResponse);

      const mockExecutionResponse = {
        executionArn:
          "arn:aws:states:us-east-1:123456789012:execution:test:execution-1",
      };
      const mockSendStart = jest.fn().mockResolvedValue(mockExecutionResponse);

      mockSFNClient.prototype.send = jest
        .fn()
        .mockResolvedValueOnce(mockDescribeResponse)
        .mockResolvedValueOnce(mockExecutionResponse);

      const event = {
        detail: {
          type: "order.created",
          orderId: "order-123",
        },
      };

      const result = await workflowOrchestrator(event, mockContext);

      expect(result).toEqual({
        status: "success",
        workflowId: "wf-001",
        executionArn: mockExecutionResponse.executionArn,
      });
      expect(mockFindWorkflowByEvent).toHaveBeenCalledWith(
        "order.created",
        "TestWorkflowTable",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Workflow Orchestrator invoked with event:",
        expect.objectContaining({
          requestId: "test-request-id-12345",
          eventType: "order.created",
          functionName: "testFunction",
        }),
      );
    });

    it("should return early when no matching workflow is found", async () => {
      mockFindWorkflowByEvent.mockResolvedValue(null);

      const event = {
        detail: {
          type: "unknown.event",
        },
      };

      const result = await workflowOrchestrator(event, mockContext);

      expect(result).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "No matching workflow found for event:",
        expect.objectContaining({
          eventType: "unknown.event",
        }),
      );
    });

    it("should handle errors gracefully", async () => {
      const testError = new Error("Database connection failed");
      mockFindWorkflowByEvent.mockRejectedValue(testError);

      const event = {
        detail: {
          type: "order.created",
        },
      };

      await expect(workflowOrchestrator(event, mockContext)).rejects.toThrow(
        "Database connection failed",
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error in Workflow Orchestrator:",
        testError,
      );
    });

    it("should use default table name when environment variable is not set", async () => {
      delete process.env.WORKFLOW_METADATA_TABLE;

      mockFindWorkflowByEvent.mockResolvedValue(null);

      const event = {
        detail: {
          type: "test.event",
        },
      };

      await workflowOrchestrator(event, mockContext);

      expect(mockFindWorkflowByEvent).toHaveBeenCalledWith(
        "test.event",
        "WorkflowMetadataTable",
      );
    });
  });

  describe("generateStateMachineDefinition", () => {
    it("should generate state machine definition with TASK step", () => {
      const workflow: WorkflowDefinition = {
        workflowId: "wf-001",
        workflowName: "TaskWorkflow",
        version: "1.0.0",
        triggerEvents: ["task.execute"],
        status: "active",
        steps: [
          {
            stepName: "ProcessTask",
            stepId: "step-001",
            stepType: "TASK",
            executor:
              "arn:aws:lambda:us-east-1:123456789012:function:processor",
            nextStep: undefined,
            parameters: { key: "value" },
            errorHandler: {
              retries: 5,
              fallbackStep: "ErrorHandler",
            },
          },
        ],
        configuration: {
          timeout: 1800,
          retryPolicy: {
            maxAttempts: 3,
            backoffRate: 2,
          },
        },
      };

      const definition = generateStateMachineDefinition(workflow);
      const parsed = JSON.parse(definition);

      expect(parsed.Comment).toBe("State machine for workflow TaskWorkflow");
      expect(parsed.StartAt).toBe("ProcessTask");
      expect(parsed.States.ProcessTask.Type).toBe("Task");
      expect(parsed.States.ProcessTask.Resource).toBe(
        "arn:aws:states:::lambda:invoke",
      );
      expect(parsed.States.ProcessTask.Parameters.FunctionName).toBe(
        "arn:aws:lambda:us-east-1:123456789012:function:processor:$LATEST",
      );
      expect(parsed.States.ProcessTask.Next).toBe("Success");
      expect(parsed.States.ProcessTask.Retry[0].MaxAttempts).toBe(5);
      expect(parsed.States.ProcessTask.Catch).toBeDefined();
      expect(parsed.States.Success.Type).toBe("Succeed");
    });

    it("should generate state machine definition with CHOICE step", () => {
      const workflow: WorkflowDefinition = {
        workflowId: "wf-002",
        workflowName: "ChoiceWorkflow",
        version: "1.0.0",
        triggerEvents: ["choice.route"],
        status: "active",
        steps: [
          {
            stepName: "DecideRoute",
            stepId: "step-001",
            stepType: "CHOICE",
            choices: [
              {
                condition: '$.type == "premium"',
                nextStep: "PremiumProcess",
              },
              {
                condition: '$.type == "standard"',
                nextStep: "StandardProcess",
              },
            ],
            nextStep: "DefaultProcess",
          },
        ],
        configuration: {
          timeout: 900,
          retryPolicy: {
            maxAttempts: 2,
            backoffRate: 1.5,
          },
        },
      };

      const definition = generateStateMachineDefinition(workflow);
      const parsed = JSON.parse(definition);

      expect(parsed.States.DecideRoute.Type).toBe("Choice");
      expect(parsed.States.DecideRoute.Choices.length).toBe(2);
      expect(parsed.States.DecideRoute.Choices[0].Variable).toBe("$.type");
      expect(parsed.States.DecideRoute.Choices[0].StringEquals).toBe("premium");
      expect(parsed.States.DecideRoute.Default).toBe("DefaultProcess");
    });

    it("should generate state machine definition with PARALLEL step", () => {
      const workflow: WorkflowDefinition = {
        workflowId: "wf-003",
        workflowName: "ParallelWorkflow",
        version: "1.0.0",
        triggerEvents: ["parallel.execute"],
        status: "active",
        steps: [
          {
            stepName: "ParallelTasks",
            stepId: "step-001",
            stepType: "PARALLEL",
            branches: [
              [
                {
                  stepName: "Task1",
                  stepId: "task-1",
                  stepType: "TASK",
                  executor:
                    "arn:aws:lambda:us-east-1:123456789012:function:task1",
                  parameters: {},
                },
              ],
              [
                {
                  stepName: "Task2",
                  stepId: "task-2",
                  stepType: "TASK",
                  executor:
                    "arn:aws:lambda:us-east-1:123456789012:function:task2",
                  parameters: {},
                },
              ],
            ],
            nextStep: undefined,
          },
        ],
        configuration: {
          timeout: 3600,
          retryPolicy: {
            maxAttempts: 3,
            backoffRate: 2,
          },
        },
      };

      const definition = generateStateMachineDefinition(workflow);
      const parsed = JSON.parse(definition);

      expect(parsed.States.ParallelTasks.Type).toBe("Parallel");
      expect(parsed.States.ParallelTasks.Branches.length).toBe(2);
      expect(parsed.States.ParallelTasks.Next).toBe("Success");
    });

    it("should generate state machine definition with WAIT step", () => {
      const workflow: WorkflowDefinition = {
        workflowId: "wf-004",
        workflowName: "WaitWorkflow",
        version: "1.0.0",
        triggerEvents: ["wait.execute"],
        status: "active",
        steps: [
          {
            stepName: "WaitStep",
            stepId: "step-001",
            stepType: "WAIT",
            parameters: { seconds: 120 },
            nextStep: undefined,
          },
        ],
        configuration: {
          timeout: 300,
          retryPolicy: {
            maxAttempts: 1,
            backoffRate: 1,
          },
        },
      };

      const definition = generateStateMachineDefinition(workflow);
      const parsed = JSON.parse(definition);

      expect(parsed.States.WaitStep.Type).toBe("Wait");
      expect(parsed.States.WaitStep.Seconds).toBe(120);
      expect(parsed.States.WaitStep.Next).toBe("Success");
    });

    it("should generate state machine definition with PASS step", () => {
      const workflow: WorkflowDefinition = {
        workflowId: "wf-005",
        workflowName: "PassWorkflow",
        version: "1.0.0",
        triggerEvents: ["pass.execute"],
        status: "active",
        steps: [
          {
            stepName: "PassStep",
            stepId: "step-001",
            stepType: "PASS",
            parameters: { result: "static result" },
            nextStep: undefined,
          },
        ],
        configuration: {
          timeout: 60,
          retryPolicy: {
            maxAttempts: 1,
            backoffRate: 1,
          },
        },
      };

      const definition = generateStateMachineDefinition(workflow);
      const parsed = JSON.parse(definition);

      expect(parsed.States.PassStep.Type).toBe("Pass");
      expect(parsed.States.PassStep.Result).toEqual({
        result: "static result",
      });
      expect(parsed.States.PassStep.Next).toBe("Success");
    });

    it("should handle unsupported step type", () => {
      const workflow: any = {
        workflowId: "wf-006",
        workflowName: "UnknownWorkflow",
        version: "1.0.0",
        triggerEvents: ["unknown.execute"],
        status: "active",
        steps: [
          {
            stepName: "UnknownStep",
            stepId: "step-001",
            stepType: "Unknown",
            nextStep: undefined,
            parameters: {},
          },
        ],
        configuration: {
          timeout: 600,
          retryPolicy: {
            maxAttempts: 1,
            backoffRate: 1,
          },
        },
      };

      const definition = generateStateMachineDefinition(workflow);
      const parsed = JSON.parse(definition);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Unsupported step type in workflow definition:",
        expect.objectContaining({
          stepName: "UnknownStep",
          stepType: "Unknown",
        }),
      );
      expect(parsed.States.UnknownStep).toBeUndefined();
      expect(parsed.States.Success).toBeDefined();
    });

    it("should set timeout from workflow configuration", () => {
      const workflow: WorkflowDefinition = {
        workflowId: "wf-007",
        workflowName: "TimeoutWorkflow",
        version: "1.0.0",
        triggerEvents: ["timeout.execute"],
        status: "active",
        steps: [
          {
            stepName: "Task",
            stepId: "step-001",
            stepType: "TASK",
            executor: "arn:aws:lambda:us-east-1:123456789012:function:task",
            parameters: {},
          },
        ],
        configuration: {
          timeout: 7200,
          retryPolicy: {
            maxAttempts: 2,
            backoffRate: 1.5,
          },
        },
      };

      const definition = generateStateMachineDefinition(workflow);
      const parsed = JSON.parse(definition);

      expect(parsed.TimeoutSeconds).toBe(7200);
    });
  });

  describe("ensureStateMachine", () => {
    it("should return existing state machine ARN if it exists", async () => {
      const mockDescribeResponse = {
        stateMachineArn:
          "arn:aws:states:us-east-1:123456789012:stateMachine:Workflow_Test_wf-001",
      };

      const mockSend = jest.fn().mockResolvedValue(mockDescribeResponse);
      mockSFNClient.prototype.send = mockSend;

      const result = await ensureStateMachine(
        "wf-001",
        "Test",
        '{"StartAt": "State1"}',
      );

      expect(result).toBe(
        "arn:aws:states:us-east-1:123456789012:stateMachine:Workflow_Test_wf-001",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "State machine already exists:",
        expect.objectContaining({
          stateMachineArn:
            "arn:aws:states:us-east-1:123456789012:stateMachine:Workflow_Test_wf-001",
        }),
      );
    });

    it("should create new state machine when it does not exist", async () => {
      const notFoundError = new Error("StateMachineDoesNotExist");
      notFoundError.name = "StateMachineDoesNotExist";

      const mockCreateResponse = {
        stateMachineArn:
          "arn:aws:states:us-east-1:123456789012:stateMachine:Workflow_NewTest_wf-002",
      };

      const mockSend = jest
        .fn()
        .mockRejectedValueOnce(notFoundError)
        .mockResolvedValueOnce(mockCreateResponse);

      mockSFNClient.prototype.send = mockSend;

      const result = await ensureStateMachine(
        "wf-002",
        "NewTest",
        '{"StartAt": "State1"}',
      );

      expect(result).toBe(
        "arn:aws:states:us-east-1:123456789012:stateMachine:Workflow_NewTest_wf-002",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Created new state machine:",
        expect.objectContaining({
          stateMachineArn:
            "arn:aws:states:us-east-1:123456789012:stateMachine:Workflow_NewTest_wf-002",
        }),
      );
    });

    it("should propagate error if not StateMachineDoesNotExist", async () => {
      const accessDeniedError = new Error("Access Denied");
      accessDeniedError.name = "AccessDenied";

      const mockSend = jest.fn().mockRejectedValue(accessDeniedError);
      mockSFNClient.prototype.send = mockSend;

      await expect(
        ensureStateMachine("wf-003", "Test", '{"StartAt": "State1"}'),
      ).rejects.toThrow("Access Denied");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error describing state machine:",
        accessDeniedError,
      );
    });
  });

  describe("startStateMachineExecution", () => {
    it("should start execution and return execution ARN", async () => {
      const mockExecutionResponse = {
        executionArn:
          "arn:aws:states:us-east-1:123456789012:execution:test-machine:exec-001",
      };

      const mockSend = jest.fn().mockResolvedValue(mockExecutionResponse);
      mockSFNClient.prototype.send = mockSend;

      const workflow: WorkflowDefinition = {
        workflowId: "wf-001",
        workflowName: "TestWorkflow",
        version: "1.0.0",
        triggerEvents: ["test.execute"],
        status: "active",
        steps: [],
        configuration: {
          timeout: 600,
          retryPolicy: {
            maxAttempts: 1,
            backoffRate: 1,
          },
        },
      };

      const eventDetail = { orderId: "order-123" };

      const result = await startStateMachineExecution(
        "arn:aws:states:us-east-1:123456789012:stateMachine:test",
        workflow,
        eventDetail,
      );

      expect(result).toBe(
        "arn:aws:states:us-east-1:123456789012:execution:test-machine:exec-001",
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Started Step Functions execution:",
        expect.objectContaining({
          executionArn:
            "arn:aws:states:us-east-1:123456789012:execution:test-machine:exec-001",
        }),
      );
    });

    it("should include workflow data in execution input", async () => {
      const mockExecutionResponse = {
        executionArn:
          "arn:aws:states:us-east-1:123456789012:execution:test:exec-001",
      };

      const mockSend = jest.fn().mockResolvedValue(mockExecutionResponse);
      mockSFNClient.prototype.send = mockSend;

      const workflow: WorkflowDefinition = {
        workflowId: "wf-001",
        workflowName: "TestWorkflow",
        version: "1.0.0",
        triggerEvents: ["test.execute"],
        status: "active",
        steps: [],
        configuration: {
          timeout: 600,
          retryPolicy: {
            maxAttempts: 1,
            backoffRate: 1,
          },
        },
      };

      const eventDetail = { orderId: "order-456" };

      await startStateMachineExecution(
        "arn:aws:states:us-east-1:123456789012:stateMachine:test",
        workflow,
        eventDetail,
      );

      expect(mockSend).toHaveBeenCalled();
      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.input).toContain("wf-001");
      expect(callArgs.input).toContain("TestWorkflow");
      expect(callArgs.input).toContain("order-456");
    });
  });

  describe("generateBranchStates", () => {
    it("should generate states for a single step branch", () => {
      const branch: WorkflowStep[] = [
        {
          stepName: "Task1",
          stepId: "task-1",
          stepType: "TASK",
          executor: "arn:aws:lambda:us-east-1:123456789012:function:task1",
          parameters: { input: "data" },
        },
      ];

      const states = generateBranchStates(branch);

      expect(states.Task1).toBeDefined();
      expect(states.Task1.Type).toBe("Task");
      expect(states.Task1.End).toBe(true);
      expect(states.Task1.Next).toBeUndefined();
    });

    it("should generate states for multiple steps in branch", () => {
      const branch: WorkflowStep[] = [
        {
          stepName: "Task1",
          stepId: "task-1",
          stepType: "TASK",
          executor: "arn:aws:lambda:us-east-1:123456789012:function:task1",
          parameters: {},
        },
        {
          stepName: "Task2",
          stepId: "task-2",
          stepType: "TASK",
          executor: "arn:aws:lambda:us-east-1:123456789012:function:task2",
          parameters: {},
        },
      ];

      const states = generateBranchStates(branch);

      expect(states.Task1.End).toBe(false);
      expect(states.Task1.Next).toBe("Task2");
      expect(states.Task2.End).toBe(true);
      expect(states.Task2.Next).toBeUndefined();
    });

    it("should include correct resource and function names", () => {
      const functionArn =
        "arn:aws:lambda:us-east-1:123456789012:function:myFunction";
      const branch: WorkflowStep[] = [
        {
          stepName: "TaskStep",
          stepId: "step-1",
          stepType: "TASK",
          executor: functionArn,
          parameters: { key: "value" },
        },
      ];

      const states = generateBranchStates(branch);

      expect(states.TaskStep.Resource).toBe("arn:aws:states:::lambda:invoke");
      expect(states.TaskStep.Parameters.FunctionName).toBe(
        `${functionArn}:$LATEST`,
      );
      expect(states.TaskStep.Parameters.payload.stepId).toBe("step-1");
      expect(states.TaskStep.Parameters.payload.parameters).toEqual({
        key: "value",
      });
    });
  });
});
