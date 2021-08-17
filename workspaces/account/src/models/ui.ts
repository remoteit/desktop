import { createModel } from '@rematch/core'
import { RootModel } from './rootModel'

export const DEFAULT_INTERFACE = 'searching'

type UIState = {
  connected: boolean
  offline: boolean
  uninstalling: boolean
  claiming: boolean
  routingMessage?: string
  filterMenu: boolean
  redirect?: string
  restoring: boolean
  scanEnabled: boolean
  scanInterface: string
  setupBusy: boolean
  setupRegisteringDevice: boolean
  setupDeletingDevice: boolean
  setupAddingService: boolean
  setupDeletingService?: string
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
  navigationBack: string[]
  navigationForward: string[]
}

const state: UIState = {
  connected: false,
  offline: false,
  uninstalling: false,
  claiming: false,
  routingMessage: undefined,
  filterMenu: false,
  redirect: undefined,
  restoring: false,
  scanEnabled: true,
  scanInterface: DEFAULT_INTERFACE,
  setupBusy: false,
  setupRegisteringDevice: false,
  setupDeletingDevice: false,
  setupServiceBusy: undefined,
  setupDeletingService: undefined,
  setupAddingService: false,
  setupServicesCount: 0,
  setupServicesNew: true,
  setupServicesLimit: 10,
  successMessage: '',
  noticeMessage: '',
  errorMessage: '',
  launchLoading: false,
  launchPath: '',
  requireInstall: '',
  navigationBack: [],
  navigationForward: [],
}

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    setupUpdated(count: number, globalState) {
      if (count !== globalState.ui.setupServicesCount) {
        dispatch.ui.reset()
        dispatch.ui.set({ setupServicesCount: count, setupAdded: undefined, setupServicesNew: true })
      }
    },
    async refreshAll() {
      dispatch.devices.set({ from: 0 })
      await dispatch.devices.fetch()
      dispatch.sessions.fetch()
      dispatch.licensing.fetch()
      dispatch.announcements.fetch()
    },
  }),
  reducers: {
    set(state: UIState, params: ILookup<any>) {
      //Object.keys(params).forEach(key => (state[key] = params[key]))
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
