import { RootModel } from './rootModel'
import { createModel } from '@rematch/core'
import { getTheme } from '../styling/theme'
import { getLocalStorage, setLocalStorage } from '../services/Browser'
import { Theme } from '@material-ui/core'

export const DEFAULT_INTERFACE = 'searching'

type UIState = {
  theme: Theme
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
  panelWidth: ILookup<number>
  navigationBack: string[]
  navigationForward: string[]
  guideAWS: IGuide
  guideLaunch: IGuide
  accordion: ILookup<boolean>
  autoLaunch: boolean
}

const defaultState: UIState = {
  theme: getTheme(checkDarkMode()),
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
  setupServicesLimit: 100,
  successMessage: '',
  noticeMessage: '',
  errorMessage: '',
  panelWidth: { devices: 400, connections: 500, settings: 350 },
  navigationBack: [],
  navigationForward: [],
  guideAWS: { title: 'AWS Guide', step: 1, total: 7 },
  guideLaunch: { title: 'Launch Guide', active: true, step: 1, total: 1 },
  accordion: { config: true, configConnected: false },
  autoLaunch: false,
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async init(_, globalState) {
      // restore guides
      const guides = Object.keys(globalState.ui).filter(key => key.startsWith('guide'))
      guides.forEach(guide => {
        let item = getLocalStorage(globalState, `ui-${guide}`)
        if (item) dispatch.ui.set({ [guide]: item })
      })

      // add color scheme listener
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        console.log('DARK MODE:', e.matches)
        dispatch.ui.set({ theme: getTheme(e.matches) })
      })
    },
    async setupUpdated(count: number, globalState) {
      if (count !== globalState.ui.setupServicesCount) {
        dispatch.ui.updated()
        dispatch.ui.set({ setupServicesCount: count, setupAdded: undefined, setupServicesNew: true })
      }
    },
    async refreshAll() {
      dispatch.devices.set({ from: 0 })
      dispatch.accounts.fetch()
      dispatch.organization.fetch()
      dispatch.sessions.fetch()
      dispatch.licensing.fetch()
      dispatch.announcements.fetch()
      dispatch.devices.fetch()
    },
    async guide({ guide, ...props }: ILookup<any>, globalState) {
      let state = globalState.ui[guide]
      const active = props.active === undefined ? state.active : props.active

      if (active) {
        if (props.step > state.total) {
          props.done = true
          props.step = 0
        }
        if (props.done) props.active = false
      }

      state = { ...state, ...props }
      setLocalStorage(globalState, `ui-${guide}`, state)
      dispatch.ui.set({ [guide]: state })
    },

    async resetGuides(_, globalState) {
      Object.keys(globalState.ui).forEach(key => {
        if (key.startsWith('guide')) dispatch.ui.guide({ guide: key, ...defaultState[key] })
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
    accordion(state: UIState, params: ILookup<boolean>) {
      state.accordion = { ...state.accordion, ...params }
      return state
    },
    reset(state: UIState) {
      state = { ...defaultState }
      return state
    },
  },
})

function checkDarkMode() {
  return window?.matchMedia && window?.matchMedia('(prefers-color-scheme: dark)').matches
}
