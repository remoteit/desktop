import sleep from '../helpers/sleep'
import browser from '../services/browser'
import structuredClone from '@ungap/structured-clone'
import { createModel } from '@rematch/core'
import { parse as urlParse } from 'url'
import { pickTruthy } from '../helpers/utilHelper'
import { DEFAULT_CONNECTION, IP_PRIVATE } from '@common/constants'
import { REGEX_HIDDEN_PASSWORD, CERTIFICATE_DOMAIN } from '../constants'
import {
  cleanOrphanConnections,
  getFetchConnectionIds,
  newConnection,
  setConnection,
  getConnectionLookup,
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
import { selectApplication } from '../selectors/applications'
import { accountFromDevice } from './accounts'
import { selectConnection } from '../selectors/connections'
import { selectById } from '../selectors/devices'
import { RootModel } from '.'
import { emit } from '../services/Controller'
import heartbeat from '../services/Heartbeat'

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
      const gqlResponse = await graphQLFetchConnections({ ids: serviceIds })
      if (gqlResponse === 'ERROR') return

      const gqlDevices = gqlResponse?.data?.data?.login?.device || []
      const devices = graphQLDeviceAdaptor({ gqlDevices, accountId, hidden: true })
      await dispatch.accounts.truncateMergeDevices({ devices, accountId: 'connections' })

      cleanOrphanConnections(serviceIds)
      await dispatch.connections.set({ initialized: true })
    },

    async updateFromServices({ devices, accountId }: { devices: IDevice[]; accountId: string }) {
      await dispatch.connections.updateConnectionState({ devices, accountId })
      await dispatch.connections.updateCLI()
    },

    async updateConnectionState({ devices, accountId }: { devices: IDevice[]; accountId: string }, state) {
      let lookup = getConnectionLookup(state)
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
            // assign account id
            connection.accountId = accountFromDevice(
              state,
              d.owner.id,
              d.access.map(a => a.id)
            )

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
      // merge and remove new connections
      const updated = all.map(c => {
        const index = connections.findIndex(a => a.id === c.id)
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

      let exists = false
      all.some((c, index) => {
        if (c.id === connection.id) {
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
            console.error('No service or connection port found in connection. Connection cleared.', { connection })
            dispatch.connections.forget(connection.id)
          } else {
            console.warn(`No service found for connection ${connection.id}`, { connection })
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
      const result = await graphQLConnect(connection.id, connection.publicRestriction)

      if (result === 'ERROR') {
        connection.error = { message: 'An error occurred connecting. Please ensure that the device is online.' }
        setConnection(connection)
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
      let disconnect = { ...connection, enabled: false }
      setConnection(disconnect)

      if (!connection.sessionId) {
        console.warn('No sessionId for connection to proxy disconnect', connection)
        return
      }

      const result = await graphQLDisconnect(connection.id, connection.sessionId)

      if (result === 'ERROR') {
        setConnection(connection)
      } else {
        setConnection({ ...disconnect, connected: false })
        console.log('PROXY DISCONNECTED', result)
      }
    },

    async setConnectLink(connection: IConnection) {
      const creating: IConnection = { ...connection, connectLink: connection.enabled, updating: true }

      console.log('SET CONNECT LINK', connection)

      dispatch.connections.updateConnection(creating)
      const result = await graphQLSetLink({
        serviceId: connection.id,
        enabled: connection.enabled,
        password: REGEX_HIDDEN_PASSWORD.test(connection.password || '')
          ? undefined
          : connection.password?.trim() || null,
      })

      if (result === 'ERROR' || !result?.data?.data?.setConnectLink?.url) {
        connection.error = { message: 'Persistent connection update failed. Please contact support.' }
        dispatch.connections.updateConnection(connection)
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
      const result = await graphQLRemoveLink(connection.id)

      if (result === 'ERROR') {
        connection.error = { message: 'An error occurred removing your persistent connection. Please contact support.' }
        await dispatch.connections.updateConnection(connection)
      }

      await dispatch.devices.fetchSingleFull({ id: connection.id, isService: true })
    },

    async connect(connection: IConnection, state) {
      connection = structuredClone(connection)
      const [service] = selectById(state, undefined, connection.id)
      if (connection.autoLaunch && !connection.autoStart) dispatch.ui.set({ autoLaunch: connection.id })
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

      if (connection.public || !browser.hasBackend) {
        dispatch.connections.proxyDisconnect(connection)
        return
      }

      if (connection.connected && !forceStop) {
        connection = { ...connection, disconnecting: true }
        dispatch.connections.updateConnection(connection)
        emit('service/disconnect', connection)
      } else {
        connection = { ...connection, stopping: true, stopLock: Date.now(), error: undefined, enabled: false }
        dispatch.connections.updateConnection(connection)
        emit('service/stop', connection)
      }
      heartbeat.disconnect()
    },

    async survey({ rating, connection }: { rating: number; connection: IConnection }) {
      if (!connection.sessionId) return
      const result = await graphQLSurvey(connection.id, connection.sessionId, rating)
      if (result === 'ERROR' || !result?.data?.data?.rateConnection) {
        dispatch.ui.set({ errorMessage: 'Connection survey submission failed. Please contact support.' })
      }
    },

    async forget(id: string, state) {
      const { set } = dispatch.connections
      const { all } = state.connections
      set({ all: all.filter(c => c.id !== id) })
      if (state.auth.backendAuthenticated) emit('service/forget', { id })
    },

    async clear(id: string, state) {
      const { set } = dispatch.connections
      const { all } = state.connections
      set({ all: all.filter(c => c.id !== id) })
      if (state.auth.backendAuthenticated) emit('service/clear', { id })
    },

    async clearByDevice(deviceId: string, state) {
      const { clear, disconnect } = dispatch.connections
      const { all } = state.connections
      all.forEach(async connection => {
        if (connection.deviceID === deviceId) {
          if (connection.connected) await disconnect({ connection })
          await clear(connection.id)
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
      dispatch.connections.updateConnection({ ...connection, launched: false })
    },

    async setAll(all: IConnection[], state) {
      all.sort((a, b) => nameSort(a.name || '', b.name || ''))
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
  },
})

function nameSort(a: string, b: string) {
  return a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0
}
