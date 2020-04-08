require('dotenv').config()

import debug from 'debug'
import AirBrake from './AirBrake'
import Application from './Application'
import preferences from './preferences'
import ConnectionPool from './ConnectionPool'
import environment from './environment'
import EventBus from './EventBus'
import Tracker from './Tracker'
import Logger from './Logger'
import LAN from './LAN'
import user from './User'
import cli from './cliInterface'
import { hostName } from './helpers/nameHelper'
import { IP_PRIVATE } from './constants'
import { WEB_DIR } from './constants'

const d = debug('r3:backend:backend')

d('Starting up backend application!')
Logger.info('environment info:', environment.toJSON())

Tracker.pageView('/')
Tracker.event('app', 'startup', `App startup ${environment.simpleOS}`)
Logger.info('Desktop starting up!')

process
  .on('uncaughtException', (error: Error) => {
    d('Uncaught exception', error)
    AirBrake.notify({
      params: { type: 'UNCAUGHT EXCEPTION' },
      error,
    })
    Logger.warn('UNCAUGHT EXCEPTION', { error, details: error.toString() })
  })
  .on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
    d('Caught exception', reason, promise)
    AirBrake.notify({
      params: { type: 'UNHANDLED PROMISE REJECTION', promise },
      error: reason,
    })
    Logger.warn('UNHANDLED PROMISE REJECTION', { reason, details: reason.toString(), promise })
  })

export default new Application()

// To support Electron wrapper
export { EVENTS } from './electronInterface'
export { ConnectionPool, environment, EventBus, hostName, preferences, Logger, user, cli, LAN, IP_PRIVATE, WEB_DIR }
