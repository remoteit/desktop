require('dotenv').config()

import debug from 'debug'
import AirBrake from './AirBrake'
import Application from './Application'
import preferences from './preferences'
import { useApplication } from './sharedCopy/applications'
import ConnectionPool from './ConnectionPool'
import environment from './environment'
import EventBus from './EventBus'
import Logger from './Logger'
import LAN from './LAN'
import user, { User } from './User'
import cli from './cliInterface'
import { hostName } from './sharedCopy/nameHelper'
import { IP_PRIVATE } from './sharedCopy/constants'
import { WEB_DIR } from './constants'

const d = debug('r3:backend:backend')

Logger.info('ENVIRONMENT', environment.toJSON())

process
  .on('uncaughtException', (error: Error) => {
    d('Uncaught exception', error)
    AirBrake.notify({
      params: { type: 'UNCAUGHT EXCEPTION', version: environment.version },
      error,
    })
    Logger.warn('UNCAUGHT EXCEPTION', { error, details: error.toString(), trace: error.stack })
  })
  .on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
    d('Caught exception', reason, promise)
    AirBrake.notify({
      params: { type: 'UNHANDLED PROMISE REJECTION', promise, version: environment.version },
      error: reason,
    })
    Logger.warn('UNHANDLED PROMISE REJECTION', {
      reason,
      details: reason.message,
      stack: reason.stack,
      promise,
    })
  })

export default new Application()

// To support Electron wrapper
export { EVENTS } from './electronInterface'
export {
  useApplication,
  ConnectionPool,
  environment,
  EventBus,
  hostName,
  preferences,
  Logger,
  User,
  user,
  cli,
  LAN,
  IP_PRIVATE,
  WEB_DIR,
}
