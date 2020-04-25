import { createModel } from '@rematch/core'
import { DEFAULT_TARGET } from '../constants'

type IBackendState = { [key: string]: any } & {
  connections: IConnection[]
  device: IDevice
  targets: ITarget[]
  scanData: IScanData
  interfaces: IInterface[]
  lan: {
    oobAvailable: boolean
    oobActive: boolean
  }
  added?: ITarget
  error: boolean
  freePort?: number
  update?: string
  cliError?: string
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
  added: undefined,
  error: false,
  freePort: undefined,
  update: undefined,
  cliError: undefined,
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
    set(state: IBackendState, { key, value }: { key: string; value: any }) {
      state[key] = value
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
