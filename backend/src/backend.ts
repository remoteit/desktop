require('dotenv').config()

import debug from 'debug'
import logger from './utils/logger'
import Tracker from './utils/analytics'
import './utils/errorReporting'
import Application, { Environment } from './Application'

const d = debug('r3:backend:backend')

d('Starting up Electron application!')
Tracker.pageView('/')
Tracker.event('app', 'startup', 'remote.it Desktop application has started')
logger.info('Desktop starting up!')

process.on('uncaughtException', function(err) {
  logger.error('Caught exception: ' + err)
})

export const application = new Application()

logger.info('Environment info:', Environment.toJSON())
