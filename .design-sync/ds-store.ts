/**
 * A minimal, inert redux store for the design system.
 *
 * WHY THIS EXISTS
 * Many of these components call `useSelector` / `useDispatch` somewhere in their
 * render path — often not in the component itself but in a child (GridList →
 * GridListHeader, Tags → Tag → useLabel, Icon → PlatformIcon). Without a redux
 * Provider, react-redux throws "could not find react-redux context value" and
 * React tears down the whole subtree.
 *
 * That is not just a preview problem: a design built in Claude Design with these
 * components would fail exactly the same way. So the store ships as part of
 * DesignSystemProvider rather than being stubbed per preview card.
 *
 * WHAT IT IS NOT
 * This is a STUB, not the app's real store. State is static, dispatch is inert
 * (every action is a no-op that resolves). Nothing fetches, persists, or
 * mutates. Components render their empty/default presentation, which is exactly
 * what a design tool wants — real device data would be noise.
 *
 * The shapes below mirror each model's `defaultState` in frontend/src/models/.
 * They are a hand-maintained copy: importing the real models would pull in
 * rematch effects, the API client and auth side effects. If a component starts
 * rendering blank after a model changes shape, reconcile it here.
 */

/** Mirrors frontend/src/models/labels.ts — Tags/Tag resolve ITag.color as a label id. */
const labels = [
  { id: 0, name: 'none', color: 'inherit', hidden: true },
  { id: 1, name: 'Gray', color: '#797c86' },
  { id: 2, name: 'Red', color: '#E65B4C' },
  { id: 3, name: 'Orange', color: '#EF922E' },
  { id: 4, name: 'Yellow', color: '#F5CC17' },
  { id: 5, name: 'Lime', color: '#BBD40F' },
  { id: 6, name: 'Green', color: '#61C951' },
  { id: 7, name: 'Teal', color: '#31C49E' },
  { id: 8, name: 'Sky', color: '#4AB8F4' },
  { id: 9, name: 'Blue', color: '#6193FE' },
  { id: 10, name: 'Violet', color: '#6F54CC' },
  { id: 11, name: 'Purple', color: '#8F4EBA' },
  { id: 12, name: 'Berry', color: '#C236AB' },
  { id: 13, name: 'Pink', color: '#E13F88' },
]

export const designSystemState: any = {
  ui: {
    themeMode: 'system',
    themeDark: false,
    language: 'system',
    apis: {},
    layout: {
      mobile: false,
      showOrgs: false,
      hideSidebar: false,
      singlePanel: false,
      triplePanel: false,
      sidePanelWidth: 300,
      showBottomMenu: false,
    },
    columns: [],
    columnWidths: {},
    collapsed: [],
    drawerMenu: null,
    selected: [],
    errorMessage: '',
    successMessage: '',
    noticeMessage: '',
    silent: undefined,
    autoConnect: false,
    fetching: false,
    offline: false,
  },
  auth: {
    initialized: true,
    authenticated: false,
    backendAuthenticated: false,
    signInError: undefined,
    user: undefined,
    authService: undefined,
    mfaMethod: '',
    AWSUser: { authProvider: '' },
  },
  backend: {
    initialized: true,
    thisId: '',
    scanData: {},
    interfaces: [],
    environment: {},
    preferences: {},
    connections: [],
    freePort: undefined,
    updateReady: '',
    reachablePort: true,
  },
  user: {
    id: '',
    email: '',
    created: new Date(0),
    notificationSettings: {},
    reseller: null,
    language: 'en',
    attributes: {},
    admin: false,
  },
  devices: { all: [], initialized: true, accountId: '', total: 0, results: 0, fetching: false, fetchingMore: false, query: '', filter: 'all', sort: 'state,name' },
  connections: { all: [], queue: [], queueCount: 0, initialized: true, updating: false },
  networks: { all: [], initialized: true, default: { id: '', name: '', permissions: [], serviceIds: [] } },
  accounts: { membership: [], activeId: '', initialized: true, emails: [] },
  organization: { id: '', name: '', reseller: null, providers: null, verified: false, members: [], roles: [], initialized: true },
  plans: { initialized: true, plans: [], licenses: [], limits: [], purchasing: undefined, informed: false, tests: {} },
  labels,
  tags: { all: {} },
  sessions: { all: [] },
  products: { all: [], initialized: true },
  jobs: { all: [], initialized: true },
  files: { all: [], initialized: true },
  announcements: { all: [] },
  applicationTypes: { all: [] },
  dropped: {},
  activated: {},
  licensing: { licenses: [], limits: [], informed: false },
  feedback: {},
  logs: { all: [], fetching: false },
  mfa: {},
  bluetooth: {},
  search: { all: [], fetching: false },
}

/**
 * Inert rematch-shaped dispatch. The app's components destructure model slices
 * off it (`const { ui } = useDispatch()`) and then call effects, so every path
 * must be reachable and callable. A plain object would throw on the first
 * unknown model, hence the nested Proxy.
 */
const makeDispatch = (): any => {
  const model: any = new Proxy(
    {},
    { get: () => () => Promise.resolve() }
  )
  return new Proxy(function () {} as any, {
    get: (_t, prop) => (prop === 'then' ? undefined : model),
    apply: () => undefined,
  })
}

/**
 * Store shaped like a redux store, enough for react-redux's Provider and hooks.
 * `subscribe` returns a no-op unsubscribe; state never changes, so no listener
 * is ever called.
 */
export const designSystemStore: any = {
  getState: () => designSystemState,
  subscribe: () => () => {},
  dispatch: makeDispatch(),
  replaceReducer: () => {},
  [Symbol.observable]: function () { return this },
}
