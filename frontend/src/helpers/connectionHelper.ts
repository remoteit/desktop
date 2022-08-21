import { emit } from '../services/Controller'
import {
  DEFAULT_CONNECTION,
  REGEX_CONNECTION_NAME,
  REGEX_CONNECTION_TRIM,
  MAX_CONNECTION_NAME_LENGTH,
} from '../shared/constants'
import { getAllDevices, getActiveUser } from '../models/accounts'
import { ApplicationState, store } from '../store'
import { combinedName } from '../shared/nameHelper'
import { isPortal } from '../services/Browser'

export function connectionState(instance?: IService | IDevice, connection?: IConnection): IConnectionState {
  if (instance?.state === 'inactive') return 'offline'
  if (connection) {
    if (connection.starting) return 'starting'
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
  return name?.toLowerCase().replace(REGEX_CONNECTION_NAME, '-').replace(REGEX_CONNECTION_TRIM, '')
}

export function connectionName(service?: nameObj, device?: nameObj): string {
  let name = sanitizeName(combinedName(service, device))
  if (name.length > MAX_CONNECTION_NAME_LENGTH) name = name.substring(0, MAX_CONNECTION_NAME_LENGTH)
  return name
}

export function newConnection(service?: IService | null) {
  const state = store.getState()
  const user = getActiveUser(state)
  const cd = state.user.attributes?.connectionDefaults?.[service?.typeID || '']

  let connection: IConnection = {
    ...DEFAULT_CONNECTION,
    owner: { id: user?.id || '', email: user?.email || 'Unknown' },
    failover: cd?.route
      ? cd.route === 'failover'
      : service?.attributes.route
      ? service?.attributes.route === 'failover'
      : true, // default
    proxyOnly: cd?.route
      ? cd.route === 'proxy'
      : service?.attributes.route
      ? service?.attributes.route === 'proxy'
      : false, // default
    autoLaunch:
      cd?.autoLaunch === undefined ? [8, 10, 33, 7, 30, 38, 42].includes(service?.typeID || 0) : cd.autoLaunch,
    public: isPortal() || cd?.route === 'public' || service?.attributes.route === 'public' ? true : undefined,
  }

  if (service) {
    const device = getAllDevices(state).find((d: IDevice) => d.id === service.deviceID)
    connection.name = connectionName(service)
    connection.id = service.id
    connection.deviceID = service.deviceID
    connection.online = service.state === 'active'
    connection.typeID = service.typeID
    connection.targetHost = service.attributes.targetHost
    connection.description = service.attributes.description
    if (service.attributes.defaultPort && !usedPorts(state).includes(service.attributes.defaultPort)) {
      connection.port = service.attributes.defaultPort
    }
    if (device) connection.name = connectionName(service, device)
  }

  return connection
}

export function usedPorts(state: ApplicationState) {
  return state.connections.all.map(c => c.port)
}

export function launchDisabled(connection: IConnection) {
  return connection.launchType === 'COMMAND' && isPortal()
}

export const validPort = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
  const port = Math.max(0, Math.min(+event.target.value, 65535))
  return isNaN(port) ? 0 : port
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
  if (isPortal()) {
    connections.updateConnection(connection)
  } else if (auth.backendAuthenticated) {
    emit('connection', connection)
  }
}

export function clearConnectionError(connection: IConnection) {
  delete connection.error
  console.log('CLEAR ERROR', connection)
  setConnection(connection)
}

export function getConnectionIds(state: ApplicationState) {
  const thisId = state.backend.thisId
  const connections = selectConnections(state)
  let ids = connections.map(c => c.id)
  if (thisId && !ids.includes(thisId)) ids.push(thisId)
  return ids
}

export function selectConnections(state: ApplicationState) {
  return state.connections.all.filter(c => (!!c.createdTime || c.enabled) && (!isPortal() || c.public))
}

export function selectConnection(state: ApplicationState, service?: IService) {
  let connection = state.connections.all.find(c => c.id === service?.id) || newConnection(service)
  return connection
}

export function selectEnabledConnections(state: ApplicationState) {
  return selectConnections(state).filter(connection => connection.enabled)
}

export function getRoute(connection: IConnection): IRouteType {
  return connection.public ? 'public' : connection.proxyOnly ? 'proxy' : connection.failover ? 'failover' : 'p2p'
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
  const serviceIds = getAllDevices(state)
    .map(d => d.services.map(s => s.id))
    .flat()
  if (!state.ui.offline && serviceIds.length) {
    ids.forEach(id => {
      if (!serviceIds.includes(id)) {
        store.dispatch.connections.forget(id)
        console.log('FORGET ORPHANED CONNECTION', id)
      }
    })
  }
}
