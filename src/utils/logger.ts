import { join } from 'path'
import { createLogger, format, transports } from 'winston'
import { markClassFactory } from '@/common/makeClassFactory'
import { isProd } from './env'

const logger = createLogger({
  level: 'info',
  format: format.combine(format.splat(), format.logstash()),
  transports: isProd
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
  exceptionHandlers: isProd
    ? [
        new transports.File({
          filename: join(__dirname, 'logs/exceptions.log'),
        }),
      ]
    : [],
  exitOnError: false,
})

const createCustomLogger = markClassFactory(() => {
  return logger
})

type CustomLogger = ReturnType<typeof createCustomLogger>

export { CustomLogger, logger as rootLogger }

export default createCustomLogger
