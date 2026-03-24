import { Context } from "aws-lambda";
import { NotificationExecutor } from "../executors/notification.executor";
import { Logger, LogLevel } from "../utils/logger";

const logger = new Logger(LogLevel.INFO, "NotificationHandler");
const notificationexecutor = new NotificationExecutor(logger);

export const notificationHandler = async (event: any, ctx: Context) => {
  logger.info("Received event:", JSON.stringify(event));

  logger.info(
    `Lambda context: functionName=${ctx.functionName}, stepName=${event.stepName}, awsRequestId=${ctx.awsRequestId}, memoryLimitInMB=${ctx.memoryLimitInMB}`,
  );

  try {
    const executor = new NotificationExecutor(logger);
    await executor.execute(event);
    logger.info("Notification processing completed successfully.");
  } catch (error) {
    logger.error(
      "Error processing notification:",
      error instanceof Error ? error.message : String(error),
    );
    throw error; // Rethrow to signal failure to AWS Lambda
  }
};
