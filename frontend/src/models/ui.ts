import structuredClone from '@ungap/structured-clone'
import { emit } from '../services/Controller'
import { RootModel } from '.'
import { isDarkMode } from '../styling/theme'
import { NoticeProps } from '../components/Notice'
import { createModel } from '@rematch/core'
import { SIDEBAR_WIDTH } from '../shared/constants'
import { ApplicationState } from '../store'
import { getActiveAccountId } from '../selectors/accounts'
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
  'defaultService',
  'testUI',
  'updateNoticeCleared',
]

export type UIState = {
  themeMode: 'light' | 'dark' | 'system'
  themeDark: boolean
  testUI?: 'OFF' | 'ON' | 'HIGHLIGHT'
  layout: ILayout
  silent: string | null
  selected: IDevice['id'][]
  connected: boolean
  offline?: { severity: NoticeProps['severity']; title: string; message: NoticeProps['children'] }
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
  defaultService: ILookup<string | null>
  defaultSelection: ILookup<ILookup<string | undefined>>
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
  guides: ILookup<IGuide>
  poppedBubbles: string[]
  unExpireBubbles: boolean
  confirm?: { id: string; callback: () => void }
  accordion: ILookup<boolean>
  autoConnect: boolean
  autoLaunch: boolean
  autoCopy: boolean
  updateNoticeCleared?: number
}

export const defaultState: UIState = {
  themeMode: 'system',
  themeDark: isDarkMode(),
  testUI: undefined,
  layout: { showOrgs: false, hideSidebar: false, singlePanel: false, sidePanelWidth: SIDEBAR_WIDTH },
  silent: null,
  selected: [],
  connected: false,
  offline: undefined,
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
  columnWidths: { tags: 120 },
  collapsed: ['recent'],
  limitsOverride: {},
  serviceContextMenu: undefined,
  globalTooltip: undefined,
  defaultService: {},
  defaultSelection: {},
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
  accordion: { config: false, configConnected: false, options: false, service: false, networks: false, logs: false },
  confirm: undefined,
  autoConnect: false,
  autoLaunch: false,
  autoCopy: false,
  updateNoticeCleared: undefined,
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
      console.log('RESTORE UI STATE', states)
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
      await dispatch.devices.fetchList()
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
      dispatch.ui.set({ themeDark: isDarkMode(themeMode) })
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
    async setDefaultService({ deviceId, serviceId }: { deviceId: string; serviceId: string | null }, state) {
      const all = { ...state.ui.defaultService }
      all[deviceId] = serviceId
      dispatch.ui.setPersistent({ defaultService: all })
    },
    async setDefaultSelected({ key, value }: { key: string; value?: string }, state) {
      const accountId = getActiveAccountId(state)
      let defaultSelection = structuredClone(state.ui.defaultSelection)
      defaultSelection[accountId] = defaultSelection[accountId] || {}
      defaultSelection[accountId][key] = value
      dispatch.ui.set({ defaultSelection })
    },
    async setPersistent(params: ILookup<any>, state) {
      dispatch.ui.set(params)
      Object.keys(params).forEach(key => {
        if (SAVED_STATES.includes(key)) setLocalStorage(state, `ui-${key}`, params[key] || '')
      })
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
