import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: 'blocket-bot' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...rest }) => {
          const meta = Object.keys(rest).length ? JSON.stringify(rest) : '';
          return `${timestamp} [${level}]: ${message} ${meta}`;
        }),
      ),
    }),
  ],
});

type LogInfo = {
  [key: string]: any;
  error?: Error;
  message?: string;
};

/**
 * Log at info level
 * @param messageOrInfo - Message string or object containing log information
 */
export function info(messageOrInfo: string | LogInfo): void {
  if (typeof messageOrInfo === 'string') {
    logger.info(messageOrInfo);
  } else {
    const { message = '', ...rest } = messageOrInfo;
    logger.info(message, rest);
  }
}

/**
 * Log at error level
 * @param messageOrInfo - Message string or object containing log information and error
 */
export function error(messageOrInfo: string | LogInfo): void {
  if (typeof messageOrInfo === 'string') {
    logger.error(messageOrInfo);
  } else {
    const { message = '', error, ...rest } = messageOrInfo;
    logger.error(message, { ...rest, error });
  }
}

/**
 * Log at warn level
 * @param messageOrInfo - Message string or object containing log information
 */
export function warn(messageOrInfo: string | LogInfo): void {
  if (typeof messageOrInfo === 'string') {
    logger.warn(messageOrInfo);
  } else {
    const { message = '', ...rest } = messageOrInfo;
    logger.warn(message, rest);
  }
}

/**
 * Log at debug level
 * @param messageOrInfo - Message string or object containing log information
 */
export function debug(messageOrInfo: string | LogInfo): void {
  if (typeof messageOrInfo === 'string') {
    logger.debug(messageOrInfo);
  } else {
    const { message = '', ...rest } = messageOrInfo;
    logger.debug(message, rest);
  }
}

export { logger as winston };

export default {
  info,
  error,
  warn,
  debug,
};
