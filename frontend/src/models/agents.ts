import { createModel } from '@rematch/core'
import { accountApps, revokeAccountApp } from '../services/permitteerAccount'
import { RootModel } from '.'

type IAgentsState = {
  init: boolean
  fetching: boolean
  updating?: string // the grant id currently being revoked (drives the revoke button spinner)
  agents: IAuthorizedAgent[]
  // The session's token predates the connected-apps permission slice: one fresh sign-in
  // (silent SSO — the AS session is alive) re-mints the grant with it. Drives the notice.
  needsReauth: boolean
}

const defaultState: IAgentsState = {
  init: false,
  fetching: false,
  updating: undefined,
  agents: [],
  needsReauth: false,
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
        // Direct to the AS's account API (desktop-login plan D6): the grant list IS the
        // connected apps list — names, logos, per-action detail and revocation reach
        // included. Only apps that were actually granted appear; first-party skip-consent
        // surfaces (this app itself) rightly do not list themselves.
        const result = await accountApps()
        if (result.status === 200 && result.body) {
          dispatch.agents.set({ agents: result.body.items ?? [], needsReauth: false })
        } else if (result.status === 401 || result.status === 403) {
          dispatch.agents.set({ needsReauth: true })
        }
      } catch (error) {
        console.error('CONNECTED APPS: fetch failed', error)
      } finally {
        dispatch.agents.set({ fetching: false })
      }
    },
    async revoke(grantId: string) {
      dispatch.agents.set({ updating: grantId })
      await revokeAccountApp(grantId)
      await dispatch.agents.fetch()
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
