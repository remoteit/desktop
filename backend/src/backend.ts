import debug from 'debug'
import logger from './utils/logger'
import * as track from './utils/analytics'
import * as Platform from './services/Platform'
import './utils/errorReporting'
import Application from './Application'

const d = debug('r3:backend:backend')

d('Starting up Electron application!')
track.event('app', 'startup', 'remote.it Desktop application has started')
logger.info('Desktop starting up!')
logger.info('Platform info', Platform)

process.on('uncaughtException', function(err) {
  logger.error('Caught exception: ' + err)
})

export const application = new Application()
