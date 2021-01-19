import { createModel } from '@rematch/core'
import { RootModel } from './rootModel'

export const DEFAULT_INTERFACE = 'searching'

type UIState = {
  connected: boolean
  uninstalling: boolean
  routingLock?: IRouteType
  routingMessage?: string
  filterMenu: boolean
  redirect?: string
  restore: boolean
  restoring: boolean
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
  noticeMessage: string
  errorMessage: string
  launchLoading: boolean
  launchPath: string
  requireInstall: string
}

const state: UIState = {
  connected: false,
  uninstalling: false,
  routingLock: undefined,
  routingMessage: undefined,
  filterMenu: false,
  redirect: undefined,
  restore: false,
  restoring: false,
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
  noticeMessage: '',
  errorMessage: '',
  launchLoading: false,
  launchPath: '',
  requireInstall: ''
}

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    setupUpdated(count: number, globalState: any) {
      if (count !== globalState.ui.setupServicesCount) {
        dispatch.ui.reset()
        dispatch.ui.set({ setupServicesCount: count, setupAdded: undefined, setupServicesNew: true })
      }
    },
  }),
  reducers: {
    set(state: UIState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
    reset(state: UIState) {
      state.setupBusy = false
      state.setupAddingService = false
      state.setupServiceBusy = undefined
      state.restoring = false
      return state
    },
  },
})
