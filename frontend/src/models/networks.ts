import { createModel } from '@rematch/core'
import { getAccountIds, getActiveAccountId } from './accounts'
// import { graphQLBasicRequest } from '../services/graphQL'
// import { ApplicationState } from '../store'
// import { AxiosResponse } from 'axios'
import { RootModel } from '.'

export type INetworksState = {
  id: string
  name: string
  enabled: boolean
  serviceIds: string[]
}

const defaultState: INetworksState = {
  id: '',
  name: '',
  enabled: false,
  serviceIds: [],
}

type INetworksAccountState = {
  all: ILookup<INetworksState>
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
      ids.forEach(id => (all[id] = { ...defaultState }))
      await dispatch.networks.set({ all })
    },
    async setActive(params: ILookup<any>, state) {
      const id = getActiveAccountId(state)
      let network = state.networks.all[id]
      Object.keys(params).forEach(key => (network[key] = params[key]))
      dispatch.networks.set({ all: { ...state.networks.all, [id]: network } })
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
