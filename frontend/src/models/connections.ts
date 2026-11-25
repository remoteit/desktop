import sleep from '../helpers/sleep'
import browser from '../services/browser'
import structuredClone from '@ungap/structured-clone'
import { createModel } from '@rematch/core'
import { alphaSort, pickTruthy } from '../helpers/utilHelper'

// Browser-native replacement for node's url.parse (which rode in on a dependency shim
// that left with Amplify): same host/hostname/port fields, empty object on bad input.
const urlParse = (value?: string): { host?: string; hostname?: string; port?: string } => {
  try {
    return value ? new URL(value) : {}
  } catch {
    return {}
  }
}
import { DEFAULT_CONNECTION, IP_PRIVATE } from '@common/constants'
import { REGEX_HIDDEN_PASSWORD, CERTIFICATE_DOMAIN } from '../constants'
import {
  cleanOrphanConnections,
  getFetchConnectionIds,
  newConnection,
  setConnection,
  connectionAs,
  getConnectionLookup,
  lookedRecord,
  updateImmutableData,
} from '../helpers/connectionHelper'
import {
  graphQLConnect,
  graphQLDisconnect,
  graphQLSurvey,
  graphQLSetLink,
  graphQLRemoveLink,
} from '../services/graphQLMutation'
import { graphQLFetchConnections, graphQLDeviceAdaptor } from '../services/graphQLDevice'
import { decideWebAddress, readyWebAddress, webTarget } from '../services/webAddress'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { selectApplication } from '../selectors/applications'
import { accountFromDevice } from './accounts'
import { selectConnection } from '../selectors/connections'
import { selectById } from '../selectors/devices'
import { requestSignIn, selectAccountRoutes, selectRowOf } from '../selectors/signIns'
import { pickRecord, sameRecord } from '../helpers/connectionRecords'
import type { State } from '../store'
import { rowSub } from '../helpers/rowKey'
import { RootModel } from '.'
import { emit } from '../services/Controller'
import heartbeat from '../services/Heartbeat'
import i18n from '../i18n'

type IConnectionsState = {
  all: IConnection[]
  queue: IConnection[]
  queueCount?: number
  queueEnabling: boolean
  queueFinished: boolean
  queueConnection?: IConnection
  initialized: boolean
  updating: boolean
}

const defaultState: IConnectionsState = {
  all: [],
  queue: [],
  queueCount: 0,
  queueEnabling: false,
  queueFinished: false,
  queueConnection: undefined,
  initialized: false,
  updating: false,
}

// Whose a request about a connection is: its record's sign-in (helpers/connectionHelper connectionAs).
const forConnection = (connection: IConnection) => connectionAs(connection)

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async migrate(_: void, state) {
      // Migrate launch templates (v3.30)
      console.log('CONNECTIONS MIGRATE LAUNCH TEMPLATES')
      const connections = state.connections.all.map(c => {
        const app = selectApplication(state, undefined, c)
        c = { ...structuredClone(c) } // clone and spread to avoid "object is not extensible" error
        if (c.launchTemplate || c.commandTemplate) console.log('MIGRATING', c.name, c.id)
        if (!c.launchTemplates) c.launchTemplates = {}
        if (c.launchTemplate) c.launchTemplates.URL = c.launchTemplate
        if (c.commandTemplate) c.launchTemplates.COMMAND = c.commandTemplate
        if (!app.launchMethods.find(m => m.type === c.launchType)) delete c.launchType
        delete c.launchTemplate
        delete c.commandTemplate
        return c
      })
      await dispatch.connections.setAll(connections)
    },

    async fetch(_: void, state) {
      const accountId = state.auth.user?.id || state.user.id
      const serviceIds = getFetchConnectionIds(state)
      // One request per sign-in, each about the connections of the accounts it serves: a service another sign-in
      // alone reaches is not the page's own person's to read. With one sign-in in use, the one request as ever.
      const groups: ILookup<{ ids: string[]; accounts: string[] }> = {}
      const ask = (id: string, accountId?: string, said?: string) => {
        // As the sign-in the connection was made as, where it says.
        const sub = said ?? (requestSignIn(state, { about: [id], orAccount: accountId }) || '')
        const group = (groups[sub] ??= { ids: [], accounts: [] })
        if (!group.ids.includes(id)) group.ids.push(id)
        if (accountId && !group.accounts.includes(accountId)) group.accounts.push(accountId)
      }
      // Every record of each service: one two rows are connected to is read as each of their sign-ins.
      serviceIds.forEach(id => {
        const records = state.connections.all.filter(c => c.id === id)
        if (!records.length) ask(id)
        records.forEach(c => ask(id, c.accountId, c.sub))
      })
      const several = Object.keys(groups).some(sub => sub)
      const told: string[] = []
      const untold: string[] = []
      const answers = await Promise.all(
        Object.entries(groups).map(async ([sub, { ids, accounts }]) => {
          const response = await graphQLFetchConnections({ ids }, several ? { sub, about: accounts } : undefined)
          if (response === 'ERROR') {
            untold.push(...ids)
            return undefined
          }
          told.push(...ids)
          return (response?.data?.data?.login?.device || []) as any[]
        })
      )
      // A service is answered for only when every sign-in with a connection to it was: one that could not be asked
      // may still reach it, whatever another found — its device is kept, and its connection is no orphan.
      const answered = told.filter(id => !untold.includes(id))
      if (answers.every(answer => !answer)) {
        await dispatch.connections.set({ initialized: true })
        return
      }

      const gqlDevices = answers.flatMap(answer => answer || [])
      const devices = graphQLDeviceAdaptor({ gqlDevices, accountId, hidden: true })
      // A sign-in that could not be asked this time keeps the devices known for its connections: its failed read
      // says nothing of them, least of all that they are gone.
      const kept = (state.devices.connections?.all || []).filter(
        (device: IDevice) =>
          !devices.some(read => read.id === device.id) &&
          device.services.some(service => serviceIds.includes(service.id) && !answered.includes(service.id))
      )
      await dispatch.accounts.truncateMergeDevices({ devices: [...devices, ...kept], accountId: 'connections' })

      cleanOrphanConnections(answered)
      await dispatch.connections.set({ initialized: true })
    },

    async updateFromServices({ devices, accountId }: { devices: IDevice[]; accountId: string }) {
      await dispatch.connections.updateConnectionState({ devices, accountId })
      await dispatch.connections.updateCLI()
    },

    // `sub`: the sign-in the devices were read as, where they were read for a row of it: a connection made here for
    // one of their links is that row's.
    async updateConnectionState(
      { devices, accountId, sub }: { devices: IDevice[]; accountId: string; sub?: string },
      state
    ) {
      // Each service's record as the row the devices were read for has it (`sub`), else as the row looked at does.
      const routes = selectAccountRoutes(state)
      const looked = getConnectionLookup(state)
      const lookup: ConnectionLookup = {}
      devices.forEach(d =>
        d.services.forEach(s => {
          const own = sub === undefined ? undefined : pickRecord(routes, state.connections.all, s.id, accountId, sub, true)
          const record = sub === undefined ? looked[s.id] : own
          if (record) lookup[s.id] = record
        })
      )
      let result: IConnection[] = []

      devices.forEach(d => {
        d.services.forEach(async s => {
          let connection = structuredClone(lookup[s.id])
          const online = s.state === 'active'

          // add / update enabled connect links
          if (s.link?.enabled && s.link.web) {
            connection = connection || newConnection(s)
            connection = {
              ...connection,
              id: s.id,
              deviceID: d.id,
              name: connection.name || `${d.name} ${s.name}`,
              createdTime: s.link.created.getTime(),
              enabled: s.link.enabled,
              connectLink: s.link.enabled,
            }

            const url = urlParse(s.link.url)
            if (url.host) connection.host = url.host
            if (url.port) connection.port = parseInt(url.port, 10)
            if (s.link.password) connection.password = s.link.password
          }

          if (connection) {
            // Its row — the account, with the sign-in — as it was made. Made here: the row its device was read for
            // (a device shared with two people here is in a row of each one's account, so the account is the row's,
            // not the first of them the device belongs to); else its account, as that is looked at.
            const made = lookup[s.id]
            if (made?.sub === undefined || !made.accountId) {
              const of = sub !== undefined && accountId ? accountId : undefined
              connection.accountId =
                of ??
                accountFromDevice(
                  state,
                  d.owner.id,
                  d.access.map(a => a.id)
                )
              if (!made) {
                const as = sub ?? rowSub(selectRowOf(state, connection.accountId))
                if (as) connection.sub = as
                else delete connection.sub
              }
            }

            // disable connection if service is offline
            if (!online && !connection.connectLink && connection.enabled) {
              console.log('DISABLING OFFLINE CONNECTION', connection.name)
              await dispatch.connections.disconnect({ connection })
            }

            // remove connect links
            if (connection.connectLink && (!s.link || !s.link.enabled)) {
              console.log('UNLINK CONNECT LINK', s.id)
              connection.connectLink = DEFAULT_CONNECTION.connectLink
              connection.enabled = DEFAULT_CONNECTION.enabled
            }

            const app = selectApplication(state, s, connection)
            connection = updateImmutableData(connection, app)

            result.push(connection)
          }
        })
      })

      await dispatch.connections.mergeConnections(result)
    },

    async mergeConnections(connections: IConnection[], state) {
      if (!connections.length) return
      const all = state.connections.all
      const routes = selectAccountRoutes(state)
      // merge and remove new connections: each into its own record (the service, as its sign-in)
      const updated = all.map(c => {
        const index = connections.findIndex(a => sameRecord(routes, a, c))
        if (index >= 0) {
          const merged = { ...c, ...connections[index] }
          connections.splice(index, 1)
          return merged
        }
        return c
      })
      await dispatch.connections.setAll([...updated, ...connections])
    },

    async updateConnection(connection: IConnection, state) {
      const all = structuredClone(state.connections.all)
      const routes = selectAccountRoutes(state)

      let exists = false
      all.some((c, index) => {
        if (sameRecord(routes, c, connection)) {
          const transition = {
            id: connection.id,
            previous: {
              connected: c.connected,
              disconnecting: c.disconnecting,
              connecting: c.connecting,
              starting: c.starting,
              stopping: c.stopping,
              enabled: c.enabled,
            },
            incoming: {
              connected: connection.connected,
              disconnecting: connection.disconnecting,
              connecting: connection.connecting,
              starting: connection.starting,
              stopping: connection.stopping,
              enabled: connection.enabled,
            },
          }
          // Keep user-requested disconnect/stop transitions from regressing to
          // opposite transient states (e.g. "connecting") from out-of-order updates.
          if (c.disconnecting && connection.connected !== false) {
            connection = { ...connection, disconnecting: true, connecting: false, starting: false }
            console.log('HOLD DISCONNECTING TRANSITION', transition)
          }
          if (c.stopping && (connection.connecting || connection.starting || connection.connected)) {
            connection = { ...connection, stopping: true, connected: false, connecting: false, starting: false }
            console.log('HOLD STOPPING TRANSITION', transition)
          }
          if (c.disconnecting || connection.disconnecting || c.connected !== connection.connected) {
            console.log('CONNECTION TRANSITION UPDATE', transition)
          }
          all[index] = connection
          dispatch.connections.setAll(all)
          exists = true
          return true
        }
        return false
      })

      if (!exists) {
        all.push(connection)
        dispatch.connections.setAll(all)
      }
    },

    async updateCLI(_: void, state) {
      emit('connections', state.connections.all)
    },

    async restoreConnections(connections: IConnection[], state) {
      connections.forEach((connection, index) => {
        // data missing from cli if our connections file is lost
        if (!connection.owner || !connection.name) {
          console.log('CONNECTION MISSING DATA', connection.id)
          const [service] = selectById(state, undefined, connection.id)
          if (!connection.id) {
            delete connections[index]
            console.warn('No id found in connection', { connection })
          } else if (service) {
            let keep: string[] = [
              'host',
              'port',
              'enabled',
              'createdTime',
              'startTime',
              'endTime',
              'connected',
              'isP2P',
              'checklist',
              'restriction',
              'sessionId',
              'default',
            ]
            const picked = pickTruthy(keep, connection)
            connection = { ...newConnection(service), ...picked }
            setConnection(connection)
          } else if (!connection.port) {
            console.error(
              `No service or connection port found in connection. Connection cleared. ${JSON.stringify(connection)}`
            )
            dispatch.connections.forget(connection)
          } else {
            console.warn(`No service found for connection ${connection.id}. ${JSON.stringify(connection)}`)
            // @TODO fetch device if trying to restore a non-loaded connection
            // const device = await dispatch.devices.fetchSingle({ id: connection.id, hidden: true })
            // console.log('FETCHED DEVICE RETURNED:', device)
          }
        }
        // clear errors on connect
        if (connection.error && connection.connecting) {
          connection.error = undefined
        }
      })
      dispatch.connections.setAll(connections.filter(c => !!c))
    },

    async queueEnable({ serviceIds, enabled }: { serviceIds: string[]; enabled: boolean }) {
      const queue: IConnection[] = serviceIds.map(id => ({ id, enabled }))
      await dispatch.connections.set({ queue })
      dispatch.connections.checkQueue()
    },

    async checkQueue(_: void, state) {
      if (!state.connections.queue.length) {
        await dispatch.connections.set({ queueFinished: true })
        return
      }

      const queue = [...state.connections.queue]
      const trigger = queue.shift()

      if (!trigger) return

      const [service] = selectById(state, undefined, trigger.id)
      const connection = selectConnection(state, service)

      let different = false
      Object.keys(trigger).forEach(key => {
        if (trigger[key] !== connection[key]) {
          different = true
        }
      })

      console.log('QUEUE', { trigger, connection })
      console.log('NEXT', { different })

      if (different) {
        if (trigger.enabled) dispatch.connections.connect({ ...connection, ...trigger, autoStart: true })
        else dispatch.connections.disconnect({ connection: { ...connection, ...trigger } })
      }

      dispatch.connections.set({ queue })
      setTimeout(dispatch.connections.checkQueue, 200)
    },

    async proxyConnect(connection: IConnection): Promise<any> {
      const proxyConnection = {
        ...connection,
        createdTime: Date.now(),
        startTime: Date.now(),
        connecting: true,
      }

      setConnection(proxyConnection)
      const result = await graphQLConnect(connection.id, connection.publicRestriction, forConnection(connection))

      if (result === 'ERROR') {
        connection.error = { message: 'An error occurred connecting. Please ensure that the device is online.' }
        setConnection(connection)
        dispatch.ui.clearAutoLaunch(connection.id)
        if (connection.deviceID) dispatch.devices.fetchSingleFull({ id: connection.deviceID })
      } else {
        const data = result?.data?.data?.connect
        console.log('PROXY CONNECTED', data)
        setConnection({
          ...proxyConnection,
          ready: true,
          connecting: false,
          connected: true,
          error: undefined,
          isP2P: false,
          startTime: data.created,
          sessionId: data.id,
          timeout: data.timeout / 60,
          port: data.port,
          host: data.host,
        })
      }
    },

    async proxyDisconnect(connection: IConnection) {
      const disconnecting = {
        ...connection,
        enabled: false,
        disconnecting: true,
        connecting: false,
        starting: false,
      }
      const disconnected = { ...disconnecting, connected: false, disconnecting: false, ready: false }
      setConnection(disconnecting)

      if (!connection.sessionId) {
        console.warn('No sessionId for connection to proxy disconnect', connection)
        setConnection(disconnected)
        return
      }

      const result = await graphQLDisconnect(connection.id, connection.sessionId, forConnection(connection))

      if (result === 'ERROR') {
        setConnection(connection)
      } else {
        setConnection(disconnected)
        console.log('PROXY DISCONNECTED', result)
      }
    },

    async setConnectLink(connection: IConnection) {
      const creating: IConnection = { ...connection, connectLink: connection.enabled, updating: true }

      console.log('SET CONNECT LINK', connection)

      dispatch.connections.updateConnection(creating)
      const result = await graphQLSetLink(
        {
          serviceId: connection.id,
          enabled: connection.enabled,
          password: REGEX_HIDDEN_PASSWORD.test(connection.password || '')
            ? undefined
            : connection.password?.trim() || null,
        },
        forConnection(connection)
      )

      if (result === 'ERROR' || 'reason' in result || !result?.data?.data?.setConnectLink?.url) {
        const reason = result !== 'ERROR' && 'reason' in result ? result.reason : ''
        dispatch.connections.patchConnection({
          id: connection.id,
          sub: connection.sub,
          error: { message: reason || 'Persistent connection update failed. Please contact support.' },
          updating: false,
        })
        dispatch.devices.fetchSingleFull({ id: connection.id, isService: true })
        return
      }

      const data = result?.data?.data?.setConnectLink
      const url = urlParse(data?.url)

      setConnection({
        ...creating,
        updating: undefined,
        enabled: !!data?.enabled,
        createdTime: new Date(data.created).getTime(),
        port: url.port ? parseInt(url.port, 10) : undefined,
        host: url.hostname || undefined,
        error: undefined,
        starting: false,
        isP2P: false,
      })

      await dispatch.devices.updateService({
        id: connection.id,
        set: {
          link: {
            ...data,
            created: new Date(data.created),
          },
        },
      })

      dispatch.connections.set({ updating: false })
    },

    async removeConnectLink(connection?: IConnection) {
      if (!connection) return console.warn('No connection to disconnect')

      dispatch.connections.setConnectLink({ ...connection, enabled: false })
      dispatch.devices.updateService({ id: connection.id, set: { link: undefined } })
      const result = await graphQLRemoveLink(connection.id, forConnection(connection))

      if (result === 'ERROR') {
        dispatch.connections.patchConnection({
          id: connection.id,
          sub: connection.sub,
          error: { message: 'An error occurred removing your persistent connection. Please contact support.' },
        })
      }

      await dispatch.devices.fetchSingleFull({ id: connection.id, isService: true })
    },

    async connect(connection: IConnection, state) {
      connection = structuredClone(connection)
      const [service] = selectById(state, undefined, connection.id)
      // A web service opened at its web address (services/webAddress) has no connection. One of a network's started
      // together is made ready, nothing opened; one asked for with no click — a link, on arrival — is opened from its
      // page, a tab being only a click's to open.
      const target = webTarget(state, service, connection)
      // Where whether it is could not be checked nothing is connected: its proxy connection would be anyone's to use.
      const atAddress = !!target && target.web !== false && (await decideWebAddress(target))
      if (atAddress !== false) dispatch.ui.clearAutoLaunch(connection.id)
      if (atAddress === undefined) {
        const message = i18n.t('webAddress.unchecked', {
          defaultValue: 'Could not check how this service opens, so it was not connected. Try again.',
        })
        if (connection.autoStart) setConnection({ ...connection, enabled: false, autoStart: undefined, error: { message } })
        else dispatch.ui.set({ errorMessage: message })
        return false
      }
      if (target && atAddress) {
        if (connection.autoStart) {
          const ready = await readyWebAddress(target.id)
          if (ready !== UNSUPPORTED) {
            const error = ready === true ? undefined : { message: ready.reason || i18n.t('webAddress.failed', { defaultValue: 'Could not open it: try again' }) }
            if (error || connection.error)
              setConnection({ ...connection, enabled: false, autoStart: undefined, error })
            return false
          }
        } else {
          if (!window.location.hash.includes(target.id))
            dispatch.ui.set({ redirect: `/devices/${target.deviceID}/${target.id}/connect` })
          return false
        }
      }
      if (connection.autoLaunch && !connection.autoStart) dispatch.ui.set({ autoLaunch: connection.id })
      else dispatch.ui.clearAutoLaunch(connection.id)
      connection.online = service ? service?.state === 'active' : connection.online
      connection.host = undefined
      connection.error = undefined
      connection.autoStart = undefined
      connection.checkpoint = undefined
      connection.stopLock = undefined
      connection.enabled = true
      connection.ready = false

      if (connection.public || !browser.hasBackend) {
        dispatch.connections.proxyConnect(connection)
        return
      }

      connection.starting = true
      connection.host = state.backend.preferences.useCertificate
        ? `${connection.name}.${CERTIFICATE_DOMAIN}`
        : IP_PRIVATE
      dispatch.connections.updateConnection(connection)
      emit('service/connect', connection)
      heartbeat.connect()
    },

    async disconnect({ connection, forceStop }: { connection?: IConnection; forceStop?: boolean }) {
      if (!connection) {
        console.warn('No connection to disconnect')
        return
      }
      console.log('DISCONNECT REQUEST', {
        id: connection.id,
        forceStop,
        connected: connection.connected,
        disconnecting: connection.disconnecting,
        connecting: connection.connecting,
        starting: connection.starting,
      })
      dispatch.ui.clearAutoLaunch(connection.id)

      if (connection.public || !browser.hasBackend) {
        dispatch.connections.proxyDisconnect(connection)
        return
      }

      if (connection.connected && !forceStop) {
        connection = { ...connection, disconnecting: true, connecting: false, starting: false }
        dispatch.connections.patchConnection({
          id: connection.id,
          sub: connection.sub,
          disconnecting: true,
          connecting: false,
          starting: false,
        })
        emit('service/disconnect', connection)
      } else {
        const stopUpdate: Pick<
          IConnection,
          'stopping' | 'stopLock' | 'error' | 'enabled' | 'disconnecting' | 'connecting' | 'starting'
        > = {
          stopping: true,
          stopLock: Date.now(),
          error: undefined,
          enabled: false,
          disconnecting: false,
          connecting: false,
          starting: false,
        }
        connection = { ...connection, ...stopUpdate }
        dispatch.connections.patchConnection({ id: connection.id, sub: connection.sub, ...stopUpdate })
        emit('service/stop', connection)
      }
      heartbeat.disconnect()
    },

    async survey({ rating, connection }: { rating: number; connection: IConnection }) {
      if (!connection.sessionId) return
      const result = await graphQLSurvey(connection.id, connection.sessionId, rating, forConnection(connection))
      if (result === 'ERROR' || !result?.data?.data?.rateConnection) {
        dispatch.ui.set({
          errorMessage: i18n.t('notices:connection.surveyFailed', {
            defaultValue: 'Connection survey submission failed. Please contact support.',
          }),
        })
      }
    },

    /* Forgotten, and cleared, is ONE record: the service's, as one sign-in (helpers/connectionRecords). `of` is the
       record itself, or a service's id — then the record the row looked at has; `every`: all of the service's (it is
       gone). The other row's connection to the same service stays. */
    async forget(of: RecordSaid, state) {
      const { set } = dispatch.connections
      const { all } = state.connections
      const gone = recordsSaid(state, of)
      set({ all: all.filter(c => !gone.includes(c)) })
      if (state.auth.backendAuthenticated) emit('service/forget', { id: typeof of === 'string' ? of : of.id })
    },

    async clear(of: RecordSaid, state) {
      const { set } = dispatch.connections
      const { all } = state.connections
      const gone = recordsSaid(state, of)
      set({ all: all.filter(c => !gone.includes(c)) })
      if (state.auth.backendAuthenticated) emit('service/clear', { id: typeof of === 'string' ? of : of.id })
    },

    async clearByDevice(deviceId: string, state) {
      const { clear, disconnect } = dispatch.connections
      const { all } = state.connections
      all.forEach(async connection => {
        if (connection.deviceID === deviceId) {
          if (connection.connected) await disconnect({ connection })
          await clear(connection)
        }
      })
    },

    async clearRecent(_: void, state) {
      const { set } = dispatch.connections
      const { all } = state.connections
      if (state.auth.backendAuthenticated) emit('service/clearRecent')
      else set({ all: all.filter(c => c.enabled && c.online) })
    },

    async onClose(connection: IConnection, state) {
      const app = selectApplication(state, undefined, connection)
      if (connection.launched && connection.autoClose && app.disconnectString) {
        console.log('ON CONNECTION CLOSE', app.disconnectString)
        emit('launch/app', app.disconnectString, app.launchType)
        await sleep(2000)
      }
      dispatch.connections.patchConnection({ id: connection.id, sub: connection.sub, launched: false })
    },

    async setAll(all: IConnection[]) {
      all.sort((a, b) => alphaSort(a.name, b.name))
      dispatch.connections.set({ all: [...all] }) // to ensure we trigger update
    },
  }),
  reducers: {
    reset(state: IConnectionsState) {
      state = { ...defaultState }
      return state
    },
    set(state: IConnectionsState, params: Partial<IConnectionsState>) {
      Object.keys(params).forEach(key => {
        state[key] = params[key]
      })
      return state
    },
    // Into ONE record: the service's (`id`) as the sign-in said (`sub`; none, the page's own person).
    patchConnection(state: IConnectionsState, params: Partial<IConnection> & { id: string }) {
      const of = state.all.filter(c => c.id === params.id)
      const record = browser.hasBackend ? of[0] : of.find(c => (c.sub || '') === (params.sub || ''))
      const index = record ? state.all.indexOf(record) : -1
      if (index >= 0) state.all[index] = { ...state.all[index], ...params }
      return state
    },
  },
})

// The record(s) a caller means (forget, clear).
type RecordSaid = string | (Pick<IConnection, 'id' | 'accountId' | 'sub'> & { every?: boolean })

function recordsSaid(state: State, of: RecordSaid): IConnection[] {
  const { all } = state.connections
  if (typeof of === 'string') {
    const looked = lookedRecord(state, of)
    return looked ? [looked] : []
  }
  if (of.every) return all.filter(c => c.id === of.id)
  const routes = selectAccountRoutes(state)
  return all.filter(c => sameRecord(routes, c, of))
}
