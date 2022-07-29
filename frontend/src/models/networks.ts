import { createModel } from '@rematch/core'
import { isPortal } from '../services/Browser'
import { getActiveAccountId, getActiveUser } from './accounts'
import { getLocalStorage, setLocalStorage } from '../services/Browser'
import { selectConnection } from '../helpers/connectionHelper'
import { ApplicationState } from '../store'
import { selectById } from '../models/devices'
import {
  graphQLAddNetwork,
  graphQLDeleteNetwork,
  graphQLAddConnection,
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
  name: 'Local Network',
  permissions: [],
  enabled: true,
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

export const recentNetwork: INetwork = {
  ...defaultNetwork(),
  id: 'recent',
  name: 'Recent services',
  permissions: [],
  enabled: false,
  icon: 'clock-rotate-left',
}

type INetworksAccountState = {
  initialized: boolean
  all: ILookup<INetwork[]>
  default: INetwork
}

export type addConnectionProps = {
  serviceId: string
  networkId: string
  port?: number
  name?: string
  enabled?: boolean
}

const defaultAccountState: INetworksAccountState = {
  initialized: false,
  default: isPortal() ? defaultCloudNetwork : defaultLocalNetwork,
  all: {},
}

export default createModel<RootModel>()({
  state: { ...defaultAccountState },
  effects: dispatch => ({
    async init(_: void, state) {
      const storedNetwork = getLocalStorage(state, 'networks-default')
      dispatch.networks.set({ default: storedNetwork ? storedNetwork : defaultNetwork(state) })
      await dispatch.networks.fetch()
      dispatch.networks.set({ initialized: true })
    },
    async fetch(_: void, state) {
      const accountId = getActiveAccountId(state)
      const result = await graphQLBasicRequest(
        ` query($account: String) {
            login {
              account(id: $account) {
                networks {
                  id
                  name
                  enabled
                  created
                  permissions
                  owner {
                    id
                    email
                  }
                  connections {
                    service {
                      id
                      name
                    }
                    name
                    port
                    enabled
                    created
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
      const networks = await dispatch.networks.parse(result)
      if (networks) await dispatch.networks.setNetworks(networks)
      // dispatch.networks.handleOrphanedConnections()
    },

    async fetchIfEmpty(_: void, state) {
      const accountId = getActiveAccountId(state)
      if (!state.networks.all[accountId]) dispatch.networks.fetch()
    },

    async parse(result: AxiosResponse<any> | undefined) {
      const all = result?.data?.data?.login?.account?.networks
      if (!all) return
      const parsed: INetwork[] = all.map(n => ({
        ...n,
        created: new Date(n.created),
        serviceIds: n.connections.map(c => c.service.id),
        access: n.access.map(s => ({ email: s.user.email, id: s.user.id })),
        tags: n.tags.map(t => ({ ...t, created: new Date(t.created) })),
        icon: 'chart-network',
      }))
      // TODO load connection data and merge into connections
      //      don't load all data if in portal mode
      console.log('LOAD NETWORKS', parsed)
      return parsed
    },
    // async handleOrphanedConnections(_:void, state) {
    // const assigned = new Set()
    // Object.keys(state.networks.all).forEach(key => {
    //   state.networks.all[key].forEach(network => {
    //     network.serviceIds.forEach(id => {
    //       assigned.add(id)
    //     })
    //   })
    // })
    // const connectionIds = selectConnections(state)
    //   .filter(c => c.enabled)
    //   .map(c => c.id)
    // const orphaned = connectionIds.filter(id => !assigned.has(id))
    // console.log('ORPHANED CONNECTIONS', orphaned)
    // dispatch.networks.add({ serviceIds: orphaned, disableConnect: true })
    // },
    async enable(params: INetwork) {
      const queue = params.serviceIds.map(id => ({ id, enabled: params.enabled }))
      dispatch.connections.queueEnable(queue)
      dispatch.networks.setNetwork({ ...params, enabled: params.enabled })
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
        const result = await graphQLAddConnection(props)
        if (result === 'ERROR' || !result?.data?.data?.addNetworkConnection) {
          dispatch.ui.set({ errorMessage: `Adding network failed. Please contact support.` })
          dispatch.networks.setNetwork(network)
          return
        }
      }
      if (copy.enabled && props.enabled) dispatch.networks.enable(copy)
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
          dispatch.ui.set({ errorMessage: 'Failed to remove connection. Please contact support.' })
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
      const response = await graphQLAddNetwork(params, id)
      if (response === 'ERROR') return
      params.id = response?.data?.data?.createNetwork?.id
      console.log('ADDING NETWORK', params)
      await dispatch.networks.setNetwork(params)
      dispatch.ui.set({ redirect: `/networks/view/${params.id}` })
    },
    async shareNetwork({ id, emails }: { id: string; emails: string[] }, state) {
      const response = await graphQLAddNetworkShare(id, emails)
      if (response === 'ERROR' || !response?.data?.data?.addNetworkShare) return
      const network = selectNetwork(state, id)
      network.access.concat(emails.map(e => ({ email: e, id: '' })))
      await dispatch.networks.setNetwork(network)
      await dispatch.networks.fetch()
      dispatch.ui.set({
        successMessage:
          emails.length > 1
            ? `${emails.length} accounts successfully shared to ${network.name}.`
            : `${network.name} successfully shared to ${emails[0]}.`,
      })
    },
    async unshareNetwork({ id, email }: { id: string; email: string }, state) {
      const response = await graphQLRemoveNetworkShare(id, email)
      if (response === 'ERROR' || !response?.data?.data?.removeNetworkShare) return
      const network = selectNetwork(state, id)
      const index = network.access.findIndex(a => a.email === email)
      network.access.splice(index, 1)
      await dispatch.networks.setNetwork(network)
    },
    async setNetwork(params: INetwork, state) {
      const id = getActiveAccountId(state)

      if (params.id === DEFAULT_ID) {
        dispatch.networks.set({ default: { ...params } })
        setLocalStorage(state, 'networks-default', params)
        return
      }

      let networks = state.networks.all[id] || []
      const index = networks.findIndex(network => network.id === params.id)
      if (index >= 0) networks[index] = { ...networks[index], ...params }
      else networks.push(params)

      dispatch.networks.setNetworks(networks)
    },
    async setNetworks(networks: INetwork[], state) {
      const id = getActiveAccountId(state)
      dispatch.networks.set({ all: { ...state.networks.all, [id]: [...networks] } })
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
    enabled: false,
    owner: { id: '', email: '' },
    permissions: ['VIEW', 'CONNECT', 'MANAGE', 'ADMIN'],
    serviceIds: [],
    access: [],
    tags: [],
    icon: 'chart-network',
  }
}

export function selectNetworks(state: ApplicationState): INetwork[] {
  let all = state.networks.all[getActiveAccountId(state)] || []
  return [state.networks.default, ...all]
}

export function selectNetwork(state: ApplicationState, networkId?: string): INetwork {
  return selectNetworks(state).find(n => n.id === networkId) || defaultNetwork(state)
}

export function selectNetworkByService(state: ApplicationState, serviceId: string = DEFAULT_ID): INetwork[] {
  return selectNetworks(state).filter(network => network.serviceIds.includes(serviceId))
}

export function getNetworkServiceIds(state: ApplicationState): string[] {
  const networks = selectNetworks(state)
  let serviceIds: string[] = []
  networks.forEach(network => (serviceIds = serviceIds.concat(network.serviceIds)))
  return serviceIds
}
