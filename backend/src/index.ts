require('dotenv').config()

import AirBrake from './AirBrake'
import Application from './Application'
import debug from 'debug'
import environment from './environment'
import Logger from './Logger'
import Tracker from './Tracker'
import EventBus from './EventBus'
import CLI from './CLI'

const d = debug('r3:backend:backend')

d('Starting up Electron application!')
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

export const application = new Application()
