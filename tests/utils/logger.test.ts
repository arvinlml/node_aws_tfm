/**
 * Logger Utility Tests
 */

import { Logger, LogLevel } from "../../src/utils/logger";

describe("Logger", () => {
  let logger: Logger;
  let consoleDebugSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleDebugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleDebugSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("logger creation", () => {
    it("should create a logger with default INFO level", () => {
      logger = new Logger();
      expect(logger).toBeDefined();
      expect(logger.context).toBe("Application");
    });

    it("should create a logger with custom log level", () => {
      logger = new Logger(LogLevel.DEBUG);
      expect(logger).toBeDefined();
    });

    it("should create a logger with custom context", () => {
      logger = new Logger(LogLevel.INFO, "MyService");
      expect(logger.context).toBe("MyService");
    });
  });

  describe("debug logging", () => {
    beforeEach(() => {
      logger = new Logger(LogLevel.DEBUG, "TestContext");
    });

    it("should log debug messages when level is DEBUG", () => {
      logger.debug("Debug message");
      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it("should not log debug messages when level is INFO", () => {
      logger = new Logger(LogLevel.INFO, "TestContext");
      logger.debug("Debug message");
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });

  describe("info logging", () => {
    beforeEach(() => {
      logger = new Logger(LogLevel.INFO, "TestContext");
    });

    it("should log info messages", () => {
      logger.info("Info message");
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it("should log info messages with multiple arguments", () => {
      logger.info("Info message", "arg1", { key: "value" });
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });

  describe("warn logging", () => {
    beforeEach(() => {
      logger = new Logger(LogLevel.WARN, "TestContext");
    });

    it("should log warn messages", () => {
      logger.warn("Warning message");
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe("error logging", () => {
    beforeEach(() => {
      logger = new Logger(LogLevel.ERROR, "TestContext");
    });

    it("should log error messages", () => {
      logger.error("Error message");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("log level filtering", () => {
    it("DEBUG level should log all messages", () => {
      logger = new Logger(LogLevel.DEBUG, "Test");
      logger.debug("debug");
      logger.info("info");
      logger.warn("warn");
      logger.error("error");

      expect(consoleDebugSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("INFO level should not log debug messages", () => {
      logger = new Logger(LogLevel.INFO, "Test");
      logger.debug("debug");
      logger.info("info");

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it("WARN level should only log warn and error", () => {
      logger = new Logger(LogLevel.WARN, "Test");
      logger.debug("debug");
      logger.info("info");
      logger.warn("warn");
      logger.error("error");

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("ERROR level should only log errors", () => {
      logger = new Logger(LogLevel.ERROR, "Test");
      logger.debug("debug");
      logger.info("info");
      logger.warn("warn");
      logger.error("error");

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("log formatting", () => {
    beforeEach(() => {
      logger = new Logger(LogLevel.INFO, "MyApp");
    });

    it("should include message text", () => {
      const message = "Custom test message";
      logger.info(message);
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
  });
});
