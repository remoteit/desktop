require('dotenv').config()

import debug from 'debug'
import AirBrake from './AirBrake'
import Application from './Application'
import ConnectionPool from './ConnectionPool'
import environment from './environment'
import EventBus from './EventBus'
import Tracker from './Tracker'
import Logger from './Logger'
import CLI from './CLI'
import LAN from './LAN'
import user from './User'
import { hostName } from './helpers/nameHelper'
import { IP_PRIVATE } from './constants'
import { WEB_DIR } from './constants'

const d = debug('r3:backend:backend')

d('Starting up backend application!')
Logger.info('environment info:', environment.toJSON())

Tracker.pageView('/')
Tracker.event('app', 'startup', `App startup ${environment.platform}`)
Logger.info('Desktop starting up!')

process
  .on('uncaughtException', (error: Error) => {
    d('Caught exception', error)
    AirBrake.notify({ message: 'CAUGHT EXCEPTION', error })
    Logger.warn('CAUGHT EXCEPTION', { error, details: error.toString() })
    EventBus.emit(CLI.EVENTS.error, error.toString())
  })
  .on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
    d('Caught exception', reason, promise)
    AirBrake.notify({ message: 'UNHANDLED PROMISE REJECTION', reason, promise })
    Logger.warn('UNHANDLED PROMISE REJECTION', { reason, details: reason.toString(), promise })
    EventBus.emit(CLI.EVENTS.error, reason.toString())
  })

export default new Application()

// To support Electron wrapper
export { ConnectionPool, environment, EventBus, hostName, IP_PRIVATE, LAN, Logger, user, WEB_DIR }
