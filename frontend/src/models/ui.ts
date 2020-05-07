import { createModel } from '@rematch/core'

export const DEFAULT_INTERFACE = 'searching'

type UIParams = { [key: string]: any }
type UIState = UIParams & {
  connected: boolean
  uninstalling: boolean
  scanLoading: { [interfaceName: string]: boolean }
  scanTimestamp: { [interfaceName: string]: number }
  scanInterface: string
  setupBusy: boolean
  setupAdded?: ITarget
  setupDeletingDevice: boolean
  setupAddingService: boolean
  setupDeletingService?: number
  setupServicesCount: number
  setupServicesNew: boolean
}

const state: UIState = {
  connected: false,
  uninstalling: false,
  scanLoading: {},
  scanTimestamp: {},
  scanInterface: DEFAULT_INTERFACE,
  setupBusy: false,
  setupAdded: undefined,
  setupDeletingDevice: false,
  setupDeletingService: undefined,
  setupAddingService: false,
  setupServicesCount: 0,
  setupServicesNew: true,
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    setupUpdated(count: number, globalState: any) {
      if (count !== globalState.ui.setupServicesCount) {
        dispatch.ui.reset()
        dispatch.ui.set({ setupServicesCount: count })
      }
    },
  }),
  reducers: {
    set(state: UIState, params: UIParams) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
    },
    reset(state: UIState) {
      state.setupAdded = undefined
      state.setupBusy = false
      state.setupDeletingDevice = false
      state.setupAddingService = false
      state.setupDeletingService = undefined
      state.setupServicesNew = true
    },
  },
})
