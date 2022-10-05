import { createModel } from '@rematch/core'
import { isPortal } from '../services/Browser'
import { ApplicationState } from '../store'
import { getActiveAccountId, getActiveUser } from './accounts'
import { selectConnection, selectEnabledConnections } from '../helpers/connectionHelper'
import { IOrganizationState, canMemberView, canViewByTags, canRoleView } from '../models/organization'
import { selectById } from '../models/devices'
import {
  graphQLAddNetwork,
  graphQLDeleteNetwork,
  graphQLUpdateNetwork,
  graphQLSetConnection,
  graphQLRemoveConnection,
  graphQLAddNetworkShare,
  graphQLRemoveNetworkShare,
} from '../services/graphQLMutation'
import { graphQLBasicRequest } from '../services/graphQL'
import { AxiosResponse } from 'axios'
import { RootModel } from '.'

export const DEFAULT_ID = 'local'

const defaultLocalNetwork: INetwork = {
  ...defaultNetwork(),
  id: DEFAULT_ID,
  name: 'Active',
  permissions: [],
  enabled: true,
  shared: false,
  icon: 'network-wired',
}

const defaultCloudNetwork: INetwork = {
  ...defaultNetwork(),
  id: DEFAULT_ID,
  name: 'Cloud Proxy',
  permissions: [],
  enabled: true,
  icon: 'cloud',
}

export const sharedNetwork: INetwork = {
  ...defaultNetwork(),
  id: 'shared',
  name: 'Shared',
  permissions: [],
  enabled: true,
  shared: false,
  icon: 'network-wired',
}

export const recentNetwork: INetwork = {
  ...defaultNetwork(),
  id: 'recent',
  name: 'Recent',
  permissions: [],
  enabled: false,
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
  default: isPortal() ? defaultCloudNetwork : defaultLocalNetwork,
  all: {},
}

export default createModel<RootModel>()({
  state: { ...defaultAccountState },
  effects: dispatch => ({
    async init(_: void, state) {
      dispatch.networks.set({ default: defaultNetwork(state) })
      await dispatch.networks.fetch()
      dispatch.networks.set({ initialized: true })
    },
    async fetch(_: void, state) {
      const accountId = getActiveAccountId(state)
      dispatch.networks.set({ loading: true })
      const result = await graphQLBasicRequest(
        ` query Networks($account: String) {
            login {
              account(id: $account) {
                networks {
                  id
                  name
                  created
                  permissions
                  owner {
                    id
                    email
                  }
                  connections {
                    service {
                      id
                    }
                    name
                    port
                  }
                  tags {
                    name
                    color
                    created
                  }
                  access {
                    user {
                      id
                      email
                    }
                  }
                }
              }
            }
          }`,
        {
          account: accountId,
        }
      )
      if (result === 'ERROR') return

      await dispatch.networks.parse(result)
      dispatch.networks.set({ loading: false })
    },

    async fetchIfEmpty(_: void, state) {
      const accountId = getActiveAccountId(state)
      if (!state.networks.all[accountId]) {
        await dispatch.networks.set({ initialized: false })
        await dispatch.networks.fetch()
        await dispatch.networks.set({ initialized: true })
      }
    },

    async parse(result: AxiosResponse<any> | undefined, state) {
      const accountId = getActiveAccountId(state)
      const all = result?.data?.data?.login?.account?.networks
      if (!all) return

      const parsed: INetwork[] = all.map(n => {
        const shared = accountId !== n.owner.id

        return {
          ...defaultNetwork(),
          shared,
          id: n.id,
          name: n.name,
          owner: n.owner,
          permissions: n.permissions,
          created: new Date(n.created),
          // FIXME this is not enough data to generate new network connections... need full generation for shared networks...
          // ...maybe can be done by adding the network service IDs to the connection query
          connectionNames: n.connections.reduce((obj, c) => ({ ...obj, [c.service.id]: c.name }), {}),

          serviceIds: n.connections.map(c => c.service.id),
          access: n.access.map(s => ({ email: s.user.email, id: s.user.id })),
          tags: n.tags.map(t => ({ ...t, created: new Date(t.created) })),
          icon: 'chart-network',
        }
      })

      console.log('LOAD NETWORKS', parsed)
      dispatch.networks.setNetworks({ networks: parsed, accountId })
    },
    async fetchCount(role: IOrganizationRole, state) {
      if (role.access === 'NONE') return 0
      const networks: INetwork[] = selectNetworks(state).filter(n => canRoleView(role, n))
      return networks.length
    },
    async start(serviceId: string, state) {
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
    async remove({ serviceId = '', networkId = DEFAULT_ID }: { serviceId?: string; networkId?: string }, state) {
      const joined = selectNetworkByService(state, serviceId)
      let network = selectNetwork(state, networkId)
      let copy = { ...network }
      const index = copy.serviceIds.indexOf(serviceId)
      copy.serviceIds.splice(index, 1)
      dispatch.networks.setNetwork(copy)
      if (networkId !== DEFAULT_ID) {
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
        const [service] = selectById(state, serviceId)
        const connection = selectConnection(state, service)
        dispatch.connections.disconnect(connection)
      }
    },
    async removeById(id: string, state) {
      let { all } = state.networks
      all[DEFAULT_ID] = [state.networks.default]
      const [_, device] = selectById(state, id)
      const serviceIds = id === device?.id ? device?.services.map(s => s.id) : [id]
      Object.keys(all).forEach(key => {
        all[key].forEach(async network => {
          const match = network.serviceIds.find(serviceId => serviceIds.includes(serviceId))
          if (match) await dispatch.networks.remove({ serviceId: match, networkId: network.id })
        })
      })
    },
    async deleteNetwork(params: INetwork, state) {
      const id = getActiveAccountId(state)
      const response = await graphQLDeleteNetwork(params.id)
      if (response === 'ERROR') return
      let networks = state.networks.all[id] || []
      const index = networks.findIndex(network => network.id === params.id)
      networks.splice(index, 1)
      dispatch.networks.set({ all: { ...state.networks.all, [id]: [...networks] } })
    },
    async addNetwork(params: INetwork, state) {
      const id = getActiveAccountId(state)
      const response = await graphQLAddNetwork(params.name, id)
      if (response === 'ERROR') return
      params.id = response?.data?.data?.createNetwork?.id
      console.log('ADDING NETWORK', params)
      await dispatch.networks.setNetwork(params)
      await dispatch.networks.fetch()
      dispatch.ui.set({ redirect: `/networks/view/${params.id}` })
    },
    async updateNetwork(network: INetwork, state) {
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
      const network = selectNetwork(state, networkId)
      const index = network.access.findIndex(a => a.email === email)
      network.access.splice(index, 1)
      await dispatch.networks.setNetwork(network)
    },
    async setNetwork(params: INetwork, state) {
      const id = getActiveAccountId(state)
      if (params.id === DEFAULT_ID) return

      let networks: INetwork[] = state.networks.all[id] || []
      const index = networks.findIndex(network => network.id === params.id)

      if (index >= 0) {
        const network = { ...networks[index], ...params }
        networks[index] = network
        dispatch.networks.setNetworks({ networks, accountId: id })
      }
    },
    async setNetworks(props: { networks: INetwork[]; accountId?: string }, state) {
      const id = props.accountId || getActiveAccountId(state)
      dispatch.networks.set({ all: { ...state.networks.all, [id]: [...props.networks] } })
    },
  }),
  reducers: {
    set(state: INetworksAccountState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
    reset(state: INetworksAccountState) {
      state = { ...defaultAccountState }
      return state
    },
  },
})

export function defaultNetwork(state?: ApplicationState): INetwork {
  if (state) {
    state.networks.default.owner = getActiveUser(state)
    return state.networks.default
  }

  return {
    id: '',
    name: '',
    enabled: true,
    shared: false,
    owner: { id: '', email: '' },
    permissions: ['VIEW', 'CONNECT', 'MANAGE', 'ADMIN'],
    connectionNames: {},
    serviceIds: [],
    access: [],
    tags: [],
    icon: 'chart-network',
  }
}

export function selectNetworks(state: ApplicationState): INetwork[] {
  return state.networks.all[getActiveAccountId(state)] || []
}

export function selectNetwork(state: ApplicationState, networkId?: string): INetwork {
  return selectNetworks(state).find(n => n.id === networkId) || defaultNetwork(state)
}

export function selectActiveNetworks(state: ApplicationState): INetwork[] {
  const template = defaultNetwork(state)
  const all = selectEnabledConnections(state)
  let networks: INetwork[] = []

  all.forEach(c => {
    const accountId = c?.accountId || state.user.id
    const name = state.organization.accounts[accountId || '']?.name || 'Unknown'
    const index = networks.findIndex(n => n.id === accountId)
    if (index === -1) networks.push({ ...template, id: accountId, name, serviceIds: [c.id] })
    else networks[index].serviceIds.push(c.id)
  })

  return networks
}

export function selectNetworkByService(state: ApplicationState, serviceId: string = DEFAULT_ID): INetwork[] {
  return selectNetworks(state).filter(network => network.serviceIds.includes(serviceId))
}

export function selectNetworkByTag(state: ApplicationState, tags: ITagFilter): INetwork[] {
  const networks = selectNetworks(state).filter(n => canViewByTags(tags, n.tags))
  return networks
}

export function selectAccessibleNetworks(
  state: ApplicationState,
  organization: IOrganizationState,
  member?: IOrganizationMember
) {
  if (!member) return []
  const networks = selectNetworks(state)
  return networks.filter(n => canMemberView(organization.roles, member, n))
}

export function inNetworkOnly(state: ApplicationState, serviceId?: string): boolean {
  const networks = selectNetworkByService(state, serviceId)
  if (!networks.length) return false
  return !networks.find(n => !n.shared)
}

export function getNetworkServiceIds(state: ApplicationState): string[] {
  const networks = selectNetworks(state)
  let serviceIds: string[] = []
  networks.forEach(network => (serviceIds = serviceIds.concat(network.serviceIds)))
  return serviceIds
}
