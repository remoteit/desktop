import { createModel } from '@rematch/core'
import defaults from '../jump/common/defaults'
import { ITarget, IDevice, IScanData, IInterface } from '../jump/common/types'

interface IJumpState {
  device: IDevice
  targets: ITarget[]
  scanData: IScanData
  interfaces: IInterface[]
  added: ITarget | undefined
  error: boolean
}

const state: IJumpState = {
  device: defaults,
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

/* 
const updateTargets = (t: ITarget[]) => socket.emit('jump/targets', t)
const updateDevice = (d: IDevice) => socket.emit('jump/device', d)
const signIn = (u: IUser) => {
  socket.emit('jump/user', u)
  socket.emit('jump/auth')
}
const deleteDevice = () => {
  socket.emit('jump/device', 'DELETE')
  socket.emit('jump/auth')
}

const scan = (interfaceName: string) => socket.emit('jump/scan', interfaceName)

useEffect(() => socket.emit('jump/auth'), [socket])
 */
