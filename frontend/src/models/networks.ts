import { createModel } from '@rematch/core'
import { isPortal } from '../services/Browser'
import { getAccountIds, getActiveAccountId } from './accounts'
import { selectConnections, selectConnection } from '../helpers/connectionHelper'
import { getLocalStorage, setLocalStorage } from '../services/Browser'
import { ApplicationState } from '../store'
import { selectById } from '../models/devices'
// import { graphQLBasicRequest } from '../services/graphQL'
// import { AxiosResponse } from 'axios'
import { RootModel } from '.'

export const DEFAULT_ID = 'local'

const defaultState: INetwork = {
  id: '',
  name: '',
  enabled: false,
  serviceIds: [],
  icon: 'chart-network',
}

const defaultLocalNetwork: INetwork = {
  id: DEFAULT_ID,
  name: 'Local Network',
  enabled: true,
  serviceIds: [],
  icon: 'network-wired',
}

const defaultCloudNetwork: INetwork = {
  id: DEFAULT_ID,
  name: 'Cloud Proxy',
  enabled: true,
  serviceIds: [],
  icon: 'cloud',
}

type INetworksAccountState = {
  initialized: boolean
  all: ILookup<INetwork[]>
  default: INetwork
}

type addProps = { serviceId?: string; serviceIds?: string[]; networkId?: string; disableConnect?: boolean }

const defaultAccountState: INetworksAccountState = {
  initialized: false,
  default: isPortal() ? defaultCloudNetwork : defaultLocalNetwork,
  all: {},
}

export default createModel<RootModel>()({
  state: { ...defaultAccountState },
  effects: dispatch => ({
    async init(_, state) {
      const all = getLocalStorage(state, 'networks') || {}
      const defaultNetwork = getLocalStorage(state, 'networks-default')
      if (defaultNetwork) dispatch.networks.set({ default: defaultNetwork })
      dispatch.networks.set({ all })
      await dispatch.networks.fetch()
      dispatch.networks.set({ initialized: true })
    },
    async fetch(_, state) {
      const ids: string[] = getAccountIds(state)
      let all = state.networks.all
      ids.forEach(id => (all[id] = all[id] || []))
      await dispatch.networks.set({ all })
      dispatch.networks.handleOrphanedConnections()
    },
    async handleOrphanedConnections(_, state) {
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
    },
    async start(serviceId: string, state) {
      const joined = selectNetworkByService(state, serviceId)
      if (!joined.length) dispatch.networks.add({ serviceId })
    },
    async add({ serviceId = '', serviceIds, networkId = DEFAULT_ID, disableConnect }: addProps, state) {
      serviceIds = serviceIds || [serviceId]
      let network = selectNetwork(state, networkId)
      const unique = new Set(network.serviceIds.concat(serviceIds))
      network.serviceIds = Array.from(unique)
      dispatch.networks.setNetwork(network)
      if (network.enabled && !disableConnect) {
        serviceIds.forEach(serviceId => {
          const [service] = selectById(state, serviceId)
          const connection = selectConnection(state, service)
          dispatch.connections.connect(connection)
        })
      }
    },
    async remove({ serviceId = '', networkId = DEFAULT_ID }: { serviceId?: string; networkId?: string }, state) {
      const joined = selectNetworkByService(state, serviceId)
      let network = selectNetwork(state, networkId)
      const index = network.serviceIds.indexOf(serviceId)
      network.serviceIds.splice(index, 1)
      dispatch.networks.setNetwork(network)
      if (joined.length <= 1) {
        const [service] = selectById(state, serviceId)
        const connection = selectConnection(state, service)
        dispatch.connections.disconnect(connection)
      }
    },
    async enable(params: INetwork) {
      const queue = params.serviceIds.map(id => ({ id, enabled: params.enabled }))
      dispatch.connections.queueEnable(queue)
      dispatch.networks.setNetwork({ ...params, enabled: params.enabled })
    },
    async deleteNetwork(params: INetwork, state) {
      const id = getActiveAccountId(state)
      let networks = state.networks.all[id] || []
      const index = networks.findIndex(network => network.id === params.id)
      networks.splice(index, 1)
      dispatch.networks.set({ all: { ...state.networks.all, [id]: [...networks] } })
    },
    async removeById(id: string, state) {
      let { all } = state.networks
      all[DEFAULT_ID] = [state.networks.default]
      const [_, device] = selectById(state, id)
      const serviceIds = id === device?.id ? device?.services.map(s => s.id) : [id]
      Object.keys(all).forEach(key => {
        all[key].forEach(network => {
          const match = network.serviceIds.find(serviceId => serviceIds.includes(serviceId))
          if (match) dispatch.networks.remove({ serviceId: match, networkId: network.id })
        })
      })
    },
    async setNetwork(params: INetwork, state) {
      const id = getActiveAccountId(state)

      if (params.id === DEFAULT_ID) {
        dispatch.networks.set({ default: { ...params } })
        setLocalStorage(state, 'networks-default', params)
        return
      }

      let networks = state.networks.all[id] || []
      if (params.id) {
        const index = networks.findIndex(network => network.id === params.id)
        if (index >= 0) networks[index] = { ...networks[index], ...params }
      } else {
        const id = Math.floor(Math.random() * 1000000).toString()
        networks.push({ ...params, id })
        dispatch.ui.set({ redirect: `/networks/view/${id}` })
      }
      dispatch.networks.set({ all: { ...state.networks.all, [id]: [...networks] } })
      setLocalStorage(state, 'networks', state.networks.all)
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
  return selectNetworks(state).find(n => n.id === networkId) || defaultState
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
