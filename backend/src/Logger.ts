import fs from 'fs'
import path from 'path'
import environment from './environment'
import { ENVIRONMENT } from './constants'

import * as winston from 'winston'

const DEBUG = process.env.DEBUG
const MAX_LOG_SIZE_BYTES = 1e6 // 1mb
const MAX_LOG_FILES = 5

if (!fs.existsSync(environment.connectionLogPath)) fs.mkdirSync(environment.connectionLogPath, { recursive: true })

const { combine, printf } = winston.format
const consoleFormat = printf(p => {
  const { timestamp, level, message, ...rest } = p
  return `${message} ${level} ${timestamp} ${JSON.stringify(rest, null, 4)}`
})

const transports = [
  new winston.transports.File({
    filename: path.join(environment.logPath, 'error.log'),
    format: consoleFormat,
    level: 'error',
    maxsize: MAX_LOG_SIZE_BYTES, // in bytes
    maxFiles: MAX_LOG_FILES,
    tailable: true,
    silent: ENVIRONMENT === 'test',
  }),
  new winston.transports.File({
    filename: path.join(environment.logPath, 'combined.log'),
    format: consoleFormat,
    maxsize: MAX_LOG_SIZE_BYTES, // in bytes
    maxFiles: MAX_LOG_FILES,
    tailable: true,
    silent: ENVIRONMENT === 'test',
  }),
  new winston.transports.Console({
    format: combine(winston.format.colorize(), consoleFormat),
    silent: ENVIRONMENT === 'test' || !!DEBUG,
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
