import fuzzy from 'fuzzy'
import { IDevice, IService } from 'remote.it'
import { createModel } from '@rematch/core'
import * as Service from '../services/Service'
import * as Device from '../services/Device'
import { AuthState } from './auth'
import { SEARCH_ONLY_SERVICE_LIMIT } from '../constants'

interface DeviceState {
  all: IDevice[]
  connections: ConnectionInfo[]
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
      // const { setSearchOnly } = dispatch.devices
      // return Device.count().then(count =>
      //   setSearchOnly(count.services > SEARCH_ONLY_SERVICE_LIMIT)
      // )
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
    async localSearch(query: string) {
      dispatch.devices.setQuery(query)
    },
    async remoteSearch(query: string) {
      const {
        getConnections,
        fetchStarted,
        fetchFinished,
        setDevices,
        setQuery,
      } = dispatch.devices
      setQuery(query)
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
      return Service.getConnections().then((connections: ConnectionInfo[]) => {
        connections.map(conn => connected(conn))
      })
    },
    async connect(service: IService, { auth }: { auth: AuthState }) {
      const { connectStart, connected } = dispatch.devices
      const user = auth.user
      if (!user) throw new Error('User must be authorized to connect!')
      connectStart(service)
      return Service.connect(service, user).then((connection: ConnectionInfo) =>
        connected(connection)
      )
    },
    async disconnect(serviceID: string) {
      const { disconnected } = dispatch.devices
      return Service.disconnect(serviceID).then(() => disconnected(serviceID))
    },
    async restart(serviceID: string) {
      return Service.restart(serviceID).then(connection =>
        dispatch.devices.connected(connection)
      )
    },
    async forget(serviceID: string) {
      return Service.forget(serviceID).then(() =>
        dispatch.devices.remove(serviceID)
      )
    },
  }),
  reducers: {
    setQuery(state: DeviceState, query: string) {
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
    connected(state: DeviceState, connection: ConnectionInfo) {
      // Add to connection list
      let existingConnection = state.connections.find(
        c => c.serviceID === connection.serviceID
      )

      existingConnection
        ? (state.connections[
            state.connections.indexOf(existingConnection)
          ] = connection)
        : state.connections.push(connection)

      const [serv, device] = findService(state.all, connection.serviceID)

      if (device) device.state = 'connected'

      if (serv) {
        serv.state = 'connected'
        serv.port = connection.port
        serv.pid = connection.pid
        serv.connecting = false
      }
    },
    disconnected(state: DeviceState, serviceID: string) {
      const conn = state.connections.find(c => c.serviceID === serviceID)
      if (!conn) return

      conn.pid = undefined

      const [serv, device] = findService(state.all, serviceID)
      if (!device || !serv) return
      // If device has only 1 active connection (e.g. the one we are in the
      // process of disconnecting from), clear its connected state as it has
      // no more active services.
      if (device.services.filter(s => s.state === 'connected').length < 2) {
        device.state = 'active'
      }
      serv.state = 'active'
      // serv.port = undefined
      serv.pid = undefined
      serv.connecting = false
    },
    reset(state: DeviceState) {
      state.all = []
      state.connections = []
      state.searchOnly = false
      state.query = ''
    },
    remove(state: DeviceState, serviceID: string) {
      const conn = state.connections.find(c => c.serviceID === serviceID)
      const [serv] = findService(state.all, serviceID)

      if (conn) {
        state.connections.splice(state.connections.indexOf(conn), 1)
      }

      if (serv) {
        serv.state = 'active'
        serv.port = undefined
        serv.pid = undefined
        serv.connecting = false
      }

      // TODO: decide if device should be connected
      // if (device) device.state = 'connected'
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
