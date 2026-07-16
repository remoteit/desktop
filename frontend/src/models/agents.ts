import { createModel } from '@rematch/core'
import {
  graphQLGetConnectedApps,
  graphQLRevokeAgent,
  graphQLSetAgentScope,
  graphQLClearAgentScope,
} from '../services/agents'
import { RootModel } from '.'

type IAgentsState = {
  init: boolean
  fetching: boolean
  updating?: string // the clientId currently being revoked / limited (per-row spinner)
  agents: IAuthorizedAgent[]
  accessTokenTtlSeconds: number // how long a revoked agent's in-flight token still works
}

const defaultState: IAgentsState = {
  init: false,
  fetching: false,
  updating: undefined,
  agents: [],
  accessTokenTtlSeconds: 300,
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async init(_: void, globalState) {
      if (globalState.agents.init) return
      await dispatch.agents.fetch()
      dispatch.agents.set({ init: true })
    },
    async fetch() {
      dispatch.agents.set({ fetching: true })
      try {
        // One call: graphql's Connected Apps façade returns the agent list (it queries the Hydra
        // front on our behalf) already merged with reach + last-active.
        const result = await graphQLGetConnectedApps()
        if (result && result !== 'ERROR') {
          const connectedApps = result.data?.data?.login?.connectedApps
          dispatch.agents.set({
            agents: connectedApps?.agents || [],
            accessTokenTtlSeconds: connectedApps?.accessTokenTtlSeconds || 300,
          })
        }
      } catch (error) {
        console.error('CONNECTED APPS: fetch failed', error)
      } finally {
        dispatch.agents.set({ fetching: false })
      }
    },
    async revoke(clientId: string) {
      dispatch.agents.set({ updating: clientId })
      await graphQLRevokeAgent(clientId)
      await dispatch.agents.fetch()
      dispatch.agents.set({ updating: undefined })
    },
    async setLimit(params: { clientId: string; accounts: IAccountReach[] | null }) {
      dispatch.agents.set({ updating: params.clientId })
      const result = await graphQLSetAgentScope(params.clientId, params.accounts)
      if (result !== 'ERROR') await dispatch.agents.fetch()
      dispatch.agents.set({ updating: undefined })
    },
    async clearLimit(clientId: string) {
      dispatch.agents.set({ updating: clientId })
      const result = await graphQLClearAgentScope(clientId)
      if (result !== 'ERROR') await dispatch.agents.fetch()
      dispatch.agents.set({ updating: undefined })
    },
  }),
  reducers: {
    reset(state: IAgentsState) {
      state = { ...defaultState }
      return state
    },
    set(state: IAgentsState, params: Partial<IAgentsState>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
