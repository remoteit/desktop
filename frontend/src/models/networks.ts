import browser from '../services/browser'
import structuredClone from '@ungap/structured-clone'
import { State } from '../store'
import { createModel } from '@rematch/core'
import { selectConnection } from '../selectors/connections'
import { selectActiveAccountId, selectActiveUser } from '../selectors/accounts'
import { selectNetworks, selectNetworkByService } from '../selectors/networks'
import { IOrganizationState, canMemberView, canViewByTags, canRoleView } from '../models/organization'
import { graphQLFetchNetworkSingle, graphQLPreloadNetworks } from '../services/graphQLRequest'
import { selectById, selectVisibleDevices } from '../selectors/devices'
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

      dispatch.networks.set({ loading: true })
      const response = await graphQLPreloadNetworks(accountId)

      if (response === 'ERROR') return

      const networks = await dispatch.networks.parse({ response, accountId })
      await dispatch.networks.preloadNetworkDevices({
        gqlNetworks: response?.data?.data?.login?.account?.networks,
        fetchAll: !!fetchAll,
        accountId,
      })
      await dispatch.networks.setNetworks({ networks, accountId })

      console.log('LOADED NETWORKS', networks)
      dispatch.networks.set({ loading: false, initialized: true })
    },

    async fetchAll() {
      await dispatch.networks.fetch(true)
    },

    async fetchSingle({ network, redirect }: { network: INetwork; redirect?: string }, state) {
      if (!network || !network.cloud) return

      const accountId = selectActiveAccountId(state)
      await dispatch.devices.set({ fetching: true, accountId })
      const gqlResponse = await graphQLFetchNetworkSingle(network.id)

      if (gqlResponse === 'ERROR') {
        if (redirect) dispatch.ui.set({ redirect })
        return
      }

      const gqlNetworks = [gqlResponse?.data?.data?.login?.network]
      await dispatch.networks.preloadNetworkDevices({ gqlNetworks, accountId, fetchAll: true })
      await dispatch.networks.setNetwork({ ...network, loaded: true })

      dispatch.devices.set({ fetching: false, accountId })
    },

    async fetchIfEmpty(_: void, state) {
      const accountId = selectActiveAccountId(state)
      if (!state.networks.all[accountId]) {
        await dispatch.networks.set({ initialized: false })
        await dispatch.networks.fetch()
        await dispatch.networks.set({ initialized: true })
      }
    },

    async preloadNetworkDevices(props: { gqlNetworks?: any[]; accountId: string; fetchAll?: boolean }, state) {
      const { gqlNetworks, accountId, fetchAll } = props
      if (!gqlNetworks) return

      const allDevices = new Set(fetchAll ? [] : selectVisibleDevices(state, accountId).map(device => device.id))

      const ids = new Set<string>()
      for (const network of gqlNetworks) {
        for (const connection of network.connections) {
          const id = connection.service?.device?.id
          if (!allDevices.has(id)) ids.add(id)
        }
      }

      if (ids.size) {
        console.log('PRELOAD NETWORK DEVICE IDS', ids)
        await dispatch.devices.fetchDevices({ ids: Array.from(ids), accountId, hidden: true })
      }
    },

    async parse({ response, accountId }: { response: AxiosResponse<any> | undefined; accountId: string }) {
      const networks = response?.data?.data?.login?.account?.networks || []

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
      let copy = { ...network }
      const unique = new Set(copy.serviceIds.concat(props.serviceId))
      copy.serviceIds = Array.from(unique)
      dispatch.networks.setNetwork(copy)
      if (props.networkId !== DEFAULT_ID) {
        const result = await graphQLSetConnection(props)
        if (result === 'ERROR' || !result?.data?.data?.addNetworkConnection) {
          dispatch.ui.set({ errorMessage: `Adding network failed. Please contact support.` })
          dispatch.networks.setNetwork(network)
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

      if (!network.permissions.includes('MANAGE')) return

      let copy = structuredClone(network)
      const index = copy.serviceIds.indexOf(serviceId)
      copy.serviceIds.splice(index, 1)
      dispatch.networks.setNetwork(copy)
      if (networkId && !clearOnly) {
        const result = await graphQLRemoveConnection(networkId, serviceId)
        if (result === 'ERROR' || !result?.data?.data?.removeNetworkConnection) {
          console.error('Failed to remove network connection', serviceId, network, result)
          dispatch.ui.set({
            errorMessage: `Failed to remove network connection (${serviceId}) from ${network.name}. Please contact support.`,
          })
          dispatch.networks.setNetwork(network)
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
      const id = selectActiveAccountId(state)
      const response = await graphQLDeleteNetwork(params.id)
      if (response === 'ERROR') return
      let networks = [...state.networks.all[id]] || []
      const index = networks.findIndex(network => network.id === params.id)
      networks.splice(index, 1)
      dispatch.networks.set({ all: { ...state.networks.all, [id]: [...networks] } })
    },

    async addNetwork(params: INetwork, state) {
      const id = selectActiveAccountId(state)
      const response = await graphQLAddNetwork(params.name, id)
      if (response === 'ERROR') return
      params.id = response?.data?.data?.createNetwork?.id
      console.log('ADDING NETWORK', params)
      await dispatch.networks.setNetwork(params)
      await dispatch.networks.fetch()
      dispatch.ui.set({ redirect: `/networks/${params.id}` })
    },

    async updateNetwork(network: INetwork) {
      await dispatch.networks.setNetwork(network)
      await graphQLUpdateNetwork(network)
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
      await dispatch.networks.setNetwork(network)
    },

    async setNetwork(params: INetwork, state) {
      const id = selectActiveAccountId(state)
      if (params.id === DEFAULT_ID) return

      let networks: INetwork[] = [...(state.networks.all[id] || [])]
      const index = networks.findIndex(network => network.id === params.id)

      if (index >= 0) {
        networks[index] = { ...networks[index], ...params }
        dispatch.networks.setNetworks({ networks, accountId: id })
      }
    },

    async setNetworks(props: { networks: INetwork[]; accountId?: string }, state) {
      const id = props.accountId || selectActiveAccountId(state)
      dispatch.networks.set({ all: { ...state.networks.all, [id]: [...props.networks] } })
    },
  }),
  reducers: {
    reset(state: INetworksAccountState) {
      state = { ...defaultAccountState }
      return state
    },
    set(state: INetworksAccountState, params: Partial<INetworksAccountState>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

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
