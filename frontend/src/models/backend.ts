import { getDevices } from './accounts'
import { createModel } from '@rematch/core'
import { findService } from '../models/devices'
import { DEFAULT_TARGET } from '../shared/constants'
import { Dispatch, ApplicationState } from '../store'
import { emit } from '../services/Controller'
import sleep from '../services/sleep'
import analyticsHelper from '../helpers/analyticsHelper'

type IBackendState = ILookup<any> & {
  connections: IConnection[]
  device: ITargetDevice
  targets: ITarget[]
  scanData: IScanData
  interfaces: IInterface[]
  lan: {
    oobAvailable: boolean
    oobActive: boolean
  }
  error: boolean
  freePort?: number
  update?: string
  globalError?: string
  dataReady: boolean
  environment: {
    os?: Ios
    osVersion?: string
    arch?: string
    manufacturerDetails?: ManufacturerDetails
    adminUsername?: string
    isElevated: boolean
    privateIP: ipAddress
    hostname: string
  }
  preferences: IPreferences
  deferredAttributes?: IService['attributes']
}

const state: IBackendState = {
  connections: [],
  device: DEFAULT_TARGET,
  targets: [],
  scanData: { wlan0: { data: [], timestamp: 0 } },
  interfaces: [],
  lan: {
    oobAvailable: false,
    oobActive: false,
  },
  error: false,
  freePort: undefined,
  update: undefined,
  globalError: undefined,
  dataReady: false,
  environment: {
    os: undefined,
    osVersion: '',
    arch: '',
    manufacturerDetails: undefined,
    adminUsername: undefined,
    isElevated: false,
    privateIP: '',
    hostname: '',
  },
  preferences: {},
  deferredAttributes: undefined,
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async targetDeviceUpdated(targetDevice: ITargetDevice, globalState: any) {
      const { ui, backend, devices } = dispatch as Dispatch
      const { device } = globalState.backend

      if (targetDevice?.uid !== device.uid) {
        if (targetDevice.uid && globalState.ui.setupRegisteringDevice) {
          const result = await devices.fetchSingle({ deviceId: targetDevice.uid })
          if (!result) {
            // Instances were reported where a device wasn't returned
            await sleep(2000)
            await devices.fetch()
          }
          ui.set({
            setupRegisteringDevice: false,
            successMessage: `${targetDevice.name} registered successfully!`,
          })
        } else if (globalState.ui.setupDeletingDevice) {
          const result = await devices.fetchSingle({ deviceId: device.uid })
          if (result) {
            await sleep(2000)
            await devices.fetch()
          }
          ui.set({
            setupDeletingDevice: false,
            successMessage: `${device.name} unregistered successfully!`,
          })
        }
      }

      backend.set({ device: targetDevice })
    },
    async targetUpdated(_, globalState: any) {
      const { user } = globalState.auth as ApplicationState['auth']
      if (globalState.ui.setupBusy) {
        await dispatch.devices.fetch(user?.id)
        await dispatch.backend.updateDeferredAttributes()
        dispatch.ui.reset()
      }
    },
    async updateDeferredAttributes(_, globalState: any) {
      const { deferredAttributes, targets } = globalState.backend
      if (deferredAttributes) {
        const last = targets[targets.length - 1]
        let [service] = findService(getDevices(globalState), last.uid)
        if (service) {
          service.attributes = { ...service.attributes, ...deferredAttributes }
          dispatch.devices.setServiceAttributes(service)
          dispatch.devices.set({ deferredAttributes: undefined })
        }
      }
    },
    async registerDevice({ targets, name }: { targets: ITarget[]; name: string }, globalState: any) {
      const targetDevice = globalState.backend.device
      emit('registration', { device: { ...targetDevice, name }, targets })
      dispatch.ui.set({ setupRegisteringDevice: true })
      analyticsHelper.track('deviceCreated', { ...targetDevice, id: targetDevice.uid })
      targets.forEach(t => analyticsHelper.track('serviceCreated', { ...t, id: t.uid }))
    },
    async addTargetService(target: ITarget, globalState: any) {
      analyticsHelper.track('serviceCreated', { ...target, id: target.uid })
      dispatch.ui.set({ setupBusy: true, setupAddingService: true })
      emit('targets', [...globalState.backend.targets, target])
    },
    async removeTargetService(target: ITarget, globalState: any) {
      const targets: ITarget[] = globalState.backend.targets
      const index = targets?.findIndex(t => t.uid === target.uid)
      analyticsHelper.track('serviceRemoved', { ...target, id: target.uid })
      let copy = [...globalState.backend.targets]
      copy.splice(index, 1)
      dispatch.ui.set({ setupBusy: true, setupServiceBusy: target.uid })
      emit('targets', copy)
    },
    async updateTargetService(target: ITarget, globalState: any) {
      const targets: ITarget[] = globalState.backend.targets
      analyticsHelper.track('serviceUpdated', { ...target, id: target.uid })
      dispatch.ui.set({ setupBusy: true, setupServiceBusy: true })
      const tIndex = targets?.findIndex(t => t.uid === target.uid)
      targets[tIndex] = target
      emit('targets', targets)
    },
  }),

  reducers: {
    set(state: IBackendState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
    },

    setConnection(state: IBackendState, connection: IConnection) {
      state.connections.some((c, index) => {
        if (c.id === connection.id) {
          state.connections[index] = connection
          return true
        }
        return false
      })
    },
  },
})
