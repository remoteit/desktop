import { emit } from '../services/Controller'
import { IP_OPEN, IP_PRIVATE } from '../constants'
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
    autoStart: true,
    online: false,
  }

  if (service) {
    const device = devices.all.find(d => d.id === service.deviceID)
    connection.name = service.name
    connection.id = service.id
    connection.deviceID = service.deviceID
    connection.online = service.state === 'active'
    if (device) connection.name = `${device.name} - ${service.name}`
  }

  return { ...connection, ...data } as IConnection
}

export function setConnection(connection: IConnection) {
  if (!connection.id || !connection.name || !connection.deviceID) {
    console.warn('Connection missing data. Set failed', connection)
    return false
  }
  emit('connection', connection)
}

export function clearConnectionError(connection: IConnection) {
  delete connection.error
  emit('connection', connection)
}

export function updateConnections(devices: IDevice[]) {
  const { connections } = store.getState().backend
  const lookup = connections.reduce((result: ConnectionLookup, c: IConnection) => {
    result[c.id] = c
    return result
  }, {})

  devices.forEach(d => {
    d.services.forEach(s => {
      const connection = lookup[s.id]
      const online = s.state === 'active'
      if (connection && connection.online !== online) {
        console.log('SET CONNECTION', connection, online)
        setConnection({ ...connection, online })
      }
    })
  })

  return devices
}
