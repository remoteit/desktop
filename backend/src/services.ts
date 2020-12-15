import Logger from './Logger'
import EventBus from './EventBus'
const isPortReachable = require('is-port-reachable')

const EVENTS = {
  serviceCheckResponse: 'service/check-response',
}

export const checkHostAndPort = async (data: any) => {
  Logger.info('PING', { data })
  let isValid = false
  try {
    const { port, host } = data
    isValid = await isPortReachable(port, { host })
    Logger.info('IS PORT REACHABLE?', { isValid })
  } catch (error) {
    Logger.info('IS NOT VALID', { error })
    isValid = false
  }
  EventBus.emit(EVENTS.serviceCheckResponse, isValid)
}

export default { EVENTS }
