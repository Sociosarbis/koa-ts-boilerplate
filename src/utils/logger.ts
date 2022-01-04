import { join } from 'path';
import { createLogger, format, transports } from 'winston';
import { markClassFactory } from '@/common/makeClassFactory';

const createCustomLogger = markClassFactory(() => {
  return createLogger({
    level: 'info',
    format: format.combine(format.splat(), format.logstash()),
    transports:
      process.env.NODE_ENV === 'production'
        ? [
            new transports.File({
              filename: join(__dirname, 'logs/error.log'),
              level: 'error',
            }),
            new transports.File({
              filename: join(__dirname, 'logs/combined.log'),
            }),
          ]
        : [
            new transports.Console({
              handleExceptions: true,
              handleRejections: true,
            }),
          ],
    exceptionHandlers:
      process.env.NODE_ENV === 'production'
        ? [
            new transports.File({
              filename: join(__dirname, 'logs/exceptions.log'),
            }),
          ]
        : [],
    exitOnError: false,
  });
});

type CustomLogger = ReturnType<typeof createCustomLogger>;

export { CustomLogger };

export default createCustomLogger;
