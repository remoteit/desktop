import debug from 'debug'
import logger from './utils/logger'
import * as track from './utils/analytics'
import './utils/errorReporting'
import Application, { Environment } from './Application'

const d = debug('r3:backend:backend')

d('Starting up Electron application!')
track.event('app', 'startup', 'remote.it Desktop application has started')
logger.info('Desktop starting up!')

process.on('uncaughtException', function(err) {
  logger.error('Caught exception: ' + err)
})

export const application = new Application()

logger.info('Environment info:', Environment.toJSON())
