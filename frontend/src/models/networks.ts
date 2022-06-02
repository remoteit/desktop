import { createModel } from '@rematch/core'
import { isPortal } from '../services/Browser'
import { getAccountIds, getActiveAccountId } from './accounts'
import { selectConnections } from '../helpers/connectionHelper'
// import { graphQLBasicRequest } from '../services/graphQL'
// import { AxiosResponse } from 'axios'
import { ApplicationState } from '../store'
import { RootModel } from '.'

const defaultState: INetwork = {
  id: '',
  name: '',
  enabled: false,
  serviceIds: [],
  icon: 'chart-network',
}

const defaultLocalNetwork: INetwork = {
  id: 'default',
  name: 'Local Network',
  enabled: true,
  serviceIds: [],
  icon: 'network-wired',
}

const defaultCloudNetwork: INetwork = {
  id: 'default',
  name: 'Cloud',
  enabled: true,
  serviceIds: [],
  icon: 'cloud',
}

type INetworksAccountState = {
  initialized: boolean
  all: ILookup<INetwork[]>
  default: INetwork
}

const defaultAccountState: INetworksAccountState = {
  initialized: false,
  all: {},
  default: isPortal() ? defaultCloudNetwork : defaultLocalNetwork,
}

export default createModel<RootModel>()({
  state: { ...defaultAccountState },
  effects: dispatch => ({
    async init() {
      await dispatch.networks.fetch()
      dispatch.networks.set({ initialized: true })
    },
    async fetch(_, state) {
      const ids: string[] = getAccountIds(state)
      const all = { [state.auth.user?.id || '']: [state.networks.default] }
      ids.forEach(id => (all[id] = all[id] || []))
      await dispatch.networks.set({ all })
      dispatch.networks.handleOrphanedConnections()
    },
    async handleOrphanedConnections(_, state) {
      const assigned = new Set()
      Object.keys(state.networks.all).forEach(key => {
        state.networks.all[key].forEach(network => {
          network.serviceIds.forEach(id => {
            assigned.add(id)
          })
        })
      })
      const connectionIds = selectConnections(state)
        .filter(c => c.enabled)
        .map(c => c.id)
      const orphaned = connectionIds.filter(id => !assigned.has(id))
      console.log('ORPHANED CONNECTIONS', orphaned)
      dispatch.networks.add({ serviceIds: orphaned })
    },
    async add(
      {
        serviceId = '',
        serviceIds,
        networkId = 'default',
      }: { serviceId?: string; serviceIds?: string[]; networkId?: string },
      state
    ) {
      serviceIds = serviceIds || [serviceId]
      let network = selectNetwork(state, networkId)
      const unique = new Set(network.serviceIds.concat(serviceIds))
      network.serviceIds = Array.from(unique)
      dispatch.networks.setNetwork(network)
    },
    async remove({ serviceId = '', networkId = 'default' }: { serviceId?: string; networkId?: string }, state) {
      let network = selectNetwork(state, networkId)
      const index = network.serviceIds.indexOf(serviceId)
      network.serviceIds.splice(index, 1)
      dispatch.networks.setNetwork(network)
    },
    async setNetwork(params: INetwork, state) {
      const id = getActiveAccountId(state)
      let networks = selectNetworks(state)
      if (params.id) {
        const index = networks.findIndex(network => network.id === params.id)
        if (index >= 0) networks[index] = { ...networks[index], ...params }
      } else {
        const id = Math.floor(Math.random() * 1000000).toString()
        networks.push({ ...params, id })
        dispatch.ui.set({ redirect: `/networks/view/${id}` })
      }
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
  return state.networks.all[getActiveAccountId(state)] || []
}

export function selectNetwork(state: ApplicationState, networkId?: string): INetwork {
  return selectNetworks(state).find(n => n.id === networkId) || defaultState
}

export function selectNetworkByService(state: ApplicationState, serviceId: string = 'default'): INetwork[] {
  return selectNetworks(state).filter(network => network.serviceIds.includes(serviceId))
}
