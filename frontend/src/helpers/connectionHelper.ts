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
import { selectById } from '../models/devices'
import { isPortal } from '../services/Browser'

export function connectionState(instance?: IService | IDevice, connection?: IConnection): IConnectionState {
  if (instance?.state === 'inactive') return 'offline'
  if (connection) {
    if (connection.starting) return 'starting'
    if (connection.disconnecting) return 'disconnecting'
    if (connection.stopping) return 'stopping'
    if (connection.connecting) return 'connecting'
    if (connection.connected) return 'connected'
    if (connection.enabled) return 'ready'
  }
  return 'disconnected'
}

export function selectActiveCount(state: ApplicationState, connections: IConnection[]): string[] {
  const sessions = state.sessions.all.map(s => s.target.id)
  const connected = connections.filter(c => c.connected).map(c => c.id)
  return sessions.concat(connected)
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
    failover: getRouteDefault('failover', true, service, cd?.route),
    proxyOnly: getRouteDefault('proxy', false, service, cd?.route),
    autoLaunch:
      cd?.autoLaunch === undefined ? [8, 10, 33, 7, 30, 38, 42].includes(service?.typeID || 0) : cd.autoLaunch, // FIXME
    public: isPortal() || getRouteDefault('public', undefined, service, cd?.route),
  }

  if (service) {
    const [_, device] = selectById(state, service.deviceID)
    connection.name = connectionName(service)
    connection.id = service.id
    connection.deviceID = service.deviceID
    connection.accountId = device?.accountId || user.id
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

function getRouteDefault(
  type: IRouteType,
  actualDefault?: boolean,
  service?: IService | null,
  connectionDefaults?: IRouteType
) {
  if (service?.attributes.route) return service?.attributes.route === type
  if (connectionDefaults) return connectionDefaults === type
  return actualDefault
}

export function usedPorts(state: ApplicationState) {
  return state.connections.all.map(c => c.port)
}

export function launchDisabled(connection: IConnection) {
  return (
    (connection.launchType === 'COMMAND' && isPortal()) || connection.connectLink || connection.launchType === 'NONE'
  )
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

export function getConnectionServiceIds(state: ApplicationState) {
  const thisId = state.backend.thisId
  const serviceIds = selectConnections(state).map(c => c.id)
  if (thisId && !serviceIds.includes(thisId)) serviceIds.push(thisId)
  return serviceIds
}

export function selectConnections(state: ApplicationState) {
  return state.connections.all.filter(c => (!!c.createdTime || c.enabled) && (!isPortal() || c.public || c.connectLink))
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

export function getConnectionLookup(state: ApplicationState) {
  const { all } = state.connections
  return all.reduce((result: ConnectionLookup, c: IConnection) => {
    result[c.id] = c
    return result
  }, {})
}

export function parseLinkData(responseData: any) {
  if (!responseData.links) return []

  let result: ILinkData[] = responseData.links.map(l => ({
    ...l,
    subdomain: l.service.subdomain,
    serviceId: l.service.id,
    deviceId: l.service.device.id,
  }))

  console.log('PARSE LINK DATA RESULT', result)
  return result
}

export function cleanOrphanConnections(expectedIds?: IService['id'][]) {
  const state = store.getState()
  if (!expectedIds?.length || state.ui.offline) return

  const loadedIds = getAllDevices(state)
    .map(d => d.services.map(s => s.id))
    .flat()

  expectedIds.forEach(id => {
    if (!loadedIds.includes(id)) {
      store.dispatch.connections.forget(id)
      console.log('FORGET ORPHANED CONNECTION', id)
    }
  })
}
