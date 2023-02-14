import { emit } from '../services/Controller'
import { IP_PRIVATE, DEFAULT_CONNECTION } from '../shared/constants'
import { getActiveUser } from '../models/accounts'
import { getAllDevices } from '../selectors/devices'
import { ApplicationState, store } from '../store'
import { selectConnections } from '../selectors/connections'
import { selectById } from '../selectors/devices'
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
  return 'online'
}

export function isRelay(service?: IService) {
  return !!(service && service.host && service.host !== IP_PRIVATE && service.host !== 'localhost')
}

export function selectActiveCount(state: ApplicationState, connections: IConnection[]): string[] {
  const sessions = state.sessions.all.map(s => s.target.id)
  const connected = connections.filter(c => c.connected && !sessions.includes(c.id)).map(c => c.id)
  return sessions.concat(connected)
}

export function findLocalConnection(state: ApplicationState, id: string, sessionId: string | undefined) {
  return state.connections.all.find(c => c.id === id && (c.sessionId === sessionId || c.connecting))
}

export function newConnection(service?: IService | null) {
  const state = store.getState()
  const user = getActiveUser(state)
  const cd: ILookup<any> = state.user.attributes?.connectionDefaults?.[service?.typeID || '']
  let routeType: IRouteType = service?.attributes.route || cd?.route || 'failover'
  if (isPortal() && routeType === 'failover') routeType = 'public'

  let connection: IConnection = {
    ...DEFAULT_CONNECTION,
    ...routeTypeToSettings(routeType),
    owner: { id: user?.id || '', email: user?.email || 'Unknown' },
    autoLaunch:
      cd?.autoLaunch === undefined ? [8, 10, 33, 7, 30, 38, 42].includes(service?.typeID || 0) : cd.autoLaunch, // FIXME
  }

  if (service) {
    const [_, device] = selectById(state, undefined, service.deviceID)
    connection = {
      ...connection,
      name: service.subdomain,
      id: service.id,
      deviceID: service.deviceID,
      owner: device?.owner || connection.owner,
      accountId: device?.accountId || user.id,
      online: service.state === 'active',
      typeID: service.typeID,
      targetHost: service.attributes.targetHost,
      description: service.attributes.description,
    }
    if (service.attributes.defaultPort && !usedPorts(state).includes(service.attributes.defaultPort)) {
      connection.port = service.attributes.defaultPort
    }
  }

  return connection
}

export function routeTypeToSettings(route: IRouteType) {
  return {
    failover: route !== 'p2p',
    proxyOnly: route === 'proxy',
    public: route === 'public',
  }
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
  console.log('CLEAR ERROR', connection)
  setConnection({ ...connection, error: undefined })
}

export function getConnectionServiceIds(state: ApplicationState) {
  const thisId = state.backend.thisId
  const serviceIds = selectConnections(state).map(c => {
    // @TODO see if it would be better to put the connections into the correct accountId device model
    // console.log('connection ids', c.id, c.accountId)
    return c.id
  })
  if (thisId && !serviceIds.includes(thisId)) serviceIds.push(thisId)
  return serviceIds
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

export function getEndpoint(connection?: IConnection) {
  let name = connection?.host
  let port = connection?.port

  if (!name && connection?.connecting) {
    name = 'Connecting...'
    port = undefined
  }

  return name + (port ? ':' + port : '')
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
