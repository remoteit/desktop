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
  setupRegisteringDevice: boolean
  setupDeletingDevice: boolean
  setupAddingService: boolean
  setupServiceBusy?: string
  setupServicesCount: number
  setupServicesNew: boolean
  successMessage: string
}

const state: UIState = {
  connected: false,
  uninstalling: false,
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
  successMessage: '',
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
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
