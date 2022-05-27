import { createModel } from '@rematch/core'
import { newConnection, setConnection } from '../helpers/connectionHelper'
import { graphQLConnect, graphQLDisconnect } from '../services/graphQLMutation'
import { getLocalStorage, setLocalStorage } from '../services/Browser'
import { selectById } from '../models/devices'
import { RootModel } from './rootModel'
import { emit } from '../services/Controller'
import heartbeat from '../services/Heartbeat'

type IConnectionsState = { all: IConnection[] }

const defaultState: IConnectionsState = {
  all: [],
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async init(_, globalState) {
      let item = getLocalStorage(globalState, 'connections')
      if (item) dispatch.connections.setAll(item)
    },

    async updateConnection(connection: IConnection, globalState) {
      const { all } = globalState.connections

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

    async restoreConnections(connections: IConnection[], globalState) {
      connections.forEach(async connection => {
        // data missing from cli if our connections file is lost
        if (!connection.owner || !connection.name) {
          const [service] = selectById(globalState, connection.id)
          if (service) {
            connection = { ...newConnection(service), ...connection }
            setConnection(connection)
          } else {
            console.warn('No service found for connection', connection.id)
            // @TODO fetch device if trying to restore a non-loaded connection
            // const device = await dispatch.devices.fetchSingle({ id: connection.id, hidden: true })
            // console.log('FETCHED DEVICE RETURNED:', device)
          }
        }
      })
      dispatch.connections.setAll(connections)
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
        setConnection(connection)
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

    async connect(connection: IConnection) {
      const { proxyConnect } = dispatch.connections
      if (connection.public) proxyConnect(connection)
      else {
        emit('service/connect', connection)
        heartbeat.caffeinate()
      }
    },

    async disconnect(connection: IConnection | undefined) {
      if (!connection) {
        console.warn('No connection to disconnect')
        return
      }
      const { proxyDisconnect } = dispatch.connections
      if (connection.public) {
        proxyDisconnect(connection)
        return
      }
      if (connection.connected) emit('service/disconnect', connection)
      else if (connection.enabled) emit('service/disable', connection)
      heartbeat.caffeinate()
    },

    async forget(id: string, globalState) {
      const { set } = dispatch.connections
      const { all } = globalState.connections
      if (globalState.auth.backendAuthenticated) emit('service/forget', { id })
      else set({ all: all.filter(c => c.id !== id) })
    },

    async clear(id: string, globalState) {
      const { set } = dispatch.connections
      const { all } = globalState.connections
      if (globalState.auth.backendAuthenticated) emit('service/clear', { id })
      else set({ all: all.filter(c => c.id !== id) })
    },

    async clearByDevice(deviceId: string, globalState) {
      const { clear, disconnect } = dispatch.connections
      const { all } = globalState.connections
      all.forEach(async c => {
        if (c.deviceID === deviceId) {
          if (c.enabled) await disconnect(c)
          await clear(c.id)
        }
      })
    },

    async clearRecent(_, globalState) {
      const { set } = dispatch.connections
      const { all } = globalState.connections
      if (globalState.auth.backendAuthenticated) emit('service/clear-recent')
      else set({ all: all.filter(c => c.enabled && c.online) })
    },

    async setAll(all: IConnection[], globalState) {
      setLocalStorage(globalState, 'connections', all)
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
