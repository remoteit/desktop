import { emit } from '../services/Controller'
import { IP_OPEN, IP_PRIVATE } from '../shared/constants'
import { store } from '../store'

export function newConnection(service?: IService | null, data = {}) {
  const { auth, devices } = store.getState()

  let connection: IConnection = {
    host: IP_PRIVATE,
    restriction: IP_OPEN,
    owner: auth.user ? auth.user.username : 'Unknown',
    name: 'Unknown',
    id: 'Error',
    deviceID: 'Unknown',
    autoStart: true,
    online: false,
    failover: true,
  }

  if (service) {
    const device = devices.all.find((d: IDevice) => d.id === service.deviceID)
    // @TODO The whole service obj should be in the connection
    connection.name = service.name
    connection.id = service.id
    connection.deviceID = service.deviceID
    connection.online = service.state === 'active'
    connection.typeID = service.typeID
    if (device) connection.name = `${device.name} - ${service.name}`
  }

  return { ...connection, ...data } as IConnection
}

export function setConnection(connection: IConnection) {
  if (!connection.id || !connection.name || !connection.deviceID) {
    var error = new Error()
    console.warn('Connection missing data. Set failed', connection, error.stack)
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
  let lookup = connections.reduce((result: ConnectionLookup, c: IConnection) => {
    result[c.id] = c
    return result
  }, {})

  devices.forEach(d => {
    d.services.forEach(s => {
      const connection = lookup[s.id]

      const online = s.state === 'active'
      if (connection && connection.online !== online) {
        setConnection({ ...connection, deviceID: d.id, online })
      }
    })
  })

  return devices
}

export function cleanOrphanConnections() {
  const { backend, devices } = store.getState()
  const services = devices.all.map(d => d.services.map(s => s.id)).flat()
  backend.connections.forEach(c => {
    if (!services.includes(c.id)) {
      console.log('DELETE CONNECTION', c)
      emit('service/forget', c)
    }
  })
}
