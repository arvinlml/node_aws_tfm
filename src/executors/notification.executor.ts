import { Logger } from "../utils/logger";

export class NotificationExecutor {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async execute(notification: any): Promise<void> {
    this.logger.info(`Executing notification: ${JSON.stringify(notification)}`);
    // Implement the logic to process the notification here
  }
}
