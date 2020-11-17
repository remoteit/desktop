import { emit } from '../services/Controller'
import { IP_OPEN, IP_PRIVATE } from '../shared/constants'
import { attributeName } from '../shared/nameHelper'
import { getAllDevices, getAccountId } from '../models/accounts'
import { ApplicationState } from '../store'
import { store } from '../store'

export function newConnection(service?: IService | null, port?: number) {
  const state = store.getState()
  const accountId = getAccountId(state)
  const user = [...state.accounts.member, state.auth.user].find(u => u?.id === accountId)

  let connection: IConnection = {
    port,
    host: IP_PRIVATE,
    restriction: IP_OPEN,
    owner: { id: user?.id || '', email: user?.email || 'Unknown' },
    name: 'Unknown',
    id: 'Error',
    deviceID: 'Unknown',
    autoStart: true,
    online: false,
    failover: service?.attributes.route !== 'p2p',
    proxyOnly: service?.attributes.route === 'proxy',
  }

  if (service) {
    const device = getAllDevices(state).find((d: IDevice) => d.id === service.deviceID)
    // @TODO The whole service obj should be in the connection
    connection.name = attributeName(service)
    connection.id = service.id
    connection.deviceID = service.deviceID
    connection.online = service.state === 'active'
    connection.typeID = service.typeID
    if (device) connection.name = `${attributeName(device)} - ${attributeName(service)}`
  }

  return connection
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

export function getConnectionIds(state: ApplicationState) {
  const { device } = state.backend
  const connections = selectConnections(state)
  let ids = connections.map(c => c.id)
  if (device.uid && !ids.includes(device.uid)) ids.push(device.uid)
  return ids
}

export function selectConnections(state: ApplicationState) {
  return state.backend.connections.filter(c => !!c.startTime)
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
  const state = store.getState()
  const services = getAllDevices(state)
    .map(d => d.services.map(s => s.id))
    .flat()
  state.backend.connections.forEach(c => {
    if (!services.includes(c.id)) {
      emit('service/forget', c)
    }
  })
}
