import BackendAdaptor from '../services/BackendAdapter'
import { IP_OPEN, IP_PRIVATE } from '../constants'
import { IService } from 'remote.it'

export function newConnection(service: IService, data = {}) {
  return {
    host: IP_PRIVATE,
    restriction: IP_OPEN,
    name: service.name,
    id: service.id,
    deviceID: service.deviceID,
    ...data,
  }
}

export function setConnection(connection: IConnection) {
  if (!connection.id || !connection.name || !connection.deviceID) {
    console.warn('Connection missing data. Set failed', connection)
    return false
  }
  BackendAdaptor.emit('connection', connection)
}

export function clearConnectionError(connection: IConnection) {
  delete connection.error
  BackendAdaptor.emit('connection', connection)
}
