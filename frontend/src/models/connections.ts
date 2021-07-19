import { createModel } from '@rematch/core'
import { DEVELOPER_KEY } from '../shared/constants'
import { newConnection, setConnection } from '../helpers/connectionHelper'
import { r3, getToken } from '../services/remote.it'
import { selectById } from '../models/devices'
import { RootModel } from './rootModel'
import { getRestApi } from '../helpers/apiHelper'
import axios from 'axios'

type IConnectionsState = { all: IConnection[] }

const defaultState: IConnectionsState = {
  all: [],
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: dispatch => ({
    async updateConnection(connection: IConnection, globalState) {
      const { all } = globalState.connections
      all.some((c, index) => {
        if (c.id === connection.id) {
          all[index] = connection
          dispatch.connections.set({ all })
          if (connection) return true
        }
        return false
      })
    },

    async restoreConnections(connections: IConnection[], globalState) {
      connections.forEach(async connection => {
        // data missing from cli if our connections file is lost
        if (!connection.owner) {
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
      dispatch.connections.set({ all: connections })
    },

    async headerOptions() {
      const token = await getToken()
      return {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          developerKey: DEVELOPER_KEY,
          authorization: token,
        },
      }
    },

    async proxyConnect(connection: IConnection): Promise<any> {
      const data = { wait: 'true', hostip: connection.publicRestriction, deviceaddress: connection.id }

      let proxyConnection = {
        ...connection,
        createdTime: Date.now(),
        startTime: Date.now(),
        connecting: true,
        enabled: true,
      }

      setConnection(proxyConnection)

      try {
        let result = await axios.post(
          `${getRestApi()}/device/connect`,
          data,
          await dispatch.connections.headerOptions()
        )
        const response = r3.processData(result)
        const proxyResult: ProxyConnectionResult = response.connection || {}
        console.log('PROXY CONNECTED', proxyResult)

        setConnection({
          ...proxyConnection,
          publicId: proxyResult.connectionid,
          connecting: false,
          connected: true,
          error: undefined,
          isP2P: false,
          startTime: Date.now(),
          sessionId: proxyResult.sessionID?.toLowerCase(),
          address: proxyResult.proxy,
          timeout: proxyResult.proxyExpirationSec / 60,
          // port: +proxyResult.proxyport,
          // host: proxyResult.proxyURL,
        })
      } catch (error) {
        r3.processError(error)
      }
    },

    async proxyDisconnect(connection: IConnection) {
      setConnection({ ...connection, enabled: false })
      console.log('PROXY DISCONNECT', connection)
      const data = { deviceaddress: connection.id, connectionid: connection.publicId }
      try {
        let result = await axios.post(
          `${getRestApi()}/device/connect/stop`,
          data,
          await dispatch.connections.headerOptions()
        )
        const proxyResult = r3.processData(result)
        console.log('PROXY DISCONNECTED', proxyResult)
      } catch (error) {
        r3.processError(error)
      }
    },
  }),
  reducers: {
    reset(state: IConnectionsState) {
      state = defaultState
      return state
    },
    set(state: IConnectionsState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

interface ProxyConnectionResult {
  clientID: string // "Mjc5REIzQUQtMTQyRC00NTcxLTlGRDktMTVGNzVGNDYxQkE3"
  connectionid: string // "3c031b52-7cea-46de-b56b-a1cece5adad6"
  deviceaddress: string // "80:00:00:00:01:0B:52:E5"
  expirationsec: string // "28800"
  filteredIP: string // "none"
  idleLeft: number //  900
  initiator: string // "jamie@remote.it"
  initiatorUID: string // "f0:63:c5:03:f9:52:42:c6"
  latchedIP: string // "0.0.0.0"
  lifeLeft: number // 86400
  p2pConnected: true
  peerEP: string // "18.144.28.173:15029"
  peerReqEP: string // "18.144.28.173:15029"
  proxy: string // "https://b2e3fsxn5q6.p19.rt3.io"
  proxyExpirationSec: number // 28800
  proxyServerPort: number // 24292
  proxyURL: string // "b2e3fsxn5q6.p19.rt3.io"
  proxyport: string // "24292"
  proxyserver: string // "proxy19.rt3.io"
  requested: string // "4/17/2021T7:49 PM"
  requestedAt: string // "2021-04-17T23:49:00+00:00"
  reverseProxy: boolean // true
  serviceConnected: boolean // true
  sessionID: string // "8AE6503C29282CDFD4717CABF91A7169F353C39E"
  status: string // "running"
  targetUID: string // "80:00:00:00:01:0B:52:E5"
}
