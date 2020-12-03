import path from 'path'
import environment from './environment'
import { ENVIRONMENT } from './constants'

import * as winston from 'winston'

const ENV = process.env.NODE_ENV
const MAX_LOG_SIZE_BYTES = 100 * 1000 // 10mb
const MAX_LOG_FILES = 5

export const LOG_DIR = path.join(environment.userPath, 'log')

const { combine, timestamp, label, printf } = winston.format
const consoleFormat = printf(p => {
  const { timestamp, level, message } = p
  delete p.timestamp
  delete p.level
  delete p.message
  return `${message} ${level} ${timestamp} ${JSON.stringify(p, null, 4)}`
})

const transports = [
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'error.log'),
    format: consoleFormat,
    level: 'error',
    maxsize: MAX_LOG_SIZE_BYTES, // in bytes
    maxFiles: MAX_LOG_FILES,
    tailable: true,
    silent: ENV === 'test',
  }),
  new winston.transports.File({
    filename: path.join(LOG_DIR, 'combined.log'),
    format: consoleFormat,
    maxsize: MAX_LOG_SIZE_BYTES, // in bytes
    maxFiles: MAX_LOG_FILES,
    tailable: true,
    silent: ENV === 'test',
  }),
  new winston.transports.Console({
    format: combine(winston.format.colorize(), consoleFormat),
    silent: ENV === 'test',
  }),
]

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports,
})

logger.info('REMOTEIT DESKTOP STARTING UP ---------------------------------------------------------')
logger.info('NODE_ENV', { env: ENVIRONMENT })

export default logger
