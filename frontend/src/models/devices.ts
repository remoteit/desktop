import fuzzy from 'fuzzy'
import { IDevice, IService } from 'remote.it'
import { createModel } from '@rematch/core'
import * as Service from '../services/Service'
import * as Device from '../services/Device'
import { AuthState } from './auth'
import { SEARCH_ONLY_SERVICE_LIMIT } from '../constants'

interface DeviceState {
  all: IDevice[]
  connections: Connection[]
  fetched: boolean
  fetching: boolean
  searchOnly: boolean
  query: string
}

const state: DeviceState = {
  // TODO: Store this as objects with keys based on ID?
  all: [],
  connections: [],
  fetched: false,
  fetching: false,
  searchOnly: false,
  query: '',
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    /**
     * Decide if the user should only search for devices veruses
     * us fetching all of their devices at the getgo.
     */
    async shouldSearchDevices() {
      const { setSearchOnly } = dispatch.devices
      return Device.count().then(count =>
        setSearchOnly(count.services > SEARCH_ONLY_SERVICE_LIMIT)
      )
    },
    async fetch() {
      const {
        getConnections,
        fetchStarted,
        fetchFinished,
        setDevices,
      } = dispatch.devices
      fetchStarted()
      return (
        Device.all()
          .then(setDevices)
          // Get connections again so we can update the incoming found
          // device state against our list of locally connected services.
          // TODO: Probably a cleaner way of doing this...
          .then(getConnections)
          .finally(fetchFinished)
      )
    },
    async remoteSearch(query: string) {
      const {
        getConnections,
        fetchStarted,
        fetchFinished,
        setDevices,
      } = dispatch.devices
      setDevices([])
      fetchStarted()
      return (
        Device.search(query)
          .then(setDevices)
          // Get connections again so we can update the incoming found
          // device state against our list of locally connected services.
          // TODO: Probably a cleaner way of doing this...
          .then(getConnections)
          .finally(fetchFinished)
      )
    },
    async getConnections() {
      const { connected } = dispatch.devices
      return Service.getConnections().then(
        (connections: Service.ConnectResponse[]) => {
          connections.map(conn => connected(conn))
        }
      )
    },
    async connect(service: IService, { auth }: { auth: AuthState }) {
      const { connectStart, connected } = dispatch.devices
      const user = auth.user
      if (!user) throw new Error('User must be authorized to connect!')
      connectStart(service)
      return Service.connect(service, user).then(
        (connection: Service.ConnectResponse) => connected(connection)
      )
    },
    async disconnect(serviceID: string) {
      console.log('disconnect', serviceID)
      const { disconnected } = dispatch.devices
      return Service.disconnect(serviceID).then(() => disconnected(serviceID))
    },
  }),
  reducers: {
    localSearch(state: DeviceState, query: string) {
      state.query = query
    },
    setSearchOnly(state: DeviceState, searchOnly: boolean) {
      state.searchOnly = searchOnly
    },
    fetchStarted(state: DeviceState) {
      state.fetched = false
      state.fetching = true
    },
    setDevices(state: DeviceState, devices: IDevice[]) {
      state.all = devices
    },
    fetchFinished(state: DeviceState) {
      state.fetched = true
      state.fetching = false
    },
    connectStart(state: DeviceState, service: IService) {
      const [serv] = findService(state.all, service.id)
      if (!serv) return

      serv.connecting = true
    },
    connected(state: DeviceState, connection: Service.ConnectResponse) {
      // Add to connection list
      const existingConnections = state.connections.filter(
        c => c.serviceID === connection.serviceID
      ).length
      if (!existingConnections) {
        state.connections.push(connection)
      }

      const [serv, device] = findService(state.all, connection.serviceID)
      if (!device || !serv) {
        console.error('Cannot find device/serivce', {
          serv,
          device,
          connection,
        })
        return
      }

      device.state = 'connected'

      serv.state = 'connected'
      serv.port = connection.port
      serv.pid = connection.pid
      serv.connecting = false
    },
    disconnected(state: DeviceState, serviceID: string) {
      removeConnectionByServiceID(state.connections, serviceID)

      const [serv, device] = findService(state.all, serviceID)
      if (!device || !serv) return
      // If device has only 1 active connection (e.g. the one we are in the
      // process of disconnecting from), clear its connected state as it has
      // no more active services.
      if (device.services.filter(s => s.state === 'connected').length < 2) {
        device.state = 'active'
      }
      serv.state = 'active'
      serv.port = undefined
      serv.pid = undefined
      serv.connecting = false
    },
    // @ts-ignore
    reset(state: DeviceState) {
      state.all = []
      state.connections = []
      state.searchOnly = false
      state.query = ''
    },
  },
  selectors: slice => ({
    visible() {
      return slice(
        (devices: DeviceState): IDevice[] => {
          return filterDevices(devices.all, devices.query)
        }
      )
    },
  }),
})

function removeConnectionByServiceID(connections: Connection[], id: string) {
  connections.splice(connections.findIndex(c => c.serviceID === id), 1)
}

function filterDevices(devices: IDevice[], query: string) {
  const options = {
    extract: (dev: IDevice) => {
      let matchString = dev.name
      if (dev.services && dev.services.length)
        matchString += dev.services.map(s => s.name).join('')
      return matchString
    },
  }
  return fuzzy.filter(query, devices, options).map(d => d.original)
}

function findService(devices: IDevice[], id: string) {
  return devices.reduce(
    (all, d) => {
      const service = d.services.find(s => s.id === id)
      if (service) {
        all[0] = service
        all[1] = d
      }
      return all
    },
    [null, null] as [IService | null, IDevice | null]
  )
}
