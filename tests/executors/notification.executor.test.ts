/**
 * Notification Executor Tests
 */

import { NotificationExecutor } from "../../src/executors/notification.executor";
import { Logger, LogLevel } from "../../src/utils/logger";

describe("NotificationExecutor", () => {
  let executor: NotificationExecutor;
  let logger: Logger;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = new Logger(LogLevel.INFO, "NotificationExecutor");
    executor = new NotificationExecutor(logger);
  });

  it("should create an instance with a logger", () => {
    expect(executor).toBeDefined();
    expect(executor).toBeInstanceOf(NotificationExecutor);
  });

  it("should have execute method", () => {
    expect(typeof executor.execute).toBe("function");
  });

  it("should execute with valid notification", async () => {
    const notification = {
      destination: "email@example.com",
      subject: "Test",
      body: "Test message",
    };

    await expect(executor.execute(notification)).resolves.not.toThrow();
  });

  it("should handle empty notification", async () => {
    const notification = {};
    await expect(executor.execute(notification)).resolves.not.toThrow();
  });

  it("should handle null notification", async () => {
    await expect(executor.execute(null)).resolves.not.toThrow();
  });

  it("should handle complex notification objects", async () => {
    const notification = {
      id: "notif-123",
      type: "sms",
      recipient: "+1234567890",
      message: "Welcome to our service",
      metadata: {
        priority: "high",
        retry: true,
        tags: ["welcome", "notification"],
      },
    };

    await expect(executor.execute(notification)).resolves.not.toThrow();
  });

  it("should handle notification with nested data", async () => {
    const notification = {
      id: "123",
      type: "email",
      recipient: {
        name: "John Doe",
        email: "john@example.com",
      },
      content: {
        subject: "Test Email",
        body: "This is a test",
        attachments: [],
      },
    };

    await expect(executor.execute(notification)).resolves.not.toThrow();
  });
});
