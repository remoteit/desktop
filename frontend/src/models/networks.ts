import { createModel } from '@rematch/core'
import { isPortal } from '../services/Browser'
import { getActiveAccountId } from './accounts'
import { getLocalStorage, setLocalStorage } from '../services/Browser'
import { selectConnection } from '../helpers/connectionHelper'
import { ApplicationState } from '../store'
import { selectById } from '../models/devices'
import {
  graphQLAddNetwork,
  graphQLDeleteNetwork,
  graphQLAddConnection,
  graphQLRemoveConnection,
} from '../services/graphQLMutation'
import { graphQLBasicRequest } from '../services/graphQL'
import { AxiosResponse } from 'axios'
import { RootModel } from '.'

export const DEFAULT_ID = 'local'

export const defaultNetwork: INetwork = {
  id: '',
  name: '',
  enabled: false,
  serviceIds: [],
  tags: [],
  icon: 'chart-network',
}

const defaultLocalNetwork: INetwork = {
  ...defaultNetwork,
  id: DEFAULT_ID,
  name: 'Local Network',
  enabled: true,
  icon: 'network-wired',
}

const defaultCloudNetwork: INetwork = {
  ...defaultNetwork,
  id: DEFAULT_ID,
  name: 'Cloud Proxy',
  enabled: true,
  icon: 'cloud',
}

export const recentNetwork: INetwork = {
  ...defaultNetwork,
  id: 'recent',
  name: 'This system',
  enabled: false,
  icon: 'laptop',
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
    async init(_, state) {
      const defaultNetwork = getLocalStorage(state, 'networks-default')
      if (defaultNetwork) dispatch.networks.set({ default: defaultNetwork })
      await dispatch.networks.fetch()
      dispatch.networks.set({ initialized: true })
    },
    async fetch(_, state) {
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
                  tags {
                    name
                    color
                    created
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
                  shares {
                    user {
                      email
                    }
                    created
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
    async parse(result: AxiosResponse<any> | undefined) {
      const all = result?.data?.data?.login?.account?.networks
      if (!all) return
      const parsed: INetwork[] = all.map(n => ({
        ...n,
        created: new Date(n.created),
        serviceIds: n.connections.map(c => c.service.id),
        tags: n.tags.map(t => ({ ...t, created: new Date(t.created) })),
        icon: 'chart-network',
      }))
      // TODO load connection data and merge into connections
      console.log('LOAD NETWORKS', parsed)
      return parsed
    },
    // async handleOrphanedConnections(_, state) {
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
      let network = selectNetwork(state, props.networkId)
      const result = await graphQLAddConnection(props)
      if (result === 'ERROR') return
      const success = result?.data?.data?.addNetworkConnection
      if (!success) {
        dispatch.ui.set({ errorMessage: 'Failed to add connection. Please contact support.' })
        return
      }
      const unique = new Set(network.serviceIds.concat(props.serviceId))
      network.serviceIds = Array.from(unique)
      dispatch.networks.setNetwork(network)
      if (network.enabled && props.enabled) dispatch.networks.enable(network)
    },
    async remove({ serviceId = '', networkId = DEFAULT_ID }: { serviceId?: string; networkId?: string }, state) {
      const joined = selectNetworkByService(state, serviceId)
      let network = selectNetwork(state, networkId)
      const result = await graphQLRemoveConnection(networkId, serviceId)
      if (result === 'ERROR') return
      const success = result?.data?.data?.graphQLRemoveConnection
      if (!success) {
        dispatch.ui.set({ errorMessage: 'Failed to remove connection. Please contact support.' })
        return
      }
      const index = network.serviceIds.indexOf(serviceId)
      network.serviceIds.splice(index, 1)
      dispatch.networks.setNetwork(network)
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

export function selectNetworks(state: ApplicationState): INetwork[] {
  let all = state.networks.all[getActiveAccountId(state)] || []
  return [state.networks.default, ...all]
}

export function selectNetwork(state: ApplicationState, networkId?: string): INetwork {
  return selectNetworks(state).find(n => n.id === networkId) || defaultNetwork
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
