const moduleAlias = require('module-alias')
moduleAlias.addAlias('@common', __dirname + '/common')

import 'win-ca'
import * as dotenv from 'dotenv'
import './initializeCommon'
import debug from 'debug'
import AirBrake from './AirBrake'
import environment from './environment'
import Application from './Application'
import preferences from './preferences'
import ConnectionPool from './ConnectionPool'
import EventBus from './EventBus'
import Logger from './Logger'
import LAN from './LAN'
import cli from './cliInterface'
import user, { User } from './User'
import { hostName } from '@common/nameHelper'
import { IP_PRIVATE } from '@common/constants'
import { getApplication } from '@common/applications'
import { PROTOCOL, WEB_DIR } from './constants'

const d = debug('r3:backend:backend')

dotenv.config()
Logger.info('ENVIRONMENT', environment.toJSON())

process
  .on('uncaughtException', (error: Error) => {
    d('Uncaught exception', error)
    AirBrake.notify({
      params: { type: 'UNCAUGHT EXCEPTION' },
      context: { version: environment.version },
      error,
    })
    Logger.warn('UNCAUGHT EXCEPTION', { error, details: error.toString(), trace: error.stack })
  })
  .on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
    d('Caught exception', reason, promise)
    AirBrake.notify({
      params: { type: 'UNHANDLED PROMISE REJECTION', promise },
      context: { version: environment.version },
      error: reason,
    })
    Logger.warn('UNHANDLED PROMISE REJECTION', {
      reason,
      details: reason.message,
      stack: reason.stack,
      promise,
    })
  })
  .on('warning', error => {
    Logger.warn('UNHANDLED PROCESS WARNING', { e: error, stack: error.stack })
  })

export default new Application()

// To support Electron wrapper
export { EVENTS } from './electronInterface'
export {
  getApplication,
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
  PROTOCOL,
}
