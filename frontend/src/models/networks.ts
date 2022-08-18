import { createModel } from '@rematch/core'
import { isPortal } from '../services/Browser'
import { getActiveAccountId, getActiveUser } from './accounts'
import { selectConnection, selectEnabledConnections } from '../helpers/connectionHelper'
import { ApplicationState } from '../store'
import { selectById } from '../models/devices'
import {
  graphQLAddNetwork,
  graphQLDeleteNetwork,
  graphQLUpdateNetwork,
  graphQLAddConnection,
  graphQLRemoveConnection,
  graphQLAddNetworkShare,
  graphQLRemoveNetworkShare,
} from '../services/graphQLMutation'
import { graphQLBasicRequest } from '../services/graphQL'
import { graphQLDeviceAdaptor, graphQLServiceAdaptor, DEVICE_SELECT, SERVICE_SELECT } from '../services/graphQLDevice'
import { AxiosResponse } from 'axios'
import { RootModel } from '.'

export const DEFAULT_ID = 'local'

const defaultLocalNetwork: INetwork = {
  ...defaultNetwork(),
  id: DEFAULT_ID,
  name: 'Connections',
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
      dispatch.networks.set({ default: defaultNetwork(state) })
      await dispatch.networks.fetch()
      dispatch.networks.set({ initialized: true })
    },
    async fetch(_: void, state) {
      const accountId = getActiveAccountId(state)
      const result = await graphQLBasicRequest(
        ` query Networks($account: String) {
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
                      ${SERVICE_SELECT}
                      device {
                        ${DEVICE_SELECT}
                      }
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

      dispatch.networks.parse(result)
    },

    async fetchIfEmpty(_: void, state) {
      const accountId = getActiveAccountId(state)
      if (!state.networks.all[accountId]) dispatch.networks.fetch()
    },

    async parse(result: AxiosResponse<any> | undefined, state) {
      const accountId = getActiveAccountId(state)
      const all = result?.data?.data?.login?.account?.networks
      if (!all) return

      let devices: IDevice[] = []

      const parsed: INetwork[] = all.map(n => {
        const shared = accountId !== n.owner.id

        // add network devices - otherwise they are loaded through connections query
        n.connections.forEach(c => {
          let netDevice: IDevice = {
            ...graphQLDeviceAdaptor([{ ...c.service.device, permissions: n.permissions }], '', accountId, true)[0],
            services: [c.service],
          }
          netDevice.services = graphQLServiceAdaptor(netDevice)
          const index = devices.findIndex(d => d.id === netDevice.id)

          if (index === -1) {
            devices.push(netDevice)
          } else {
            devices[index].services.push(netDevice.services[0])
          }
        })

        return {
          shared,
          id: n.id,
          name: n.name,
          enabled: n.enabled,
          owner: n.owner,
          permissions: n.permissions,
          created: new Date(n.created),
          serviceIds: n.connections.map(c => c.service.id),
          access: n.access.map(s => ({ email: s.user.email, id: s.user.id })),
          tags: n.tags.map(t => ({ ...t, created: new Date(t.created) })),
          icon: 'chart-network',
        }
      })

      // TODO load connection data and merge into connections
      //      don't load all data if in portal mode
      console.log('LOAD NETWORKS', parsed, devices)

      dispatch.accounts.mergeDevices({ devices, accountId: 'networks' })
      dispatch.networks.setNetworks(parsed)
    },
    async enable(params: INetwork) {
      const queue = params.serviceIds.map(id => ({ id, enabled: params.enabled }))
      dispatch.connections.queueEnable(queue)
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
      const response = await graphQLAddNetwork(params, id)
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
            ? `${emails.length} accounts successfully shared to ${network.name}.`
            : `${network.name} successfully shared to ${emails[0]}.`,
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
        dispatch.networks.setNetworks(networks)
      }
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
    shared: false,
    owner: { id: '', email: '' },
    permissions: ['VIEW', 'CONNECT', 'MANAGE', 'ADMIN'],
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

export function selectActiveNetwork(state: ApplicationState): INetwork {
  const active = selectEnabledConnections(state).map(connection => connection.id)
  const network = defaultNetwork(state)
  network.serviceIds = active
  return network
}

export function selectNetworkByService(state: ApplicationState, serviceId: string = DEFAULT_ID): INetwork[] {
  return selectNetworks(state).filter(network => network.serviceIds.includes(serviceId))
}

export function inNetworkOnly(state: ApplicationState, serviceId?: string): boolean {
  return !selectNetworkByService(state, serviceId).find(n => !n.shared)
}

export function getNetworkServiceIds(state: ApplicationState): string[] {
  const networks = selectNetworks(state)
  let serviceIds: string[] = []
  networks.forEach(network => (serviceIds = serviceIds.concat(network.serviceIds)))
  return serviceIds
}
