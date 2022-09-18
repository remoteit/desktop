import { emit } from '../services/Controller'
import { Theme } from '@mui/material'
import { RootModel } from '.'
import { createModel } from '@rematch/core'
import { SIDEBAR_WIDTH } from '../shared/constants'
import { ApplicationState } from '../store'
import { selectTheme, isDarkMode } from '../styling/theme'
import { getLocalStorage, setLocalStorage, isElectron, isHeadless } from '../services/Browser'

export const DEFAULT_INTERFACE = 'searching'

const SAVED_STATES = [
  'guides',
  'themeMode',
  'accordion',
  'drawerMenu',
  'drawerAccordion',
  'collapsed',
  'columns',
  'columnWidths',
  'limitsOverride',
]

type UIState = {
  theme: Theme
  themeMode: 'light' | 'dark' | 'system'
  themeDark: boolean
  layout: ILayout
  silent: boolean
  selected: IDevice['id'][]
  connected: boolean
  offline: boolean
  waitMessage?: string
  claiming: boolean
  fetching: boolean
  destroying: boolean
  transferring: boolean
  routingLock?: IRouteType
  routingMessage?: string
  sidebarMenu: boolean
  drawerMenu: 'FILTER' | 'COLUMNS' | null
  drawerAccordion: string | number
  columns: string[]
  columnWidths: ILookup<number>
  collapsed: string[]
  limitsOverride: ILookup<boolean>
  serviceContextMenu?: IContextMenu
  globalTooltip?: IGlobalTooltip
  registrationCommand?: string
  redirect?: string
  restoring: boolean
  scanEnabled: boolean
  scanLoading: { [interfaceName: string]: boolean }
  scanTimestamp: { [interfaceName: string]: number }
  scanInterface: string
  setupBusy: boolean
  setupAdded?: IService
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
  navigation: ILookup<string>
  navigationBack: string[]
  navigationForward: string[]
  guides: ILookup<IGuide>
  accordion: ILookup<boolean>
  autoConnect: boolean
  autoLaunch: boolean
  autoCopy: boolean
}

export const defaultState: UIState = {
  theme: selectTheme(),
  themeMode: 'system',
  themeDark: isDarkMode(),
  layout: { showOrgs: false, hideSidebar: false, singlePanel: false, sidePanelWidth: SIDEBAR_WIDTH },
  silent: false,
  selected: [],
  connected: false,
  offline: !navigator.onLine,
  waitMessage: undefined,
  claiming: false,
  fetching: false,
  destroying: false,
  transferring: false,
  routingLock: undefined,
  routingMessage: undefined,
  sidebarMenu: false,
  drawerMenu: null,
  drawerAccordion: 'sort',
  columns: ['deviceName', 'status', 'tags', 'services'],
  columnWidths: {},
  collapsed: ['recent'],
  limitsOverride: {},
  serviceContextMenu: undefined,
  globalTooltip: undefined,
  registrationCommand: undefined,
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
  panelWidth: { devices: 400, networks: 450, connections: 450, settings: 350, account: 300, organization: 350 },
  navigation: {},
  navigationBack: [],
  navigationForward: [],
  guides: {
    aws: { title: 'AWS Guide', step: 1, total: 6, done: false, weight: 20 },
    network: { title: 'Add Network Guide', step: 1, total: 3, done: false, weight: 30 },
    service: { title: 'Add Service Guide ', step: 1, total: 3, done: false, weight: 40 },
    register: { title: 'Device Registration Guide', step: 1, total: 1, done: false, weight: 10 },
  },
  accordion: { config: true, configConnected: false, options: false, service: false, networks: false },
  autoConnect: false,
  autoLaunch: false,
  autoCopy: false,
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async init() {
      // add color scheme listener
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        dispatch.ui.setTheme(undefined)
      })
      await dispatch.ui.restoreState()
    },
    async restoreState(_: void, state) {
      let states: ILookup<any> = {}
      SAVED_STATES.forEach(key => {
        const value = getLocalStorage(state, `ui-${key}`)
        if (value) {
          if (typeof value === 'object' && !Array.isArray(value)) states[key] = { ...state.ui[key], ...value }
          else states[key] = value
        }
      })
      dispatch.ui.set(states)
      dispatch.ui.setTheme(states.themeMode)
    },
    async setupUpdated(count: number, globalState) {
      if (count !== globalState.ui.setupServicesCount) {
        dispatch.ui.updated()
        dispatch.ui.set({ setupServicesCount: count, setupAdded: undefined, setupServicesNew: true })
      }
    },
    async refreshAll() {
      dispatch.ui.set({ fetching: true })
      await dispatch.devices.set({ from: 0 })
      await dispatch.accounts.fetch()
      await dispatch.devices.fetch()
      await dispatch.networks.fetch()
      await dispatch.connections.fetch()
      await Promise.all([
        dispatch.sessions.fetch(),
        dispatch.user.fetch(),
        dispatch.tags.fetch(),
        dispatch.plans.fetch(),
        dispatch.organization.fetch(),
        dispatch.announcements.fetch(),
      ])
      dispatch.ui.set({ fetching: false })
    },
    async setTheme(themeMode: UIState['themeMode'] | undefined, globalState) {
      themeMode = themeMode || globalState.ui.themeMode
      dispatch.ui.setPersistent({ themeMode })
      dispatch.ui.set({ theme: selectTheme(themeMode), themeDark: isDarkMode(themeMode) })
    },
    async resizeColumn(params: { id: string; width: number }, globalState) {
      const columnWidths = { ...globalState.ui.columnWidths, [params.id]: params.width }
      dispatch.ui.setPersistent({ columnWidths })
    },
    async guide({ guide, ...props }: ILookup<any>, globalState) {
      let state = globalState.ui.guides[guide]
      if (!state) return
      const active = props.active === undefined ? state.active : props.active

      if (active) {
        if (props.step > state.total) {
          props.done = true
          props.step = 0
        }
        if (props.done) props.active = false
      }

      const guides = { ...globalState.ui.guides, [guide]: { ...state, ...props } }
      dispatch.ui.setPersistent({ guides })
    },
    async resetGuides(_: void, globalState) {
      dispatch.ui.setPersistent({ guides: { ...defaultState.guides } })
    },
    async accordion(params: ILookup<boolean>, state) {
      const accordion = { ...state.ui.accordion, ...params }
      dispatch.ui.setPersistent({ accordion })
    },
    async setPersistent(params: ILookup<any>, state) {
      Object.keys(params).forEach(key => {
        if (SAVED_STATES.includes(key)) setLocalStorage(state, `ui-${key}`, params[key] || '')
      })
      dispatch.ui.set(params)
    },
    async deprecated(_: void, globalState) {
      if (!isElectron() || isHeadless()) return
      const { preferences } = globalState.backend
      dispatch.ui.set({
        errorMessage: 'This version of Desktop is no longer supported. It should auto update shortly.',
      })
      emit('preferences', { ...preferences, autoUpdate: true })
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
    reset(state: UIState) {
      state = { ...defaultState }
      return state
    },
  },
})

export function selectPriorityGuide(state: ApplicationState, guide: string): IGuide {
  const all = state.ui.guides
  const result = all[guide] || {}
  let active = result.active
  for (let key in all) {
    const g = all[key]
    if (g.active && g.weight < result.weight) active = false
  }
  return { ...result, active }
}
