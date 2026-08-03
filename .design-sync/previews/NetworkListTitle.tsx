import React from 'react'
import { NetworkListTitle, Tags, ExpandIcon } from 'remoteit-desktop-frontend'

// NetworkListTitle is the header row of a network group in the Networks /
// Connections lists: the network's icon (or, on the Connections page, the
// owner's avatar), its name, and a children slot the list fills with tags and
// the expand caret. It links to the network unless `noLink` turns it into a
// plain toggle row, and turns brand blue while the network has live
// connections (`enabled`).

/* ---------------------------------------------------------------------------
 * App-context shim.
 * The row renders through ListItemLocation, which reads react-router's
 * location (to decide the selected state) and history (to navigate on click);
 * the tags in its children slot resolve their color from the redux label
 * palette. The preview page has neither provider — the DS bundle ships the
 * component, not the app shell, and a provider imported here would be a second
 * copy with its own context identity. So we fill the contexts at their only
 * read point: React's dispatcher, matched by the context's own displayName,
 * and ONLY when the real value is missing. Any genuinely provided context
 * passes through untouched.
 * ------------------------------------------------------------------------- */
const location = { pathname: '/networks/nw-shop-floor', search: '', hash: '', state: undefined, key: 'ds-preview' }
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
  match: { path: '/networks', url: '/networks', params: {}, isExact: false },
  staticContext: undefined,
}
// The label palette Tag colors come from (models/labels), verbatim.
const storeState = {
  labels: [
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
  ],
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

const network = (over: any = {}): any => ({
  id: 'nw-austin-plant',
  name: 'Austin Plant',
  cloud: false,
  shared: false,
  loaded: true,
  accountId: 'org-northwind',
  owner: { id: 'usr-4c19a', email: 'jamie@remote.it' },
  permissions: ['VIEW', 'CONNECT', 'MANAGE', 'ADMIN'],
  connectionNames: {},
  serviceIds: [],
  access: [],
  tags: [],
  icon: 'chart-network',
  iconType: 'light',
  ...over,
})

// ListItemLocation renders a plain ListItem (an <li>) when a row has no link,
// so the rows always live inside a list.
const List: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxWidth: 520 }}>{children}</ul>
)

export const Networks = () => (
  <List>
    <NetworkListTitle network={network({ id: 'nw-shop-floor-b', name: 'Shop Floor', icon: 'chart-network' })} />
    <NetworkListTitle network={network({ id: 'nw-cloud-proxy', name: 'Cloud Proxy', icon: 'cloud' })} />
    <NetworkListTitle network={network({ id: 'nw-lab-vlan', name: 'Lab VLAN', icon: 'network-wired' })} />
    <NetworkListTitle network={network({ id: 'nw-field-lte', name: 'Field LTE Routers', icon: 'router' })} />
    <NetworkListTitle network={network({ id: 'nw-guest-wifi', name: 'Guest Wi-Fi', icon: 'wifi' })} />
  </List>
)

// enabled = the network has live connections (icon + title go brand blue);
// expanded=false appends the ellipsis that marks a collapsed group; and with
// /networks/nw-shop-floor open, that row carries the selected background.
export const StatesAndSelection = () => (
  <List>
    <NetworkListTitle network={network({ id: 'nw-shop-floor', name: 'Shop Floor' })} />
    <NetworkListTitle network={network({ id: 'nw-cold-chain', name: 'Cold Chain Sensors' })} enabled />
    <NetworkListTitle network={network({ id: 'nw-lab-vlan', name: 'Lab VLAN' })} expanded={false} />
    <NetworkListTitle network={network({ id: 'nw-field-lte', name: 'Field LTE Routers' })} enabled expanded={false} />
  </List>
)

// The Connections page variant: noLink swaps the network icon for the owner's
// avatar and makes the row a toggle instead of a link.
export const OwnedNetworks = () => (
  <List>
    <NetworkListTitle
      network={network({ id: 'nw-personal', name: 'Personal', owner: { id: 'usr-4c19a', email: 'jamie@remote.it' } })}
      noLink
      onClick={() => {}}
    />
    <NetworkListTitle
      network={network({
        id: 'nw-northwind',
        name: 'Northwind Logistics',
        owner: { id: 'usr-9b1f', email: 'ops@northwind-logistics.com' },
      })}
      noLink
      onClick={() => {}}
    />
    <NetworkListTitle
      network={network({
        id: 'nw-harborside',
        name: 'Harborside Clinic',
        owner: { id: 'usr-2d6e', email: 'it@harborside-clinic.org' },
      })}
      noLink
      enabled
      onClick={() => {}}
    />
  </List>
)

// The children slot, filled the way the Networks list fills it: the network's
// tags and the expand caret.
export const WithTagsAndCaret = () => (
  <List>
    <NetworkListTitle network={network({ id: 'nw-shop-floor-c', name: 'Shop Floor' })}>
      <Tags tags={[{ name: 'production', color: 2 }, { name: 'austin', color: 5 }]} max={0} small />
      <ExpandIcon open />
    </NetworkListTitle>
    <NetworkListTitle network={network({ id: 'nw-cold-chain-b', name: 'Cold Chain Sensors' })} enabled>
      <Tags tags={[{ name: 'hvac', color: 8 }]} max={0} small />
      <ExpandIcon />
    </NetworkListTitle>
    <NetworkListTitle network={network({ id: 'nw-lab-vlan-b', name: 'Lab VLAN', icon: 'network-wired' })}>
      <Tags tags={[{ name: 'staging', color: 11 }, { name: 'no-alerts', color: 3 }]} max={0} small />
      <ExpandIcon />
    </NetworkListTitle>
  </List>
)
