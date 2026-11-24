import browser from '../services/browser'
import structuredClone from '@ungap/structured-clone'
import { State } from '../store'
import { createModel } from '@rematch/core'
import { selectConnection } from '../selectors/connections'
import { asRow, rowGone, selectRowOf, sendAs } from '../selectors/signIns'
import { RowKey, rowSub, withoutAccounts, withoutRows, rekeyed } from '../helpers/rowKey'
import { selectActiveAccountId, selectActiveUser } from '../selectors/accounts'
import { selectNetworks, selectNetworkByService } from '../selectors/networks'
import { IOrganizationState, canMemberView, canViewByTags, canRoleView } from '../models/organization'
import { graphQLFetchNetworkSingle, graphQLPreloadNetworks } from '../services/graphQLRequest'
import { getDeviceModelFn, selectById } from '../selectors/devices'
import {
  graphQLAddNetwork,
  graphQLDeleteNetwork,
  graphQLUpdateNetwork,
  graphQLSetConnection,
  graphQLRemoveConnection,
  graphQLAddNetworkShare,
  graphQLRemoveNetworkShare,
} from '../services/graphQLMutation'
import { AxiosResponse } from 'axios'
import { RootModel } from '.'
import i18n from '../i18n'

export const DEFAULT_ID = 'local'
export const DEFAULT_NETWORK: INetwork = {
  id: '',
  name: '',
  cloud: false,
  shared: false,
  loaded: false,
  accountId: '',
  owner: { id: '', email: '' },
  permissions: ['VIEW', 'CONNECT', 'MANAGE', 'ADMIN'],
  connectionNames: {},
  serviceIds: [],
  access: [],
  tags: [],
  icon: 'chart-network',
}

const defaultLocalNetwork: INetwork = {
  ...DEFAULT_NETWORK,
  id: DEFAULT_ID,
  name: 'Active',
  permissions: [],
  shared: false,
  icon: 'network-wired',
}

const defaultCloudNetwork: INetwork = {
  ...DEFAULT_NETWORK,
  id: DEFAULT_ID,
  name: 'Cloud Proxy',
  permissions: [],
  icon: 'cloud',
}

export const recentNetwork: INetwork = {
  ...DEFAULT_NETWORK,
  id: 'recent',
  name: 'Recent',
  permissions: [],
  icon: 'clock-rotate-left',
}

// Built-in/system networks are synthetic groups with reserved ids (never used by
// real user networks); their English names are translated for display via
// hand-maintained catalog keys. Gating on the reserved id — not the name — means a
// user who names their own network "Local"/"Recent"/etc. is never relabeled.
const SYSTEM_NETWORK_IDS = new Set([DEFAULT_ID, 'recent', 'public'])
const SYSTEM_NETWORK_KEYS: ILookup<string> = {
  Active: 'network.active',
  'Cloud Proxy': 'network.cloudProxy',
  Recent: 'network.recent',
  Local: 'network.local',
}
export const networkName = (network?: INetwork): string => {
  if (!network) return ''
  const key = SYSTEM_NETWORK_IDS.has(network.id) ? SYSTEM_NETWORK_KEYS[network.name] : undefined
  return (key ? i18n.t(key, { defaultValue: network.name }) : network.name) || ''
}

export type addConnectionProps = {
  serviceId: string
  networkId: string
  port?: number
  name?: string
  enabled?: boolean
}

type INetworksAccountState = {
  initialized: boolean
  loading: boolean
  // By ROW (helpers/rowKey): an account's networks as each sign-in that belongs to it is given them.
  all: ILookup<INetwork[]>
  default: INetwork
}

const defaultAccountState: INetworksAccountState = {
  initialized: false,
  loading: false,
  default: defaultCloudNetwork,
  all: {},
}

export default createModel<RootModel>()({
  state: { ...defaultAccountState },
  effects: dispatch => ({
    async init(_: void, state) {
      dispatch.networks.set({ default: defaultNetwork(state) })
    },

    async fetch(fetchAll: boolean | void, state) {
      const accountId = selectActiveAccountId(state)
      // The row they are read for: asked as its sign-in, and kept under it whichever row is looked at by then.
      const row = selectRowOf(state, accountId)

      dispatch.networks.set({ loading: true })
      const response = await graphQLPreloadNetworks(accountId, asRow(row))

      if (response === 'ERROR') {
        dispatch.networks.set({ loading: false, initialized: true })
        return
      }

      const networks = await dispatch.networks.parse({ response, accountId })
      await dispatch.networks.preloadNetworkDevices({
        gqlNetworks: response?.data?.data?.login?.account?.networks,
        fetchAll: !!fetchAll,
        accountId,
        row,
      })
      await dispatch.networks.setNetworks({ networks, accountId, row })

      console.log('LOADED NETWORKS', networks)
      dispatch.networks.set({ loading: false, initialized: true })
    },

    async fetchAll() {
      await dispatch.networks.fetch(true)
    },

    async fetchSingle({ network, redirect }: { network: INetwork; redirect?: string }, state) {
      if (!network || !network.cloud) return

      const accountId = selectActiveAccountId(state)
      // The row whose list says it is reading: the one looked at now, whichever is by the time this ends.
      const row = selectRowOf(state, accountId)
      await dispatch.devices.set({ fetching: true, accountId, row })
      const gqlResponse = await graphQLFetchNetworkSingle(network.id, asRow(row))

      if (gqlResponse === 'ERROR') {
        dispatch.devices.set({ fetching: false, accountId, row })
        if (redirect) dispatch.ui.set({ redirect })
        return
      }

      const gqlNetworks = [gqlResponse?.data?.data?.login?.network]
      await dispatch.networks.preloadNetworkDevices({ gqlNetworks, accountId, row, fetchAll: true })
      await dispatch.networks.setNetworkIn({ network: { ...network, loaded: true }, accountId, row })

      dispatch.devices.set({ fetching: false, accountId, row })
    },

    async fetchIfEmpty(_: void, state) {
      const accountId = selectActiveAccountId(state)
      if (!state.networks.all[selectRowOf(state, accountId)]) {
        await dispatch.networks.set({ initialized: false })
        await dispatch.networks.fetch()
        await dispatch.networks.set({ initialized: true })
      }
    },

    async preloadNetworkDevices(
      props: { gqlNetworks?: any[]; accountId: string; row?: RowKey; fetchAll?: boolean },
      state
    ) {
      const { gqlNetworks, accountId, fetchAll } = props
      if (!gqlNetworks) return
      const row = props.row ?? selectRowOf(state, accountId)

      const held = getDeviceModelFn(state.devices, row).all.filter((d: IDevice) => !d.hidden && !d.disabled)
      const allDevices = new Set(fetchAll ? [] : held.map(device => device.id))

      const ids = new Set<string>()
      for (const network of gqlNetworks) {
        for (const connection of network.connections) {
          const id = connection.service?.device?.id
          if (!allDevices.has(id)) ids.add(id)
        }
      }

      if (ids.size) {
        console.log('PRELOAD NETWORK DEVICE IDS', ids)
        await dispatch.devices.fetchDevices({ ids: Array.from(ids), accountId, sub: rowSub(row), hidden: true })
      }
    },

    async parse({ response, accountId }: { response: AxiosResponse<any>; accountId: string }) {
      const networks = response.data?.data?.login?.account?.networks || []

      const parsed: INetwork[] = networks.map(n => ({
        ...DEFAULT_NETWORK,
        accountId,
        id: n.id,
        name: n.name,
        owner: n.owner,
        shared: accountId !== n.owner.id,
        permissions: n.permissions,
        created: new Date(n.created),
        // FIXME this is not enough data to generate new network connections... need full generation for shared networks...
        // ...maybe can be done by adding the network service IDs to the connection query
        connectionNames: n.connections.reduce((obj, c) => ({ ...obj, [c.service.id]: c.name }), {}),
        serviceIds: n.connections.map(c => c.service.id),
        access: n.access.map(s => ({ email: s.user.email, id: s.user.id })),
        tags: n.tags.map(t => ({ ...t, created: new Date(t.created) })),
        icon: 'chart-network',
        cloud: true,
      }))

      return parsed
    },

    async fetchCount(role: Partial<IOrganizationRole>, state) {
      if (role.access === 'NONE') return 0
      const networks: INetwork[] = selectNetworks(state).filter(n => canRoleView(role, n))
      return networks.length
    },

    async join(serviceId: string, state) {
      const joined = selectNetworkByService(state, serviceId)
      if (!joined.length) dispatch.networks.add({ serviceId, networkId: DEFAULT_ID })
    },

    async add(props: addConnectionProps, state) {
      const network = selectNetwork(state, props.networkId)
      const at = rowNow(state)
      let copy = { ...network }
      const unique = new Set(copy.serviceIds.concat(props.serviceId))
      copy.serviceIds = Array.from(unique)
      dispatch.networks.setNetworkIn({ network: copy, ...at })
      if (props.networkId !== DEFAULT_ID) {
        const result = await graphQLSetConnection(props)
        if (result === 'ERROR' || !result?.data?.data?.addNetworkConnection) {
          dispatch.ui.set({
            errorMessage: i18n.t('notices:network.addFailed', {
              defaultValue: 'Adding network failed. Please contact support.',
            }),
          })
          dispatch.networks.setNetworkIn({ network, ...at })
          return
        }
      }
    },

    async remove(
      { serviceId = '', networkId, clearOnly }: { serviceId?: string; networkId?: string; clearOnly?: boolean },
      state
    ) {
      const joined = selectNetworkByService(state, serviceId)
      let network = selectNetwork(state, networkId)
      const at = rowNow(state)

      if (!network.permissions.includes('MANAGE')) return

      let copy = structuredClone(network)
      const index = copy.serviceIds.indexOf(serviceId)
      copy.serviceIds.splice(index, 1)
      dispatch.networks.setNetworkIn({ network: copy, ...at })
      if (networkId && !clearOnly) {
        const result = await sendAs(at.row, () => graphQLRemoveConnection(networkId, serviceId))
        if (result === 'ERROR' || !result?.data?.data?.removeNetworkConnection) {
          console.error('Failed to remove network connection', serviceId, network, result)
          dispatch.ui.set({
            errorMessage: i18n.t('notices:network.removeConnectionFailed', {
              serviceId,
              network: network.name,
              defaultValue: 'Failed to remove network connection ({{serviceId}}) from {{network}}. Please contact support.',
            }),
          })
          dispatch.networks.setNetworkIn({ network, ...at })
          return
        }
      }
      if (joined.length <= 1) {
        const [service] = selectById(state, undefined, serviceId)
        const connection = selectConnection(state, service)
        dispatch.connections.disconnect({ connection })
      }
    },

    async clearById(id: string, state) {
      let all = { ...state.networks.all }
      all[DEFAULT_ID] = [state.networks.default]
      const [_, device] = selectById(state, undefined, id)
      const serviceIds = id === device?.id ? device?.services.map(s => s.id) : [id]
      Object.keys(all).forEach(key => {
        all[key].forEach(async network => {
          const match = network.serviceIds.find(serviceId => serviceIds.includes(serviceId))
          if (match) await dispatch.networks.remove({ serviceId: match, networkId: network.id, clearOnly: true })
        })
      })
    },

    async deleteNetwork(params: INetwork, state) {
      const at = rowNow(state)
      const response = await graphQLDeleteNetwork(params.id)
      if (response === 'ERROR') return
      const networks = (state.networks.all[at.row] || []).filter(network => network.id !== params.id)
      dispatch.networks.setNetworks({ networks, ...at })
    },

    async addNetwork(params: INetwork, state) {
      const id = selectActiveAccountId(state)
      const response = await graphQLAddNetwork(params.name, id)
      if (response === 'ERROR') return
      params.id = response?.data?.data?.createNetwork?.id
      console.log('ADDING NETWORK', params)
      await dispatch.networks.fetch()
      dispatch.ui.set({ redirect: `/networks/${params.id}` })
    },

    async updateNetwork(network: INetwork, state) {
      const at = rowNow(state)
      await dispatch.networks.setNetworkIn({ network, ...at })
      // Sent as the row it began in, whichever row is looked at once the write above is done.
      await sendAs(at.row, () => graphQLUpdateNetwork(network))
      await dispatch.networks.fetch()
    },

    async shareNetwork({ id, emails }: { id: string; emails: string[] }, state) {
      const response = await graphQLAddNetworkShare(id, emails)
      if (response === 'ERROR' || !response?.data?.data?.addNetworkShare) return
      const network = selectNetwork(state, id)
      await dispatch.networks.fetch()
      dispatch.ui.set({
        successMessage:
          emails.length > 1
            ? `${emails.length} accounts shared to ${network.name}.`
            : `${network.name} shared to ${emails[0]}.`,
      })
    },

    async unshareNetwork({ networkId, email }: { networkId: string; email: string }, state) {
      const response = await graphQLRemoveNetworkShare(networkId, email)
      if (response === 'ERROR' || !response?.data?.data?.removeNetworkShare) return
      const network = structuredClone(selectNetwork(state, networkId))
      const index = network.access.findIndex(a => a.email === email)
      network.access.splice(index, 1)
      await dispatch.networks.setNetworkIn({ network, ...rowNow(state) })
    },

    // A network of the row looked at now; an effect that waits for an answer says the row it began in (setNetworkIn).
    async setNetwork(params: INetwork, state) {
      await dispatch.networks.setNetworkIn({ network: params, ...rowNow(state) })
    },

    async setNetworkIn({ network, accountId, row }: { network: INetwork; accountId: string; row: RowKey }, state) {
      if (network.id === DEFAULT_ID) return

      let networks: INetwork[] = [...(state.networks.all[row] || [])]
      const index = networks.findIndex(each => each.id === network.id)

      if (index >= 0) {
        networks[index] = { ...networks[index], ...network }
        dispatch.networks.setNetworks({ networks, accountId, row })
      }
    },

    /* The one write of a row's networks. `row` is the key (helpers/rowKey): the row said — the one a read was made
       for, or an effect began in — else the one the account (`accountId`, or the selected one) is looked at through. */
    async setNetworks(props: { networks: INetwork[]; accountId?: string; row?: RowKey }, state) {
      const row = props.row ?? selectRowOf(state, props.accountId || selectActiveAccountId(state))
      // An answer for a row whose sign-in has left since it was asked: the row is gone, and is not put back.
      if (props.row && rowGone(state, props.row)) return
      dispatch.networks.setRow({ row, networks: [...props.networks] })
    },
  }),
  reducers: {
    reset(state: INetworksAccountState) {
      state = { ...defaultAccountState }
      return state
    },
    /** An account's data dropped: its sign-in signed out, so it is no longer a row (models/accounts forgetData). */
    forget(state: INetworksAccountState, accountIds: string[]) {
      state.all = withoutAccounts(state.all, accountIds)
      return state
    },
    forgetRows(state: INetworksAccountState, rows: string[]) {
      state.all = withoutRows(state.all, rows)
      return state
    },
    rekey(state: INetworksAccountState, rows: ILookup<RowKey>) {
      state.all = rekeyed(state.all, rows)
      return state
    },
    setRow(state: INetworksAccountState, { row, networks }: { row: RowKey; networks: INetwork[] }) {
      state.all = { ...state.all, [row]: networks }
      return state
    },
    set(state: INetworksAccountState, params: Partial<INetworksAccountState>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

// The row looked at now, as an effect says it to a write it makes after waiting.
const rowNow = (state: State) => {
  const accountId = selectActiveAccountId(state)
  return { accountId, row: selectRowOf(state, accountId) }
}

export function defaultNetwork(state?: State): INetwork {
  if (state) {
    const owner = selectActiveUser(state)
    const accountId = selectActiveAccountId(state)
    const defaultNetwork = browser.hasBackend ? defaultLocalNetwork : defaultCloudNetwork
    return { ...defaultNetwork, owner, accountId }
  }
  return DEFAULT_NETWORK
}

export function selectNetwork(state: State, networkId?: string): INetwork {
  return selectNetworks(state).find(n => n.id === networkId) || defaultNetwork(state)
}

export function selectNetworkByTag(state: State, tags: ITagFilter): INetwork[] {
  const networks = selectNetworks(state).filter(n => canViewByTags(tags, n.tags))
  return networks
}

export function selectAccessibleNetworks(state: State, organization: IOrganizationState, member?: IOrganizationMember) {
  if (!member) return []
  const networks = selectNetworks(state)
  return networks.filter(n => canMemberView(organization.roles, member, n))
}

export function selectSharedNetwork(state: State, serviceId?: string): INetwork | undefined {
  if (!serviceId) return
  const networks = selectNetworkByService(state, serviceId)
  if (!networks.length) return
  return networks.find(n => n.shared)
}
