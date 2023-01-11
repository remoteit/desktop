import { parse as urlParse } from 'url'
import { createModel } from '@rematch/core'
import { pickTruthy, dedupe } from '../helpers/utilHelper'
import { DEFAULT_CONNECTION } from '../shared/constants'
import {
  cleanOrphanConnections,
  getConnectionServiceIds,
  newConnection,
  setConnection,
  getConnectionLookup,
} from '../helpers/connectionHelper'
import { getLocalStorage, setLocalStorage, isPortal } from '../services/Browser'
import {
  graphQLConnect,
  graphQLDisconnect,
  graphQLSurvey,
  graphQLSetConnectLink,
  graphQLRemoveConnectLink,
} from '../services/graphQLMutation'
import { graphQLFetchConnections, graphQLDeviceAdaptor } from '../services/graphQLDevice'
import { graphQLGetErrors } from '../services/graphQL'
import { selectConnection } from '../selectors/connections'
import { selectNetwork } from './networks'
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
}

const defaultState: IConnectionsState = {
  all: [],
  queue: [],
  queueCount: 0,
  queueEnabling: false,
  queueFinished: false,
  queueConnection: undefined,
  initialized: false,
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async init(_: void, state) {
      let item = getLocalStorage(state, 'connections')
      if (item) await dispatch.connections.setAll(dedupe<IConnection>(item, 'id'))
      console.log('INIT CONNECTIONS', item)
    },

    async fetch(_: void, state) {
      const accountId = state.auth.user?.id || state.user.id
      const serviceIds = getConnectionServiceIds(state)
      const gqlResponse = await graphQLFetchConnections({ ids: serviceIds })
      if (graphQLGetErrors(gqlResponse)) return

      const gqlDevices = gqlResponse?.data?.data?.login?.device || []
      const devices = graphQLDeviceAdaptor({ gqlDevices, accountId, hidden: true })
      await dispatch.accounts.mergeDevices({ devices, accountId: 'connections' })

      cleanOrphanConnections(serviceIds)
    },

    async parseConnectionsLinks({ devices, accountId }: { devices: IDevice[]; accountId: string }) {
      await dispatch.connections.updateConnectionState({ devices, accountId })
      await dispatch.connections.updateCLI()
      await dispatch.connections.set({ initialized: true })
    },

    async updateConnectionState({ devices, accountId }: { devices: IDevice[]; accountId: string }, state) {
      let lookup = getConnectionLookup(state)
      let result: IConnection[] = []

      devices.forEach(d => {
        d.services.forEach(async s => {
          let connection = lookup[s.id]
          const online = s.state === 'active'

          // add / update enabled connect links
          if (s.link?.enabled) {
            connection = connection || newConnection(s)

            connection = {
              ...connection,
              id: s.id,
              deviceID: d.id,
              name: connection.name || s.subdomain,
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
            if (!connection.accountId) {
              const membership = state.accounts.membership.find(m => m.account.id === d.owner.id)
              connection.accountId = membership ? membership.account.id : accountId
            }

            // disable connection if service is offline
            if (!online && connection.enabled) {
              console.log('DISABLING OFFLINE CONNECTION', connection.name)
              await dispatch.connections.disconnect(connection)
            }

            // remove connect links
            if (!s.link && connection.connectLink) {
              console.log('UNLINK CONNECT LINK', s.id)
              connection.connectLink = DEFAULT_CONNECTION.connectLink
              connection.enabled = DEFAULT_CONNECTION.enabled
            }

            connection.online = online
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
      const { all } = state.connections

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
          } else {
            console.warn(`No service found for connection ${connection.id}`, { connection })
            // @TODO fetch device if trying to restore a non-loaded connection
            // const device = await dispatch.devices.fetchSingle({ id: connection.id, hidden: true })
            // console.log('FETCHED DEVICE RETURNED:', device)
          }
        }
      })
      dispatch.connections.setAll(connections)
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
        else dispatch.connections.disconnect({ ...connection, ...trigger })
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
        if (connection.deviceID) dispatch.devices.fetchSingle({ id: connection.deviceID })
      } else {
        const data = result?.data?.data?.connect
        console.log('PROXY CONNECTED', data)
        setConnection({
          ...proxyConnection,
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

    async enable({ connection, networkId }: { connection: IConnection; networkId: string }, state) {
      const network = selectNetwork(state, networkId)
      if (network.enabled && !connection.enabled) {
        dispatch.connections.queueEnable({ serviceIds: [connection.id], enabled: true })
      }
    },

    async setConnectLink(connection: IConnection) {
      const creating: IConnection = { ...connection, connectLink: connection.enabled }

      dispatch.connections.updateConnection(creating)
      const result = await graphQLSetConnectLink({
        serviceId: connection.id,
        enabled: connection.enabled,
        password: connection.password?.trim(),
      })

      if (result === 'ERROR' || !result?.data?.data?.setConnectLink?.url) {
        connection.error = { message: 'Persistent connection update failed. Please contact support.' }
        dispatch.connections.updateConnection(connection)
        if (connection.deviceID) dispatch.devices.fetchSingle({ id: connection.deviceID })
        return
      }

      const data = result?.data?.data?.setConnectLink
      const url = urlParse(data?.url)

      setConnection({
        ...creating,
        password: data?.password,
        enabled: !!data?.enabled,
        createdTime: new Date(data.created).getTime(),
        port: url.port ? parseInt(url.port, 10) : undefined,
        host: url.hostname || undefined,
        error: undefined,
        starting: false,
        isP2P: false,
      })
    },

    async removeConnectLink(connection?: IConnection) {
      if (!connection) return console.warn('No connection to disconnect')

      dispatch.connections.setConnectLink({ ...connection, enabled: false })
      dispatch.devices.updateService({ id: connection.id, set: { link: undefined } })
      const result = await graphQLRemoveConnectLink(connection.id)

      if (result === 'ERROR') {
        connection.error = { message: 'An error occurred removing your persistent connection. Please contact support.' }
        await dispatch.connections.updateConnection(connection)
      }

      await dispatch.devices.fetchSingle({ id: connection.id, isService: true })
    },

    async connect(connection: IConnection, state) {
      const [service] = selectById(state, undefined, connection.id)
      if (connection.autoLaunch && !connection.autoStart) dispatch.ui.set({ autoLaunch: true })
      connection.online = service ? service?.state === 'active' : connection.online
      connection.host = ''
      connection.error = undefined
      connection.autoStart = undefined
      connection.checkpoint = undefined
      connection.stopLock = undefined
      connection.port = connection.port || state.backend.freePort
      connection.enabled = true

      if (connection.public || isPortal()) {
        dispatch.connections.proxyConnect(connection)
        return
      }

      connection = { ...connection, starting: true }
      dispatch.connections.updateConnection(connection)
      emit('service/connect', connection)
      heartbeat.connect()
    },

    async disconnect(connection: IConnection | undefined) {
      if (!connection) {
        console.warn('No connection to disconnect')
        return
      }

      if (connection.public || isPortal()) {
        dispatch.connections.proxyDisconnect(connection)
        return
      }

      if (connection.connected) {
        connection = { ...connection, disconnecting: true }
        dispatch.connections.updateConnection(connection)
        emit('service/disconnect', connection)
      } else {
        connection = { ...connection, stopping: true, stopLock: Date.now(), enabled: false }
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
      if (state.auth.backendAuthenticated) emit('service/forget', { id })
      else set({ all: all.filter(c => c.id !== id) })
    },

    async clear(id: string, state) {
      const { set } = dispatch.connections
      const { all } = state.connections
      if (state.auth.backendAuthenticated) emit('service/clear', { id })
      else set({ all: all.filter(c => c.id !== id) })
    },

    async clearByDevice(deviceId: string, state) {
      const { clear, disconnect } = dispatch.connections
      const { all } = state.connections
      all.forEach(async c => {
        if (c.deviceID === deviceId) {
          if (c.connected) await disconnect(c)
          await clear(c.id)
        }
      })
    },

    async clearRecent(_: void, state) {
      const { set } = dispatch.connections
      const { all } = state.connections
      if (state.auth.backendAuthenticated) emit('service/clear-recent')
      else set({ all: all.filter(c => c.enabled && c.online) })
    },

    async setAll(all: IConnection[], state) {
      all.sort((a, b) => nameSort(a.name || '', b.name || ''))
      setLocalStorage(state, 'connections', all)
      dispatch.connections.set({ all: [...all] }) // to ensure we trigger update
    },
  }),
  reducers: {
    reset(state: IConnectionsState) {
      state = { ...defaultState }
      return state
    },
    set(state: IConnectionsState, params: ILookup<any>) {
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
