import { createModel } from '@rematch/core'
import {
  fetchAuthorizedAgents,
  revokeAuthorizedAgent,
  graphQLGetAgentScopes,
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
        // The list comes from the Hydra front (/consents); the per-agent reach limits from graphql.
        // Each source is independently resilient so one failing never hangs the screen (or hides the
        // other's data) — a failure logs and yields an empty result rather than throwing.
        const [result, scopeResult] = await Promise.all([fetchAuthorizedAgents(), graphQLGetAgentScopes()])

        const reach: { [clientId: string]: IAgentReach } = {}
        if (scopeResult && scopeResult !== 'ERROR') {
          const scopes: IAgentReach[] = scopeResult.data?.data?.login?.agentScopes || []
          scopes.forEach(scope => (reach[scope.clientId] = scope))
        }

        dispatch.agents.set({
          agents: result.agents.map(agent => ({ ...agent, reach: reach[agent.clientId] })),
          accessTokenTtlSeconds: result.accessTokenTtlSeconds,
        })
      } catch (error) {
        console.error('CONNECTED APPS: fetch failed', error)
      } finally {
        dispatch.agents.set({ fetching: false })
      }
    },
    async revoke(clientId: string) {
      dispatch.agents.set({ updating: clientId })
      await revokeAuthorizedAgent(clientId)
      await dispatch.agents.fetch()
      dispatch.agents.set({ updating: undefined })
    },
    async setLimit(params: { clientId: string; accounts: string[] | null; tags: string[] | null; operator: ITagOperator }) {
      dispatch.agents.set({ updating: params.clientId })
      const result = await graphQLSetAgentScope(params.clientId, params.accounts, params.tags, params.operator)
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
