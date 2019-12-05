require('dotenv').config()

import AirBrake from './AirBrake'
import Application from './Application'
import debug from 'debug'
import Environment from './Environment'
import Logger from './Logger'
import Tracker from './Tracker'

const d = debug('r3:backend:backend')

d('Starting up Electron application!')
Logger.info('Environment info:', Environment.toJSON())

Tracker.pageView('/')
Tracker.event('app', 'startup', 'remote.it Desktop application has started')
Logger.info('Desktop starting up!')

process.on('uncaughtException', (error: Error) => {
  d('Caught exception', error)
  AirBrake.notify(error)
  Logger.warn('CAUGHT EXCEPTION', { error })
})

export const application = new Application()
