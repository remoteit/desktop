import { r3 } from '../services/remote.it'
import { IDevice, IService, IUser } from 'remote.it'
import { createModel } from '@rematch/core'
import * as Service from '../services/service'
import { ApplicationState } from '../store'
import { AuthState } from './auth'

interface DeviceState {
  all: IDevice[]
  fetched: boolean
  fetching: boolean
}

const state: DeviceState = {
  all: [],
  fetched: false,
  fetching: false,
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async fetch() {
      const { fetchStarted, fetchFinished, setDevices } = dispatch.devices
      fetchStarted()
      return r3.devices
        .all()
        .then(devices => setDevices(devices))
        .finally(() => fetchFinished())
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
    },
    connected(state: DeviceState, connection: Service.ConnectResponse) {
      const [serv, device] = findService(state.all, connection.service)
      device.state = 'connected'
      serv.state = 'connected'
      serv.port = connection.port
      serv.pid = connection.pid
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
})

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
