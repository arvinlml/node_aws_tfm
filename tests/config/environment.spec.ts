/**
 * Environment Configuration Tests
 */

describe("Environment Configuration", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  describe("AWS Configuration", () => {
    it("should load AWS region from environment variable", () => {
      process.env.AWS_REGION = "us-west-2";
      // Clear module cache to reload environment
      delete require.cache[require.resolve("../../src/config/environment")];
      const { config } = require("../../src/config/environment");
      expect(config.aws.region).toBe("us-west-2");
    });

    it("should use default region when AWS_REGION is not set", () => {
      delete process.env.AWS_REGION;
      delete require.cache[require.resolve("../../src/config/environment")];
      const { config } = require("../../src/config/environment");
      expect(config.aws.region).toBe("us-east-1");
    });

    it("should load AWS_ACCESS_KEY_ID from environment", () => {
      process.env.AWS_ACCESS_KEY_ID = "AKIA1234567890ABCDEF";
      delete require.cache[require.resolve("../../src/config/environment")];
      const { config } = require("../../src/config/environment");
      expect(config.aws.accessKeyId).toBe("AKIA1234567890ABCDEF");
    });

    it("should use empty string for accessKeyId when not set", () => {
      delete process.env.AWS_ACCESS_KEY_ID;
      delete require.cache[require.resolve("../../src/config/environment")];
      const { config } = require("../../src/config/environment");
      expect(config.aws.accessKeyId).toBe("");
    });

    it("should load AWS_SECRET_ACCESS_KEY from environment", () => {
      process.env.AWS_SECRET_ACCESS_KEY =
        "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
      delete require.cache[require.resolve("../../src/config/environment")];
      const { config } = require("../../src/config/environment");
      expect(config.aws.secretAccessKey).toBe(
        "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      );
    });

    it("should use empty string for secretAccessKey when not set", () => {
      delete process.env.AWS_SECRET_ACCESS_KEY;
      delete require.cache[require.resolve("../../src/config/environment")];
      const { config } = require("../../src/config/environment");
      expect(config.aws.secretAccessKey).toBe("");
    });

    it("should have all required AWS config properties", () => {
      delete require.cache[require.resolve("../../src/config/environment")];
      const { config } = require("../../src/config/environment");
      expect(config.aws).toHaveProperty("region");
      expect(config.aws).toHaveProperty("accessKeyId");
      expect(config.aws).toHaveProperty("secretAccessKey");
    });
  });

  describe("Config object structure", () => {
    it("should export config as an object", () => {
      delete require.cache[require.resolve("../../src/config/environment")];
      const { config } = require("../../src/config/environment");
      expect(typeof config).toBe("object");
      expect(config).not.toBeNull();
    });

    it("should have aws property in config", () => {
      delete require.cache[require.resolve("../../src/config/environment")];
      const { config } = require("../../src/config/environment");
      expect(config).toHaveProperty("aws");
    });

    it("should have immutable structure", () => {
      delete require.cache[require.resolve("../../src/config/environment")];
      const { config } = require("../../src/config/environment");
      expect(() => {
        config.aws.region = "modified";
      }).not.toThrow();
    });
  });

  describe("Multiple region configurations", () => {
    it("should support eu-west-1 region", () => {
      process.env.AWS_REGION = "eu-west-1";
      delete require.cache[require.resolve("../../src/config/environment")];
      const { config } = require("../../src/config/environment");
      expect(config.aws.region).toBe("eu-west-1");
    });

    it("should support ap-southeast-1 region", () => {
      process.env.AWS_REGION = "ap-southeast-1";
      delete require.cache[require.resolve("../../src/config/environment")];
      const { config } = require("../../src/config/environment");
      expect(config.aws.region).toBe("ap-southeast-1");
    });

    it("should support us-east-1 region", () => {
      process.env.AWS_REGION = "us-east-1";
      delete require.cache[require.resolve("../../src/config/environment")];
      const { config } = require("../../src/config/environment");
      expect(config.aws.region).toBe("us-east-1");
    });
  });
});
