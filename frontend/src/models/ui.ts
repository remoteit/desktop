import { getDevices } from './accounts'
import { createModel } from '@rematch/core'
import { TARGET_PLATFORMS } from '../components/TargetPlatform'

export const DEFAULT_INTERFACE = 'searching'

type UIParams = { [key: string]: any }
type UIState = UIParams & {
  connected: boolean
  uninstalling: boolean
  scanEnabled: boolean
  scanLoading: { [interfaceName: string]: boolean }
  scanTimestamp: { [interfaceName: string]: number }
  scanInterface: string
  setupBusy: boolean
  setupAdded?: ITarget
  setupRegisteringDevice: boolean
  setupDeletingDevice: boolean
  setupAddingService: boolean
  setupServiceBusy?: string
  setupServicesCount: number
  setupServicesNew: boolean
  setupServicesLimit: number
  successMessage: string
}

const state: UIState = {
  connected: false,
  uninstalling: false,
  scanEnabled: true,
  scanLoading: {},
  scanTimestamp: {},
  scanInterface: DEFAULT_INTERFACE,
  setupBusy: false,
  setupAdded: undefined,
  setupRegisteringDevice: false,
  setupDeletingDevice: false,
  setupServiceBusy: undefined,
  setupAddingService: false,
  setupServicesCount: 0,
  setupServicesNew: true,
  setupServicesLimit: 10,
  successMessage: '',
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    devicesUpdated(_, globalState: any) {
      const all: IDevice[] = getDevices(globalState)
      const targetDevice: ITargetDevice = globalState.backend.device
      const thisDevice = all.find(d => d.id === targetDevice.uid)
      const targetPlatform = TARGET_PLATFORMS[thisDevice?.targetPlatform || -1]
      if (targetPlatform === 'AWS') {
        dispatch.ui.set({ setupServicesLimit: 100, scanEnabled: false })
        console.log('TARGET PLATFORM', targetPlatform, 'settings applied')
      }
    },
    setupUpdated(count: number, globalState: any) {
      if (count !== globalState.ui.setupServicesCount) {
        dispatch.ui.reset()
        dispatch.ui.set({ setupServicesCount: count, setupAdded: undefined, setupServicesNew: true })
      }
    },
  }),
  reducers: {
    set(state: UIState, params: UIParams) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
    },
    reset(state: UIState) {
      state.setupBusy = false
      state.setupAddingService = false
      state.setupServiceBusy = undefined
    },
  },
})
