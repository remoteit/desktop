import fuzzy from 'fuzzy'
import cookie from 'js-cookie'
import { IDevice, IService } from 'remote.it'
import { createModel } from '@rematch/core'
import Device from '../services/Device'
import BackendAdapter from '../services/BackendAdapter'
import { r3 } from '../services/remote.it'
// import { SEARCH_ONLY_SERVICE_LIMIT } from '../constants'

const SORT_COOKIE_NAME = 'sort'

interface DeviceState {
  all: IDevice[]
  connections: ConnectionInfo[]
  fetched: boolean
  fetching: boolean
  searchOnly: boolean
  query: string
  sort: SortType
}

const state: DeviceState = {
  // TODO: Store this as objects with keys based on ID?
  all: [],
  connections: [],
  fetched: false,
  fetching: false,
  searchOnly: false,
  query: '',
  sort: (cookie.get(SORT_COOKIE_NAME) || 'alpha') as SortType,
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
      // return r3.devices.count().then(count =>
      //   setSearchOnly(count.services > SEARCH_ONLY_SERVICE_LIMIT)
      // )
    },
    async fetch() {
      // TODO: Deal with device search only UI
      const {
        getConnections,
        fetchStarted,
        fetchFinished,
        setDevices,
      } = dispatch.devices
      fetchStarted()
      return (
        r3.devices
          .all()
          .then(setDevices)
          // Get connections again so we can update the incoming found
          // device state against our list of locally connected services.
          // TODO: Probably a cleaner way of doing this...
          .then(() => getConnections())
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
        r3.devices
          .search(query)
          .then(setDevices)
          // Get connections again so we can update the incoming found
          // device state against our list of locally connected services.
          // TODO: Probably a cleaner way of doing this...
          .then(getConnections)
          .finally(fetchFinished)
      )
    },
    async getConnections() {
      BackendAdapter.emit(
        'connections/list',
        (connections: ConnectionInfo[]) => {
          console.log('CONNECTIONS:', connections)
          connections.map(conn => dispatch.devices.connected(conn))
        }
      )
    },
    async connect(service: IService) {
      dispatch.devices.connectStart(service.id)
      BackendAdapter.emit('service/connect', service)
    },
    async disconnect(id: string) {
      BackendAdapter.emit('service/disconnect', id)
    },
    async restart(id: string) {
      dispatch.devices.connectStart(id)
      BackendAdapter.emit('service/restart', id)
    },
    async forget(id: string) {
      BackendAdapter.emit('service/forget', id)
    },
    async forgotten(id: string) {
      dispatch.devices.remove(id)
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
    changeSort(state: DeviceState, sort: SortType) {
      state.sort = sort
      state.all = Device.sort(state.all, sort)
      cookie.set(SORT_COOKIE_NAME, sort)
    },
    setDevices(state: DeviceState, devices: IDevice[]) {
      state.all = Device.sort(devices, state.sort)
    },
    fetchFinished(state: DeviceState) {
      state.fetched = true
      state.fetching = false
    },
    connectStart(state: DeviceState, id: string) {
      const [service] = findService(state.all, id)
      if (!service) return

      let conn = state.connections.find(c => c.id === id)
      if (conn) {
        conn.error = undefined
        conn.connecting = true
      }

      service.connecting = true
    },
    clearConnectionError(state: DeviceState, id: string) {
      const conn = state.connections.find(c => c.id === id)
      if (conn) conn.error = undefined
    },
    connectionError(state: DeviceState, msg: ConnectionErrorMessage) {
      const conn = state.connections.find(c => c.id === msg.connection.id)
      if (conn)
        conn.error = {
          code: msg.code,
          message: msg.error,
        }
    },
    connected(state: DeviceState, connection: ConnectionInfo) {
      let existingConnection = state.connections.find(
        c => c.id === connection.id
      )

      connection.connecting = false
      connection.error = undefined

      existingConnection
        ? (state.connections[
            state.connections.indexOf(existingConnection)
          ] = connection)
        : state.connections.push(connection)

      const [serv, device] = findService(state.all, connection.id)

      if (device) device.state = 'connected'

      if (serv) {
        serv.state = 'connected'
        serv.port = connection.port
        serv.pid = connection.pid
        serv.connecting = false
      }
    },
    disconnected(state: DeviceState, msg: ConnectdMessage) {
      const id = msg.connection.id
      const conn = state.connections.find(c => c.id === id)
      if (conn) {
        conn.connecting = false
        conn.pid = undefined
      }

      const [service, device] = findService(state.all, id)
      if (device) {
        // If device has only 1 active connection (e.g. the one we are in the
        // process of disconnecting from), clear its connected state as it has
        // no more active services.
        if (device.services.filter(s => s.state === 'connected').length < 2) {
          device.state = 'active'
        }
      }

      if (service) {
        // serv.state = 'disconnected'
        service.pid = undefined
        service.connecting = false
      }
    },
    reset(state: DeviceState) {
      state.all = []
      state.connections = []
      state.searchOnly = false
      state.query = ''
    },
    remove(state: DeviceState, id: string) {
      const conn = state.connections.find(c => c.id === id)
      const [serv] = findService(state.all, id)

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
        (state: DeviceState): IDevice[] => {
          const filtered = filterDevices(state.all, state.query)
          const sorted = Device.sort(filtered, state.sort)
          console.log('FILTERED:', filtered)
          console.log('SORTED:', state.sort, sorted)
          return sorted
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
