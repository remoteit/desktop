import { createModel } from '@rematch/core'
import { RootModel } from './rootModel'

export const DEFAULT_INTERFACE = 'searching'

type UIState = {
  navigation: ILookup<string>
  connected: boolean
  offline: boolean
  uninstalling: boolean
  claiming: boolean
  routingLock?: IRouteType
  routingMessage?: string
  drawerMenu: 'FILTER' | 'COLUMNS' | null
  columns: string[]
  serviceContextMenu?: IContextMenu
  redirect?: string
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
  panelWidth: ILookup<number>
  navigationBack: string[]
  navigationForward: string[]
  guideAWS: IGuide
  accordion: ILookup<boolean>
}

const defaultState: UIState = {
  navigation: {},
  connected: false,
  offline: false,
  uninstalling: false,
  claiming: false,
  routingLock: undefined,
  routingMessage: undefined,
  drawerMenu: null,
  columns: ['deviceName', 'services'],
  serviceContextMenu: undefined,
  redirect: undefined,
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
  panelWidth: { devices: 400, connections: 600, settings: 400 },
  navigationBack: [],
  navigationForward: [],
  guideAWS: { title: 'AWS Guide', step: 0, total: 7 },
  accordion: { config: true, configConnected: false },
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: dispatch => ({
    async setupUpdated(count: number, globalState) {
      if (count !== globalState.ui.setupServicesCount) {
        dispatch.ui.updated()
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
    async resetGuides(_, globalState) {
      Object.keys(globalState.ui).forEach(key => {
        if (key.startsWith('guide')) dispatch.ui.guide({ guide: key, step: 0, done: false })
      })
    },
  }),
  reducers: {
    set(state: UIState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
    updated(state: UIState) {
      state.setupBusy = false
      state.setupAddingService = false
      state.setupServiceBusy = undefined
      state.restoring = false
      return state
    },
    guide(state: UIState, { guide, ...props }: ILookup<any>) {
      if (props.back || props.done || (props.step && props.step === state[guide].step + 1)) {
        if (props.step > state[guide].total) {
          props.done = true
          props.step = 0
        }
        state[guide] = { ...state[guide], ...props }
      }
      return state
    },
    accordion(state: UIState, params: ILookup<boolean>) {
      state.accordion = { ...state.accordion, ...params }
      return state
    },
    reset(state: UIState) {
      state = defaultState
      return state
    },
  },
})
