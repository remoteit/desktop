import fuzzy from 'fuzzy'
import { IDevice, IService } from 'remote.it'
import { createModel } from '@rematch/core'
import Device from '../services/Device'
import { renameServices } from '../helpers/serviceNameHelper'
import BackendAdapter from '../services/BackendAdapter'
import { r3 } from '../services/remote.it'

// Slightly below the API limit for search of 300 services.
const SEARCH_ONLY_SERVICE_LIMIT = 300

const SORT_SETTING_KEY = 'sort'
const SEARCH_ONLY_SETTING_KEY = 'search-only'

interface DeviceState {
  all: IDevice[]
  searchPerformed: boolean
  fetched: boolean
  fetching: boolean
  searchOnly: boolean
  searching: boolean
  query: string
  sort: SortType
}

const state: DeviceState = {
  // TODO: Store this as objects with keys based on ID?
  all: [],
  searchPerformed: false,
  fetched: false,
  fetching: false,
  searching: false,
  searchOnly: false,
  query: '',
  sort: (window.localStorage.getItem(SORT_SETTING_KEY) || 'state') as SortType,
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    /**
     * Decide if the user should only search for devices veruses
     * us fetching all of their devices at the getgo.
     */
    async shouldSearchDevices() {
      // First see if they have already decided on their preference
      const pref = window.localStorage.getItem(SEARCH_ONLY_SETTING_KEY)
      if (typeof pref === 'string') {
        dispatch.devices.setSearchOnly(pref === 'true')
        dispatch.devices.fetch()
        return
      }

      // If they have too many services, show search only.
      return r3.devices
        .count()
        .then(count => dispatch.devices.setSearchOnly(count.services > SEARCH_ONLY_SERVICE_LIMIT))
    },
    async fetch() {
      // TODO: Deal with device search only UI
      const { getConnections, fetchStarted, fetchFinished, setDevices } = dispatch.devices
      fetchStarted()
      return r3.devices
        .all()
        .then(renameServices)
        .then(setDevices)
        .catch(error => {
          console.error('Fetch error:', error, error.response)
          if (error && error.response && (error.response.status === 401 || error.response.status === 403)) {
            setDevices([])
            dispatch.auth.signedOut()
          }
        })
        .finally(fetchFinished)
    },
    async localSearch(_, globalState: any) {
      const query = globalState.devices.query
      dispatch.devices.setQuery(query)
    },
    async remoteSearch(_, globalState: any) {
      const query = globalState.devices.query
      dispatch.devices.setDevices([])
      dispatch.devices.setSearching(true)
      dispatch.devices.setSearchPerformed(true)
      return r3.devices
        .search(query)
        .then(devices => {
          dispatch.devices.setDevices(devices)
          dispatch.devices.setSearchPerformed(true)
        })
        .finally(() => dispatch.devices.setSearching(false))
    },
    // async getConnections() {
    //   BackendAdapter.emit('connections/list', (connections: IConnection[]) => {
    //     connections.map(conn => dispatch.devices.connected(conn))
    //   })
    //   const devices = localStorage.getItem('devices')
    //   if (devices && devices.length) dispatch.devices.setDevices(JSON.parse(devices))
    // },
    // async connect(service: IService) {
    //   dispatch.devices.connectStart(service.id)
    //   BackendAdapter.emit('service/connect', service)
    // },
    // async disconnect(id: string) {
    //   BackendAdapter.emit('service/disconnect', id)
    // },
    // async restart(id: string) {
    //   dispatch.devices.connectStart(id)
    //   BackendAdapter.emit('service/restart', id)
    // },
    // async forget(id: string) {
    //   BackendAdapter.emit('service/forget', id)
    // },
    // async forgotten(id: string) {
    //   dispatch.devices.remove(id)
    // },
    async toggleSearchOnly(_, state) {
      const searchOnly = !state.devices.searchOnly

      dispatch.devices.setSearchOnly(searchOnly)
      dispatch.devices.setQuery('')
      if (searchOnly) {
        dispatch.devices.setDevices([])
      } else {
        dispatch.devices.setDevices([])
        dispatch.devices.fetch()
      }
    },
    async reset() {
      dispatch.devices.setDevices([])
      dispatch.jump.setConnections([])
      dispatch.devices.setSearchOnly(false)
      dispatch.devices.setQuery('')
      dispatch.devices.changeSort('state')
    },
  }),
  reducers: {
    setQuery(state: DeviceState, query: string) {
      state.query = query
      if (state.searchOnly) {
        state.all = []
        state.searchPerformed = false
      }
    },
    setSearchOnly(state: DeviceState, searchOnly: boolean) {
      state.searchOnly = searchOnly
      window.localStorage.setItem(SEARCH_ONLY_SETTING_KEY, String(searchOnly))
    },
    fetchStarted(state: DeviceState) {
      state.fetched = false
      state.fetching = true
    },
    changeSort(state: DeviceState, sort: SortType) {
      state.sort = sort
      state.all = Device.sort(state.all, sort)
      window.localStorage.setItem(SORT_SETTING_KEY, sort)
    },
    setDevices(state: DeviceState, devices: IDevice[]) {
      localStorage.setItem('devices', JSON.stringify(devices))
      state.all = Device.sort(devices, state.sort)
    },
    fetchFinished(state: DeviceState) {
      state.fetched = true
      state.fetching = false
    },
    // connectStart(state: DeviceState, id: string) {
    //   const [service] = findService(state.all, id)
    //   if (!service) return

    //   let conn = state.connections.find(c => c.id === id)
    //   if (conn) {
    //     conn.error = undefined
    //     conn.connecting = true
    //   }

    //   service.connecting = true
    // },
    // clearConnectionError(state: DeviceState, id: string) {
    //   const conn = state.connections.find(c => c.id === id)
    //   if (conn) conn.error = undefined
    // },
    // connectionError(state: DeviceState, msg: ConnectionErrorMessage) {
    //   const conn = state.connections.find(c => c.id === msg.connection.id)
    //   if (conn)
    //     conn.error = {
    //       code: msg.code,
    //       message: msg.error,
    //     }
    // },
    // connected(state: DeviceState, connection: IConnection) {
    //   console.log('CONNECTED', connection)
    //   let existingConnection = state.connections.find(c => c.id === connection.id)

    //   // FIXME - seems like this should be set server side
    //   connection.connecting = false
    //   connection.error = undefined

    //   existingConnection
    //     ? (state.connections[state.connections.indexOf(existingConnection)] = connection)
    //     : state.connections.push(connection)

    //   const [service, device] = findService(state.all, connection.id)

    //   // FIXME - remove connection state info from service model and stop overloading state
    //   if (service) {
    //     service.state = connection.pid ? 'connected' : 'active'
    //     service.port = connection.port
    //     service.pid = connection.pid
    //     service.connecting = false

    //     if (device && service.pid) device.state = 'connected'
    //   }
    // },
    // setConnections(state: DeviceState, connections: IConnection[]) {
    //   state.connections = connections
    // },
    // setConnection(state: DeviceState, connection: IConnection) {
    //   for (let i = state.connections.length; --i; ) {
    //     if (state.connections[i].id === connection.id) {
    //       state.connections[i] = connection
    //       break
    //     }
    //   }
    //   // state.connections = [ ...state.connections, connection ]
    // },
    // disconnected(state: DeviceState, msg: ConnectionMessage) {
    //   console.log('DISCONNECTED', msg)

    //   const id = msg.connection.id
    //   const conn = state.connections.find(c => c.id === id)
    //   if (conn) {
    //     conn.connecting = false
    //     conn.pid = undefined
    //   }

    //   const [service, device] = findService(state.all, id)
    //   if (device) {
    //     // If device has only 1 active connection (e.g. the one we are in the
    //     // process of disconnecting from), clear its connected state as it has
    //     // no more active services.
    //     if (device.services.filter(s => s.state === 'connected').length < 1) {
    //       device.state = 'active'
    //     }
    //   }

    //   // FIXME - remove connection state info from service model and stop overloading state
    //   if (service) {
    //     service.state = 'active'
    //     service.pid = undefined
    //     service.connecting = false
    //   }
    // },
    // remove(state: DeviceState, id: string) {
    //   const conn = state.connections.find(c => c.id === id)
    //   const [service] = findService(state.all, id)

    //   if (conn) {
    //     state.connections.splice(state.connections.indexOf(conn), 1)
    //   }

    //   // FIXME - remove connection state info from service model and stop overloading state
    //   if (service) {
    //     service.state = 'active'
    //     service.port = undefined
    //     service.pid = undefined
    //     service.connecting = false
    //   }

    //   // TODO: decide if device should be connected
    //   // if (device) device.state = 'connected'
    // },
    setSearching(state: DeviceState, searching: boolean) {
      state.searching = searching
    },
    setSearchPerformed(state: DeviceState, searchPerformed: boolean) {
      state.searchPerformed = searchPerformed
    },
  },
  selectors: slice => ({
    visible() {
      return slice((state: DeviceState): IDevice[] => {
        const filtered = filterDevices(state.all, state.query)
        const sorted = Device.sort(filtered, state.sort)
        // console.log('FILTERED:', filtered)
        // console.log('SORTED:', state.sort, sorted)
        return sorted
      })
    },
  }),
})

function filterDevices(devices: IDevice[], query: string) {
  const options = {
    extract: (dev: IDevice) => {
      let matchString = dev.name
      if (dev.services && dev.services.length) matchString += dev.services.map(s => s.name).join('')
      return matchString
    },
  }
  return fuzzy.filter(query, devices, options).map(d => d.original)
}

export function findService(devices: IDevice[], id: string) {
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
