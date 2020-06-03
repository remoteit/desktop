import { createModel } from '@rematch/core'
import { DEFAULT_TARGET } from '../shared/constants'

type BackendStateParams = { [key: string]: any }
type IBackendState = BackendStateParams & {
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
  reducers: {
    set(state: IBackendState, params: BackendStateParams) {
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
