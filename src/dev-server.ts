import express, { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Mock Lambda Context Interface
interface MockContext {
  awsRequestId: string;
  functionName: string;
  functionVersion: string;
  invokedFunctionArn: string;
  memoryLimitInMB: string;
  logGroupName: string;
  logStreamName: string;
  callbackWaitsForEmptyEventLoop: boolean;
  getRemainingTimeInMillis: () => number;
}

const createMockContext = (functionName: string): MockContext => ({
  awsRequestId: `local-${Date.now()}`,
  functionName,
  functionVersion: "$LATEST",
  invokedFunctionArn: `arn:aws:lambda:us-east-1:123456789012:function:${functionName}`,
  memoryLimitInMB: "128",
  logGroupName: "/aws/lambda/local",
  logStreamName: "local-stream",
  callbackWaitsForEmptyEventLoop: true,
  getRemainingTimeInMillis: () => 300000,
});

// ==================
// Mock Handlers for Testing
// ==================

// Mock Workflow Orchestrator Handler
const mockWorkflowOrchestrator = async (event: any, context: MockContext) => {
  const eventType = event?.detail?.type || "unknown";

  console.log("[Workflow Orchestrator]", {
    eventType,
    requestId: context.awsRequestId,
    detail: event?.detail,
  });

  // Simulate workflow lookup and execution
  return {
    status: "success",
    workflowId: `workflow-${eventType}`,
    executionArn: `arn:aws:states:us-east-1:123456789012:execution:workflow-${eventType}:${Date.now()}`,
    message: `Workflow orchestration initiated for event type: ${eventType}`,
  };
};

// Mock Notification Handler
const mockNotificationHandler = async (event: any, context: MockContext) => {
  const { stepName, notificationType, recipient } = event;

  console.log("[Notification Handler]", {
    stepName,
    notificationType,
    recipient,
    requestId: context.awsRequestId,
  });

  // Simulate notification processing
  return {
    status: "success",
    message: `Notification processed: ${notificationType}`,
    sentTo: recipient,
    stepName,
  };
};

// ==================
// API Endpoints
// ==================

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Workflow Orchestrator endpoint
app.post("/api/workflow-orchestrator", async (req: Request, res: Response) => {
  try {
    console.log("📋 Received workflow orchestrator request:", req.body);
    const context = createMockContext("workflow-orchestrator");
    const result = await mockWorkflowOrchestrator(req.body, context);
    res.json({
      success: true,
      data: result,
      context: {
        requestId: context.awsRequestId,
        functionName: context.functionName,
      },
    });
  } catch (error) {
    console.error("❌ Workflow Orchestrator Error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Notification Handler endpoint
app.post("/api/notification-handler", async (req: Request, res: Response) => {
  try {
    console.log("📧 Received notification handler request:", req.body);
    const context = createMockContext("notification-handler");
    const result = await mockNotificationHandler(req.body, context);
    res.json({
      success: true,
      data: result,
      context: {
        requestId: context.awsRequestId,
        functionName: context.functionName,
      },
    });
  } catch (error) {
    console.error("❌ Notification Handler Error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Test data endpoints
app.get("/api/test-data/workflow", (req: Request, res: Response) => {
  res.json({
    detail: {
      type: "order.created",
      orderId: "order-123",
      customerId: "customer-456",
      amount: 99.99,
      timestamp: new Date().toISOString(),
    },
  });
});

app.get("/api/test-data/notification", (req: Request, res: Response) => {
  res.json({
    stepName: "send-order-confirmation",
    notificationType: "order-confirmation",
    recipient: "customer@example.com",
    subject: "Order Confirmation",
    message: "Your order has been received",
    orderId: "order-123",
  });
});

// API Documentation endpoint
app.get("/api/docs", (req: Request, res: Response) => {
  res.json({
    title: "AWS Lambda Handler Dev Server",
    version: "1.0.0",
    endpoints: [
      {
        method: "GET",
        path: "/health",
        description: "Health check endpoint",
      },
      {
        method: "POST",
        path: "/api/workflow-orchestrator",
        description: "Trigger workflow orchestration handler",
        parameterBody: "detail object with type, orderId, etc.",
      },
      {
        method: "POST",
        path: "/api/notification-handler",
        description: "Trigger notification handler",
        parameterBody: "stepName, notificationType, recipient, etc.",
      },
      {
        method: "GET",
        path: "/api/test-data/workflow",
        description: "Get sample workflow event data",
      },
      {
        method: "GET",
        path: "/api/test-data/notification",
        description: "Get sample notification event data",
      },
    ],
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: Function) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    availableEndpoints: "GET /api/docs",
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   🚀 AWS Lambda Handler Development Server                ║
║                                                            ║
║   Running at: http://localhost:${PORT}                     ║
╚════════════════════════════════════════════════════════════╝

📍 QUICK START:

  1. Check health:
     curl http://localhost:${PORT}/health

  2. View API docs:
     curl http://localhost:${PORT}/api/docs

  3. Test workflow handler:
     curl -X POST http://localhost:${PORT}/api/workflow-orchestrator \\
       -H "Content-Type: application/json" \\
       -d '{
         "detail": {
           "type": "order.created",
           "orderId": "order-123"
         }
       }'

  4. Test notification handler:
     curl -X POST http://localhost:${PORT}/api/notification-handler \\
       -H "Content-Type: application/json" \\
       -d '{
         "stepName": "send-email",
         "notificationType": "confirmation",
         "recipient": "user@example.com"
       }'

📚 Full documentation:
  See DEV_SERVER.md for complete guide

🛑 Stop server: Press Ctrl+C
═════════════════════════════════════════════════════════════
  `);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n🛑 Shutting down dev server...");
  server.close(() => {
    console.log("✓ Server stopped");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\n\n🛑 Shutting down dev server...");
  server.close(() => {
    console.log("✓ Server stopped");
    process.exit(0);
  });
});

export default app;
