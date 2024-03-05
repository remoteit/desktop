import path from 'path'
import environment from './environment'
import { ENVIRONMENT } from './constants'
import { createLogger, format, transports } from 'winston'
import { TransformableInfo } from 'logform'
import util from 'util'

interface TransformableInfoWithSymbol extends TransformableInfo {
  [key: symbol]: any
}

const safeStringify = (obj: any) => {
  try {
    return JSON.stringify(obj, null, 2) // 2-space indentation
  } catch (error) {
    return util.inspect(obj, { depth: null, colors: false })
  }
}

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  {
    transform: (info: TransformableInfoWithSymbol) => {
      const args = info[Symbol.for('splat')]
      if (args) {
        for (let i = 0; i < args.length; i++) {
          if (typeof args[i] === 'object' && !(args[i] instanceof String)) {
            args[i] = safeStringify(args[i])
          }
        }
        info.message = util
          .format(info.message, ...args)
          .replace(/\\n/g, '\n')
          .replace(/\\'/g, "'")
      }
      return info
    },
  },
  format.printf(({ level, message, label, timestamp }) => `${timestamp} ${label || '-'} ${level}: ${message}`)
)

const logger = createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new transports.Console(),
    new transports.File({
      filename: path.join(environment.logPath, 'combined.log'),
      maxsize: 1e6, // approx 1mb
      maxFiles: 5, // Keep up to 5 rotated log files
      tailable: true, // Rename the existing log file and create a new one when the limit is reached
    }),
  ],
})

logger.info('REMOTEIT DESKTOP STARTING UP ---------------------------------------------------------')
logger.info('NODE_ENV', { env: ENVIRONMENT })

export default logger
