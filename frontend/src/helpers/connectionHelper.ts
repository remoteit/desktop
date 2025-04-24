import { emit } from '../services/Controller'
import { ANONYMOUS_MANUFACTURER_CODE, REGEX_CONNECTION_NAME, REGEX_CONNECTION_TRIM } from '../constants'
import { IP_PRIVATE, DEFAULT_CONNECTION } from '@common/constants'
import { Application, getApplicationType } from '@common/applications'
import { State, store } from '../store'
import { selectEnabledConnections } from '../selectors/connections'
import { selectActiveUser } from '../selectors/accounts'
import { getAllDevices } from '../selectors/devices'
import { selectById } from '../selectors/devices'
import browser from '../services/browser'

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

export function getManufacturerType(code?: number, reverseProxy?: boolean): ISession['manufacturer'] {
  if (code === ANONYMOUS_MANUFACTURER_CODE) {
    return reverseProxy ? 'ANONYMOUS' : 'KEY'
  }
  return 'UNKNOWN'
}

export function getManufacturerUser(code?: number, reverseProxy?: boolean): IUserRef | undefined {
  if (code === ANONYMOUS_MANUFACTURER_CODE) {
    return reverseProxy ? { id: 'ANON', email: 'Anonymous' } : { id: 'KEY', email: 'Service Key' }
  }
  return undefined
}

export function isSecureReverseProxy(template?: string) {
  if (!template) return null
  if (template.startsWith('https:')) return true
  if (template.startsWith('http:')) return false
  return null
}

export function isRelay(service?: IService) {
  return !!(service && service.host && service.host !== IP_PRIVATE && service.host !== 'localhost')
}

export function isFileToken(token: string) {
  return token === 'path' || token === 'app' || token.toLowerCase().includes('file')
}

export function findLocalConnection(state: State, id: string, sessionId: string | undefined) {
  return state.connections.all.find(c => c.id === id || c.sessionId === sessionId)
}

export function newConnection(service?: IService | null): IConnection {
  const state = store.getState()
  const user = selectActiveUser(state)
  const cd: ILookup<any> = state.user.attributes?.connectionDefaults?.[service?.typeID || '']
  let routeType: IRouteType = service?.attributes.route || cd?.route || 'failover'
  if (!browser.hasBackend && routeType === 'failover') routeType = 'public'

  let connection: IConnection = {
    ...DEFAULT_CONNECTION,
    ...routeTypeToSettings(routeType),
    owner: { id: user?.id || '', email: user?.email || 'Unknown' },
    autoLaunch: cd?.autoLaunch === undefined ? getApplicationType(service?.typeID || 0)?.autoLaunch : cd.autoLaunch,
    autoClose: getApplicationType(service?.typeID || 0)?.autoClose,
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
      disableSecurity: isSecureReverseProxy(service?.attributes.launchTemplate || cd?.launchTemplate) === false,
    }
    if (service.attributes.defaultPort && !usedPorts(state).includes(service.attributes.defaultPort)) {
      connection.port = service.attributes.defaultPort
    }
  }

  return connection
}

export function updateImmutableData(connection: IConnection, app?: Application): IConnection {
  if (!app) return connection
  let identity: ILookup<string> | undefined

  if (app.sshConfig) {
    const { lookup, tokens } = app
    identity = Object.fromEntries(tokens.map(token => [token, lookup?.[token]]))
  }

  return {
    ...connection,
    online: app.service?.state === 'active',
    typeID: app.service?.typeID,
    identity,
  }
}

export function routeTypeToSettings(route: IRouteType) {
  return {
    failover: route !== 'p2p',
    proxyOnly: route === 'proxy',
    public: route === 'public',
  }
}

export function usedPorts(state: State) {
  return state.connections.all.map(c => c.port)
}

export function launchDisabled(connection?: IConnection) {
  if (!connection) return true
  return !!(
    (connection.launchType === 'COMMAND' && !browser.hasBackend) ||
    connection.launchType === 'NONE' ||
    !connection.enabled ||
    !connection.online
  )
}

export function launchSettingHidden(connection?: IConnection) {
  if (!connection) return true
  return !!(
    (connection.launchType === 'COMMAND' && !browser.hasBackend) ||
    connection.connectLink ||
    connection.launchType === 'NONE'
  )
}

export const validPort = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
  const port = Math.max(0, Math.min(+event.target.value, 65535))
  return isNaN(port) ? 0 : port
}

export function updateConnection(app: Application, connection: IConnection) {
  app.connection = connection
  connection = updateImmutableData(connection, app)
  setConnection(connection)
}

export function setConnection(connection: IConnection) {
  const { auth } = store.getState()
  const { connections } = store.dispatch

  if (!connection.id || !connection.name || !connection.deviceID) {
    var error = new Error()
    console.warn('Connection missing data. Set failed', connection, error.stack)
    return false
  }
  if (!browser.hasBackend) {
    connections.updateConnection({ ...connection, default: false })
  } else if (auth.backendAuthenticated) {
    emit('connection', { ...connection, default: false })
  }
}

export function clearConnectionError(connection: IConnection) {
  console.log('CLEAR ERROR', connection)
  setConnection({ ...connection, error: undefined })
}

export function getFetchConnectionIds(state: State) {
  const thisId = state.backend.thisId
  const serviceIds = selectEnabledConnections(state).map(c => {
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

export function getConnectionLookup(state: State) {
  const { all } = state.connections
  return all.reduce((result: ConnectionLookup, c: IConnection) => {
    result[c.id] = c
    return result
  }, {})
}

export function getEndpoint(name?: string, port?: number) {
  if (!name) {
    name = 'Connecting...'
    port = undefined
  }

  return name + (port ? ':' + port : '')
}

export function sanitizeUrl(name: string) {
  return name?.toLowerCase().replace(REGEX_CONNECTION_NAME, '-').replace(REGEX_CONNECTION_TRIM, '')
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
