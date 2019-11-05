import { createModel } from '@rematch/core'
import { DEFAULT_TARGET } from '../constants'

interface IJumpState {
  connection: IConnection[]
  device: IDevice
  targets: ITarget[]
  scanData: IScanData
  interfaces: IInterface[]
  added: ITarget | undefined
  error: boolean
}

const state: IJumpState = {
  connection: [],
  device: DEFAULT_TARGET,
  targets: [],
  scanData: { wlan0: { data: [], timestamp: 0 } },
  interfaces: [],
  added: undefined,
  error: false,
}

export default createModel({
  state,
  reducers: {
    setConnection(state: IJumpState, connection: IConnection[]) {
      state.connection = connection
    },
    setDevice(state: IJumpState, device: IDevice) {
      state.device = device
    },
    setTargets(state: IJumpState, targets: ITarget[]) {
      state.targets = targets
    },
    setScanData(state: IJumpState, scanData: IScanData) {
      state.scanData = scanData
    },
    setInterfaces(state: IJumpState, interfaces: IInterface[]) {
      state.interfaces = interfaces
    },
    setAdded(state: IJumpState, added?: ITarget) {
      state.added = added
    },
    setError(state: IJumpState, error: boolean) {
      state.error = error
    },
  },
})
