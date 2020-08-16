import { createModel } from '@rematch/core'
import { DEFAULT_TARGET } from '../shared/constants'

type IBackendState = ILookup & {
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
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async updateTargetDevice(targetDevice: ITargetDevice, globalState: any) {
      const { ui, backend, devices } = dispatch
      const { device } = globalState.backend

      if (targetDevice.uid !== device.uid) {
        devices.fetch()
        if (targetDevice.uid && globalState.ui.setupRegisteringDevice) {
          ui.set({
            setupRegisteringDevice: false,
            successMessage: `${targetDevice.name} registered successfully!`,
          })
        } else if (globalState.ui.setupDeletingDevice) {
          ui.set({
            setupDeletingDevice: false,
            successMessage: `${device.name} unregistered successfully!`,
          })
        }
      }

      backend.set({ device: targetDevice })
    },
  }),

  reducers: {
    set(state: IBackendState, params: ILookup) {
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
