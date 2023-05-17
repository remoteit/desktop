import path from 'path'
import environment from './environment'
import { ENVIRONMENT } from './constants'
import { createLogger, format, transports } from 'winston'
import { TransformableInfo } from 'logform'
import util from 'util'

interface TransformableInfoWithSymbol extends TransformableInfo {
  [key: symbol]: any
}

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  {
    transform: (info: TransformableInfoWithSymbol) => {
      const args = info[Symbol.for('splat')]
      if (args) info.message = util.format(info.message, ...args)
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
