import { createModel } from '@rematch/core'
import { DEFAULT_TARGET } from '../constants'

interface IJumpState {
  device: IDevice
  targets: ITarget[]
  scanData: IScanData
  interfaces: IInterface[]
  added: ITarget | undefined
  error: boolean
}

const state: IJumpState = {
  device: DEFAULT_TARGET,
  targets: [],
  scanData: { wlan0: [] },
  interfaces: [],
  added: undefined,
  error: false,
}

export default createModel({
  state,
  reducers: {
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
