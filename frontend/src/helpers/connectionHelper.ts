import Controller from '../services/Controller'
import { IP_OPEN, IP_PRIVATE } from '../constants'
import { IService } from 'remote.it'
import { store } from '../store'

export function newConnection(service?: IService | null, data = {}) {
  const { auth, devices } = store.getState()

  let connection = {
    host: IP_PRIVATE,
    restriction: IP_OPEN,
    owner: auth.user ? auth.user.username : 'Unknown',
    name: 'Unknown',
    id: 'Error',
    deviceID: 'Unknown',
  }

  if (service) {
    const device = devices.all.find(d => d.id === service.deviceID)
    connection.name = service.name
    connection.id = service.id
    connection.deviceID = service.deviceID
    if (device) connection.name = `${device.name} - ${service.name}`
  }

  return { ...connection, ...data } as IConnection
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
