import { emit } from '../services/Controller'
import { IP_OPEN, IP_PRIVATE } from '../shared/constants'
import { attributeName } from '../shared/nameHelper'
import { getAllDevices, getActiveAccountId } from '../models/accounts'
import { ApplicationState } from '../store'
import { store } from '../store'

export const DEFAULT_CONNECTION = {
  id: 'service-id',
  name: 'Unknown',
  owner: { id: '', email: 'Unknown' },
  deviceID: 'Unknown',
  online: false,
  port: 33000,
  host: IP_PRIVATE,
  timeout: 15,
  restriction: IP_OPEN,
}

export function connectionState(instance?: IService | IDevice, connection?: IConnection): IConnectionState {
  if (instance?.state === 'inactive') return 'offline'
  if (connection) {
    if (!connection.online) return 'disconnected'
    if (connection.connecting) return 'connecting'
    if (connection.connected && !connection.enabled) return 'stopping'
    if (connection.connected) return 'connected'
    if (connection.enabled) return 'connected'
  }
  return 'disconnected'
}

export function findLocalConnection(state: ApplicationState, id: string, sessionId: string) {
  return state.backend.connections.find(c => c.id === id && (c.sessionId === sessionId || c.connecting))
}

type nameObj = { name: string }

export function connectionName(service?: nameObj, device?: nameObj): string {
  if (!device) return service?.name || ''
  if (!service) return device?.name || ''
  const deviceName = `${device.name} - `
  const serviceName = service.name
  return deviceName + serviceName.replace(deviceName, '')
}

export function newConnection(service?: IService | null) {
  const state = store.getState()
  const accountId = getActiveAccountId(state)
  const user = [...state.accounts.member, state.auth.user].find(u => u?.id === accountId)
  const port = service?.attributes.defaultPort || state.backend.freePort

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
    connection.name = attributeName(service)
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
  return state.backend.connections.filter(c => !!c.startTime)
}

export function getConnectionSessionIds() {
  const { connections } = store.getState().backend
  return connections.map(c => c.sessionId)
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
