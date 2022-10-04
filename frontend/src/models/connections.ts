import { parse as urlParse } from 'url'
import { createModel } from '@rematch/core'
import {
  cleanOrphanConnections,
  getConnectionDeviceIds,
  newConnection,
  sanitizeName,
  selectConnection,
  setConnection,
  updateConnections,
} from '../helpers/connectionHelper'
import { getLocalStorage, setLocalStorage, isPortal } from '../services/Browser'
import {
  graphQLConnect,
  graphQLDisconnect,
  graphQLSurvey,
  graphQLSetConnectLink,
  graphQLRemoveConnectLink,
} from '../services/graphQLMutation'
import { selectNetwork } from './networks'
import { selectById } from '../models/devices'
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
}

const defaultState: IConnectionsState = {
  all: [],
  queue: [],
  queueCount: 0,
  queueEnabling: false,
  queueFinished: false,
  queueConnection: undefined,
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async init(_: void, state) {
      let item = getLocalStorage(state, 'connections')
      if (item) dispatch.connections.setAll(item)
    },

    async fetch(_: void, state) {
      const accountId = state.auth.user?.id || state.user.id
      const deviceIds = getConnectionDeviceIds(state)
      const connections = await dispatch.devices.fetchArray({ deviceIds, accountId })
      updateConnections(state, connections, accountId)
      await dispatch.accounts.setDevices({ devices: connections, accountId: 'connections' })
      cleanOrphanConnections(deviceIds)
    },

    async mergeConnectionParams(params: IConnection, state) {
      const { all } = state.connections
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

    async restoreConnections(connections: IConnection[], state) {
      connections.forEach((connection, index) => {
        // disable connection if service is offline
        if (!connection.online && connection.enabled) {
          dispatch.connections.disconnect(connection)
        }

        // update device if new connection error
        if (
          connection.error &&
          connection.deviceID &&
          !state.connections.all.find(c => c.id === connection.id)?.error
        ) {
          dispatch.devices.fetchSingle({ id: connection.deviceID, hidden: true })
        }

        // data missing from cli if our connections file is lost
        if (!connection.owner || !connection.name) {
          const [service] = selectById(state, connection.id)
          if (!connection.id) {
            delete connections[index]
            console.warn('No id found in connection', { connection })
          } else if (service) {
            connection = { ...newConnection(service), ...connection }
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

      const [service] = selectById(state, trigger.id)
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
        enabled: true,
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
          publicId: data.id,
          connecting: false,
          connected: true,
          error: undefined,
          isP2P: false,
          startTime: data.created,
          sessionId: data.session?.id,
          reverseProxy: data.reverseProxy,
          timeout: data.timeout / 60,
          port: data.port,
          host: data.host,
        })
      }
    },

    async proxyDisconnect(connection: IConnection) {
      let disconnect = { ...connection, enabled: false }
      setConnection(disconnect)

      if (!connection.publicId) {
        console.warn('No publicId for connection to proxy disconnect', connection)
        return
      }

      const result = await graphQLDisconnect(connection.id, connection.publicId)

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

    async disableConnectLink(connection?: IConnection) {
      if (!connection) {
        console.warn('No connection to disconnect')
        return
      }
      const disconnecting: IConnection = { ...connection, enabled: false, public: false || isPortal() }

      dispatch.connections.updateConnection(disconnecting)

      const result = await graphQLRemoveConnectLink(connection.id)

      if (result === 'ERROR') {
        dispatch.ui.set({ errorMessage: 'Persistent connection closing failed. Please contact support.' })
        connection.error = { message: 'An error occurred removing your connection.' }
        dispatch.connections.updateConnection(connection)
        if (connection.deviceID) dispatch.devices.fetchSingle({ id: connection.deviceID })
        return
      }

      setConnection({
        ...disconnecting,
        connected: false,
        reverseProxy: false,
      })
    },

    async enableConnectLink(connection: IConnection) {
      const connecting: IConnection = { ...connection, starting: true }
      dispatch.connections.updateConnection(connecting)

      const result = await graphQLSetConnectLink(connection.id)

      if (result === 'ERROR' || !result?.data?.data?.enableConnectLink?.url) {
        dispatch.ui.set({ errorMessage: 'Persistent connection generation failed. Please contact support.' })
        connection.error = { message: 'An error occurred connecting. Please ensure that the device is online.' }
        dispatch.connections.updateConnection(connection)
        if (connection.deviceID) dispatch.devices.fetchSingle({ id: connection.deviceID })
        return
      }

      const url = urlParse(result?.data?.data?.enableConnectLink?.url)
      setConnection({
        ...connecting,
        starting: false,
        enabled: true,
        error: undefined,
        isP2P: false,
        reverseProxy: true,
        port: url.port ? parseInt(url.port, 10) : undefined,
        host: url.hostname || undefined,
      })
    },

    async connect(connection: IConnection) {
      if (connection.autoLaunch && !connection.autoStart) dispatch.ui.set({ autoLaunch: true })
      connection.name = sanitizeName(connection?.name || '')
      connection.host = ''
      connection.reverseProxy = undefined
      connection.autoStart = undefined
      connection.public = connection.public || isPortal()
      connection.starting = !connection.public

      if (connection.connectLink) {
        dispatch.connections.enableConnectLink(connection)
        return
      }

      if (connection.public) {
        dispatch.connections.proxyConnect(connection)
        return
      }

      emit('service/connect', connection)
      heartbeat.caffeinate()
    },

    async disconnect(connection: IConnection | undefined) {
      if (!connection) {
        console.warn('No connection to disconnect')
        return
      }

      if (connection.connectLink) {
        dispatch.connections.disableConnectLink(connection)
        return
      }

      if (connection.public) {
        dispatch.connections.proxyDisconnect(connection)
        return
      }

      if (connection.connected) emit('service/disconnect', connection)
      else emit('service/disable', connection)
      heartbeat.caffeinate()
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
