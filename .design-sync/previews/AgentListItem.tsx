import React from 'react'
import { AgentListItem } from 'remoteit-desktop-frontend'

// AgentListItem is one row of Account → Connected apps: the OAuth client's logo
// or monogram, its name, and a one-line summary of how far its token reaches
// plus when it was last seen. The row links to the app's detail page, so it
// also carries the selected state when that page is open.

/* ---------------------------------------------------------------------------
 * App-context shim.
 * The row renders through ListItemLocation (react-router's location/history)
 * and resolves org names through the redux store. The preview page has neither
 * provider — the DS bundle ships the component, not the app shell, and a
 * provider imported here would be a second copy with its own context identity.
 * So we fill the two contexts at their only read point: React's dispatcher,
 * matched by the context's own displayName, and ONLY when the real value is
 * missing. Any genuinely provided context passes through untouched.
 * ------------------------------------------------------------------------- */
const location = {
  pathname: '/account/connected/claude-desktop',
  search: '',
  hash: '',
  state: undefined,
  key: 'ds-preview',
}
const history = {
  length: 1,
  action: 'POP',
  location,
  push: () => {},
  replace: () => {},
  go: () => {},
  goBack: () => {},
  goForward: () => {},
  block: () => () => {},
  listen: () => () => {},
  createHref: (l: any) => l.pathname,
}
const routerValue = {
  history,
  location,
  match: { path: '/account/connected', url: '/account/connected', params: {}, isExact: false },
  staticContext: undefined,
}

// The slices useAccountLabel() reads: the signed-in user and their org memberships.
const storeState = {
  auth: { user: { id: 'usr-4c19a', email: 'jamie@remote.it' } },
  user: { id: 'usr-4c19a', email: 'jamie@remote.it' },
  accounts: {
    membership: [
      { account: { id: 'org-northwind', email: 'ops@northwind-logistics.com' }, name: 'Northwind Logistics' },
      { account: { id: 'org-harborside', email: 'it@harborside-clinic.org' }, name: 'Harborside Clinic' },
    ],
  },
}
const reduxValue = {
  store: { getState: () => storeState, subscribe: () => () => {}, dispatch: (a: any) => a },
  subscription: {
    addNestedSub: () => () => {},
    notifyNestedSubs: () => {},
    handleChangeWrapper: () => {},
    isSubscribed: () => false,
    trySubscribe: () => {},
    tryUnsubscribe: () => {},
  },
  getServerState: undefined,
  stabilityCheck: 'never',
  identityFunctionCheck: 'never',
}

const FALLBACKS: any = { Router: routerValue, 'Router-History': history, ReactRedux: reduxValue }

const internals: any = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
const dispatcherRef: any = internals && internals.ReactCurrentDispatcher
if (dispatcherRef && !dispatcherRef.__dsContextShim) {
  dispatcherRef.__dsContextShim = true
  const cache = new WeakMap()
  const wrap = (d: any) => {
    if (!d || d.__dsContextShim) return d
    let w = cache.get(d)
    if (!w) {
      w = Object.create(d)
      w.__dsContextShim = true
      w.useContext = (ctx: any) => {
        const value = d.useContext(ctx)
        const name = ctx && ctx.displayName
        return value == null && name && FALLBACKS[name] ? FALLBACKS[name] : value
      }
      cache.set(d, w)
    }
    return w
  }
  let current = wrap(dispatcherRef.current)
  Object.defineProperty(dispatcherRef, 'current', {
    configurable: true,
    get: () => current,
    set: (v: any) => {
      current = wrap(v)
    },
  })
}
/* --------------------------------------------------------------------- */

const logo = (body: string) =>
  'data:image/svg+xml;base64,' +
  btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">${body}</svg>`)

const claudeLogo = logo(
  `<rect width="96" height="96" fill="#d97757"/>
   <text x="48" y="66" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="52" font-weight="700" fill="#ffffff">C</text>`
)

const agent = (over: any = {}): any => ({
  clientId: 'cursor-ide',
  clientName: 'Cursor',
  logoUri: null,
  capabilities: ['device:read', 'device:connect'],
  audience: [{ url: 'https://api.remote.it/graphql', label: 'remote.it API' }],
  grantedAt: '2026-06-02T17:40:00Z',
  reach: null,
  lastActive: '2026-08-02T21:14:00Z',
  ...over,
})

// ListItemLocation renders a plain ListItem (an <li>) whenever a row has no
// link, so the rows always live inside a list.
const List: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxWidth: 560 }}>{children}</ul>
)

export const AuthorizedApps = () => (
  <List>
    <AgentListItem
      agent={agent({
        clientId: 'claude-desktop-preview',
        clientName: 'Claude Desktop',
        logoUri: claudeLogo,
        lastActive: '2026-08-03T13:52:00Z',
      })}
    />
    <AgentListItem agent={agent()} />
    <AgentListItem
      agent={agent({
        clientId: 'home-assistant',
        clientName: 'Home Assistant',
        reach: [{ account: 'org-northwind', tags: ['shop-floor'], operator: 'ANY' }],
        lastActive: '2026-07-29T06:03:00Z',
      })}
    />
    <AgentListItem
      agent={agent({
        clientId: 'fleet-provisioner',
        clientName: 'Fleet Provisioner',
        capabilities: ['device:read', 'device:write', 'device:execute'],
        reach: [
          { account: 'org-northwind', tags: null, operator: 'ANY' },
          { account: 'org-harborside', tags: null, operator: 'ANY' },
        ],
        lastActive: null,
      })}
    />
  </List>
)

// The reach summary is the row's whole information budget — every branch of it.
export const ReachVariants = () => (
  <List>
    <AgentListItem agent={agent({ clientId: 'zapier', clientName: 'Zapier', reach: null })} />
    <AgentListItem agent={agent({ clientId: 'grafana-agent', clientName: 'Grafana Agent', reach: [] })} />
    <AgentListItem
      agent={agent({
        clientId: 'shop-floor-bot',
        clientName: 'Shop Floor Bot',
        reach: [{ account: 'usr-4c19a', tags: null, operator: 'ANY' }],
      })}
    />
    <AgentListItem
      agent={agent({
        clientId: 'clinic-monitor',
        clientName: 'Clinic Monitor',
        reach: [{ account: 'org-harborside', tags: ['hvac', 'imaging'], operator: 'ALL' }],
      })}
    />
    <AgentListItem
      agent={agent({
        clientId: 'unregistered-cli',
        clientName: undefined,
        reach: [
          { account: 'org-northwind', tags: null, operator: 'ANY' },
          { account: 'org-harborside', tags: ['hvac'], operator: 'ANY' },
        ],
        lastActive: undefined,
      })}
    />
  </List>
)

// With /account/connected/claude-desktop open, that row carries the selected
// background; the rows below it do not.
export const SelectedRoute = () => (
  <List>
    <AgentListItem
      agent={agent({ clientId: 'claude-desktop', clientName: 'Claude Desktop', logoUri: claudeLogo })}
    />
    <AgentListItem agent={agent({ clientId: 'home-assistant', clientName: 'Home Assistant' })} />
  </List>
)
