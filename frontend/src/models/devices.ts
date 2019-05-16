import fuzzy from 'fuzzy'
import { IDevice, IService } from 'remote.it'
import { createModel } from '@rematch/core'
import * as Service from '../services/Service'
import * as Device from '../services/Device'
import { AuthState } from './auth'
import { SEARCH_ONLY_SERVICE_LIMIT } from '../constants'

interface Connection {
  deviceID: string
  serviceID: string
  port: number
}

interface DeviceState {
  all: IDevice[]
  connections: Connection[]
  fetched: boolean
  fetching: boolean
  searchOnly: boolean
  query: string
}

const state: DeviceState = {
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
        setSearchOnly(count.total > SEARCH_ONLY_SERVICE_LIMIT)
      )
    },
    async fetch() {
      const { fetchStarted, fetchFinished, setDevices } = dispatch.devices
      fetchStarted()
      return Device.all()
        .then(setDevices)
        .finally(fetchFinished)
    },
    async remoteSearch(query: string) {
      const { fetchStarted, fetchFinished, setDevices } = dispatch.devices
      fetchStarted()
      return Device.search(query)
        .then(setDevices)
        .finally(fetchFinished)
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
    async disconnect(service: IService) {
      console.log('disconnect', service)
      const { disconnected } = dispatch.devices
      return Service.disconnect(service).then(() => disconnected(service))
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
      const [serv] = findService(state.all, service)
      serv.connecting = true
      console.log('CONNECT START')
    },
    connected(state: DeviceState, connection: Service.ConnectResponse) {
      const { service, port, pid } = connection

      // Add to connection list
      const existingConnections = state.connections.filter(
        c => c.serviceID === service.id
      ).length
      if (!existingConnections) {
        state.connections.push({
          port,
          serviceID: service.id,
          deviceID: service.deviceID,
        })
      }

      const [serv, device] = findService(state.all, service)
      device.state = 'connected'
      serv.state = 'connected'
      serv.port = port
      serv.pid = pid
      serv.connecting = false
    },
    disconnected(state: DeviceState, service: IService) {
      const [serv, device] = findService(state.all, service)
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

/**
 * Helper to find a service and its device from the device list.
 */
function findService(
  devices: IDevice[],
  service: IService
): [IService, IDevice] {
  const device = devices.find(d => d.id === service.deviceID)
  if (!device)
    throw new Error('Cannot find device with ID: ' + service.deviceID)

  const serv = device.services.find(s => s.id === service.id)
  if (!serv) throw new Error('Cannot find service with ID: ' + service.id)

  return [serv, device]
}
