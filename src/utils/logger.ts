export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export class Logger {
  private level: LogLevel;
  public context: unknown;

  constructor(
    level: LogLevel = LogLevel.INFO,
    context: unknown = "Application",
  ) {
    this.level = level;
    this.context = context;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  public debug(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(`[DEBUG] [${this.context}] ${message}`, ...args);
    }
  }

  public info(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(`[INFO] [${this.context}] ${message}`, ...args);
    }
  }

  public warn(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] [${this.context}] ${message}`, ...args);
    }
  }

  public error(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[ERROR] [${this.context}] ${message}`, ...args);
    }
  }
}

export const createLogger = (
  level: LogLevel = LogLevel.INFO,
  context: unknown = "Application",
): Logger => {
  return new Logger(level, context);
};
