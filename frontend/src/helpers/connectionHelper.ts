import Controller from '../services/Controller'
import { IP_OPEN, IP_PRIVATE } from '../constants'
import { IService } from 'remote.it'
import { store } from '../store'

export function newConnection(service?: IService | null, data = {}) {
  const { user } = store.getState().auth
  return {
    host: IP_PRIVATE,
    restriction: IP_OPEN,
    owner: user ? user.username : 'Unknown',
    name: service ? service.name : 'Unknown',
    id: service ? service.id : 'Error',
    deviceID: service ? service.deviceID : 'Unknown',
    ...data,
  } as IConnection
}

export function setConnection(connection: IConnection) {
  if (!connection.id || !connection.name || !connection.deviceID) {
    console.warn('Connection missing data. Set failed', connection)
    return false
  }
  Controller.emit('connection', connection)
}

export function clearConnectionError(connection: IConnection) {
  delete connection.error
  Controller.emit('connection', connection)
}
