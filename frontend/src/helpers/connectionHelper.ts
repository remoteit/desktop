import { emit } from '../services/Controller'
import { DEFAULT_CONNECTION, REGEX_CONNECTION_NAME, MAX_CONNECTION_NAME_LENGTH, IP_PRIVATE } from '../shared/constants'
import { getAllDevices, getActiveUser } from '../models/accounts'
import { ApplicationState, store } from '../store'
import { combinedName } from '../shared/nameHelper'

export function connectionState(instance?: IService | IDevice, connection?: IConnection): IConnectionState {
  if (instance?.state === 'inactive') return 'offline'
  if (connection) {
    if (connection.disconnecting) return 'disconnecting'
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

export function sanitizeName(name: string) {
  return name?.toLowerCase().replace(REGEX_CONNECTION_NAME, '-')
}

export function connectionName(service?: nameObj, device?: nameObj): string {
  let name = sanitizeName(combinedName(service, device))
  if (name.length > MAX_CONNECTION_NAME_LENGTH) name = name.substr(0, MAX_CONNECTION_NAME_LENGTH)
  return name
}

export function newConnection(service?: IService | null) {
  const state = store.getState()
  const user = getActiveUser(state)

  let connection: IConnection = {
    ...DEFAULT_CONNECTION,
    owner: { id: user?.id || '', email: user?.email || 'Unknown' },
    failover: service?.attributes.route !== 'p2p',
    proxyOnly: service?.attributes.route === 'proxy',
    autoLaunch: [8, 10, 33, 7, 30, 38, 42].includes(service?.typeID || 0), // default for web type services
    public: state.auth.backendAuthenticated ? undefined : true,
  }

  if (service) {
    const device = getAllDevices(state).find((d: IDevice) => d.id === service.deviceID)
    connection.name = connectionName(service)
    connection.id = service.id
    connection.deviceID = service.deviceID
    connection.online = service.state === 'active'
    connection.typeID = service.typeID
    connection.targetHost = service?.host || IP_PRIVATE
    if (device) connection.name = connectionName(service, device)
  }

  return connection
}

export function setConnection(connection: IConnection) {
  const { auth } = store.getState()
  const { connections } = store.dispatch
  connection.default = false
  if (!connection.id || !connection.name || !connection.deviceID) {
    var error = new Error()
    console.warn('Connection missing data. Set failed', connection, error.stack)
    return false
  }
  auth.backendAuthenticated ? emit('connection', connection) : connections.updateConnection(connection)
}

export function clearConnectionError(connection: IConnection) {
  delete connection.error
  console.log('CLEAR ERROR', connection)
  setConnection(connection)
}

export function getConnectionIds(state: ApplicationState) {
  const { device } = state.backend
  const connections = selectConnections(state)
  let ids = connections.map(c => c.id)
  if (device.uid && !ids.includes(device.uid)) ids.push(device.uid)
  return ids
}

export function selectConnections(state: ApplicationState) {
  return state.connections.all.filter(
    c => (!!c.createdTime || c.enabled) && (state.auth.backendAuthenticated || c.public)
  )
}

export function selectConnection(state: ApplicationState, service?: IService) {
  let connection = state.connections.all.find(c => c.id === service?.id) || newConnection(service)
  if (!state.auth.backendAuthenticated) connection.public = true
  return connection
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

export function cleanOrphanConnections(ids?: string[]) {
  if (!ids) return
  const state = store.getState()
  const services = getAllDevices(state)
    .map(d => d.services.map(s => s.id))
    .flat()
  if (!state.ui.offline && services.length) {
    state.connections.all.forEach(c => {
      if (ids.includes(c.id) && !services.includes(c.id)) store.dispatch.connections.forget(c.id)
    })
  }
}
