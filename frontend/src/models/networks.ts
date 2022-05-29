import { createModel } from '@rematch/core'
import { getAccountIds, getActiveAccountId } from './accounts'
// import { graphQLBasicRequest } from '../services/graphQL'
// import { AxiosResponse } from 'axios'
import { ApplicationState } from '../store'
import { RootModel } from '.'

const defaultState: INetwork = {
  id: '',
  name: '',
  enabled: false,
  serviceIds: [],
}

type INetworksAccountState = {
  all: ILookup<INetwork[]>
  initialized: boolean
}

const defaultAccountState: INetworksAccountState = {
  all: {},
  initialized: false,
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
      const all = {}
      ids.forEach(id => (all[id] = []))
      await dispatch.networks.set({ all })
    },
    async setNetwork(params: INetwork, state) {
      const id = getActiveAccountId(state)
      let networks = state.networks.all[id]
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
  return state.networks.all[getActiveAccountId(state)]
}

export function selectNetwork(state: ApplicationState, networkId?: string): INetwork {
  return selectNetworks(state)?.find(n => n.id === networkId) || defaultState
}
