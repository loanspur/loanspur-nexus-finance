// src/utils/logger.ts - Centralized logging utilities
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  timestamp: Date;
}

class Logger {
  private isDevelopment = import.meta.env.VITE_IS_DEVELOPMENT === 'true';
  private logLevel: LogLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? `[${entry.context}]` : '';
    const data = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
    return `${timestamp} ${entry.level.toUpperCase()} ${context} ${entry.message}${data}`;
  }

  debug(message: string, context?: string, data?: any) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry: LogEntry = { level: LogLevel.DEBUG, message, context, data, timestamp: new Date() };
      console.debug(this.formatMessage(entry));
    }
  }

  info(message: string, context?: string, data?: any) {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry: LogEntry = { level: LogLevel.INFO, message, context, data, timestamp: new Date() };
      console.info(this.formatMessage(entry));
    }
  }

  warn(message: string, context?: string, data?: any) {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry: LogEntry = { level: LogLevel.WARN, message, context, data, timestamp: new Date() };
      console.warn(this.formatMessage(entry));
    }
  }

  error(message: string, context?: string, data?: any) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry: LogEntry = { level: LogLevel.ERROR, message, context, data, timestamp: new Date() };
      console.error(this.formatMessage(entry));
    }
  }
}

export const logger = new Logger();
