import { emit } from '../services/Controller'
import { IP_OPEN, IP_LATCH } from '../shared/constants'
import { attributeName, removeDeviceName } from '../shared/nameHelper'
import { getAllDevices, getActiveAccountId } from '../models/accounts'
import { ApplicationState, store } from '../store'

export const DEFAULT_CONNECTION = {
  id: '',
  name: '',
  owner: { id: '', email: '' },
  deviceID: '',
  online: false,
  timeout: 15,
  restriction: IP_OPEN,
  publicRestriction: IP_LATCH,
}

export const PUBLIC_CONNECTION = {
  port: undefined,
  public: true,
  timeout: 15,
  isP2P: false,
  failover: false,
  proxyOnly: true,
  log: false,
}

export function connectionState(instance?: IService | IDevice, connection?: IConnection): IConnectionState {
  if (instance?.state === 'inactive') return 'offline'
  if (connection) {
    if (!connection.online) return 'disconnected'
    if ((connection.connected || connection.connecting) && !connection.enabled) return 'stopping'
    if (connection.connecting) return 'connecting'
    if (connection.connected) return 'connected'
    if (connection.enabled) return 'ready'
  }
  return 'disconnected'
}

export function findLocalConnection(state: ApplicationState, id: string, sessionId: string | undefined) {
  return state.connections.all.find(c => c.id === id && (c.sessionId === sessionId || c.connecting))
}

type nameObj = { name: string }

export function connectionName(service?: nameObj, device?: nameObj): string {
  let name: string[] = []
  if (device) {
    name.push(device.name)
    if (service && service.name !== device.name) name.push(removeDeviceName(device.name, service.name))
  } else if (service) name.push(service.name)
  return name
    .join(' ')
    .toLowerCase()
    .replace(/[-\s]+/g, '-')
}

export function newConnection(service?: IService | null) {
  const state = store.getState()
  const accountId = getActiveAccountId(state)
  const user = [...state.accounts.member, state.auth.user].find(u => u?.id === accountId)
  const port = service?.attributes.defaultPort //|| state.backend.freePort

  let connection: IConnection = {
    ...DEFAULT_CONNECTION,
    port,
    owner: { id: user?.id || '', email: user?.email || 'Unknown' },
    failover: service?.attributes.route !== 'p2p',
    proxyOnly: service?.attributes.route === 'proxy',
  }

  if (service) {
    const device = getAllDevices(state).find((d: IDevice) => d.id === service.deviceID)
    // @TODO The whole service obj should be in the connection
    connection.name = connectionName(service)
    connection.id = service.id
    connection.deviceID = service.deviceID
    connection.online = service.state === 'active'
    connection.typeID = service.typeID
    if (device) connection.name = connectionName(service, device)
  }

  return connection
}

export function setConnection(connection: IConnection) {
  if (!connection.id || !connection.name || !connection.deviceID) {
    var error = new Error()
    console.warn('Connection missing data. Set failed', connection, error.stack)
    return false
  }
  console.log('SET CONNECTION', connection.name, connection.enabled)
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
  return state.connections.all.filter(c => !!c.createdTime || c.enabled)
}

export function getConnectionSessionIds() {
  const { all } = store.getState().connections
  return all.map(c => c.sessionId)
}

export function updateConnections(devices: IDevice[]) {
  const { all } = store.getState().connections
  let lookup = all.reduce((result: ConnectionLookup, c: IConnection) => {
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
  if (!state.ui.offline && services.length) {
    state.connections.all.forEach(c => {
      if (!services.includes(c.id)) {
        emit('service/forget', c)
      }
    })
  }
}
