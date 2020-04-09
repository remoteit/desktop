import { createModel } from '@rematch/core'
import { DEFAULT_TARGET } from '../constants'

type IBackendState = { [key: string]: any } & {
  connections: IConnection[]
  device: IDevice
  targets: ITarget[]
  scanData: IScanData
  interfaces: IInterface[]
  added?: ITarget
  error: boolean
  privateIP: ipAddress
  freePort?: number
  admin?: string
  update?: string
  cliError?: string
  os?: Ios
  dataReady: boolean
  isElevated: boolean
  preferences: IPreferences
}

const state: IBackendState = {
  connections: [],
  device: DEFAULT_TARGET,
  targets: [],
  scanData: { wlan0: { data: [], timestamp: 0 } },
  interfaces: [],
  added: undefined,
  error: false,
  privateIP: '',
  freePort: undefined,
  admin: undefined,
  update: undefined,
  cliError: undefined,
  os: undefined,
  dataReady: false,
  isElevated: false,
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
