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
  'panelWidth',
  'poppedBubbles',
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
  poppedBubbles: string[]
  unExpireBubbles: boolean
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
    // all multi-step guides disabled while testing the guide bubbles
    // - consider removing guide steps feature if not needed any longer
    aws: { title: 'AWS Guide', step: 1, total: 6, done: true, weight: 20 },
    network: { title: 'Add Network Guide', step: 1, total: 3, done: true, weight: 30 },
    service: { title: 'Add Service Guide ', step: 1, total: 3, done: true, weight: 40 },
    register: { title: 'Device Registration Guide', step: 1, total: 1, done: true, weight: 10 },
  },
  poppedBubbles: [],
  unExpireBubbles: false,
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
      console.log('UI INIT')
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
    async setupUpdated(count: number, state) {
      if (count !== state.ui.setupServicesCount) {
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
    async setTheme(themeMode: UIState['themeMode'] | undefined, state) {
      themeMode = themeMode || state.ui.themeMode
      dispatch.ui.setPersistent({ themeMode })
      dispatch.ui.set({ theme: selectTheme(themeMode), themeDark: isDarkMode(themeMode) })
    },
    async resizeColumn(params: { id: string; width: number }, state) {
      const columnWidths = { ...state.ui.columnWidths, [params.id]: params.width }
      console.log('SET COLUMN WIDTHS', { columnWidths })
      dispatch.ui.setPersistent({ columnWidths })
    },
    async guide({ guide, ...props }: ILookup<any>, state) {
      let original = state.ui.guides[guide]
      if (!original) return
      const active = props.active === undefined ? original.active : props.active

      if (active) {
        if (props.step > original.total) {
          props.done = true
          props.step = 0
        }
        if (props.done) props.active = false
      }

      const guides = { ...state.ui.guides, [guide]: { ...original, ...props } }
      dispatch.ui.setPersistent({ guides })
    },
    async pop(bubble: string, state) {
      let poppedBubbles = [...state.ui.poppedBubbles]
      poppedBubbles.push(bubble)
      dispatch.ui.setPersistent({ poppedBubbles })
    },
    async resetHelp(_: void) {
      dispatch.ui.setPersistent({ guides: { ...defaultState.guides }, poppedBubbles: [...defaultState.poppedBubbles] })
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
    async deprecated(_: void, state) {
      if (!isElectron() || isHeadless()) return
      const { preferences } = state.backend
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

export function selectPriorityGuide(state: ApplicationState, guide: string, startDate: Date): IGuide {
  const all = state.ui.guides
  const result = all[guide] || {}
  let active = result.active
  for (let key in all) {
    const g = all[key]
    if (g.active && g.weight < result.weight) active = false
  }
  if (state.user.created < startDate) active = false
  return { ...result, active }
}
