import { createModel } from '@rematch/core'
import { graphQLRequest, graphQLGetErrors, apiError } from '../services/graphQL'
import { setConnection, getManufacturerType, getManufacturerUser } from '../helpers/connectionHelper'
import { graphQLDisconnect } from '../services/graphQLMutation'
import { accountFromDevice } from './accounts'
import { selectConnections } from '../selectors/connections'
import { ApplicationState } from '../store'
import { isReverseProxy } from './applicationTypes'
import { AxiosResponse } from 'axios'
import { combinedName } from '@common/nameHelper'
import { RootModel } from '.'

type ISessionsState = ILookup<ISession[]> & {
  all: ISession[]
}

const sessionsState: ISessionsState = {
  all: [],
}

export default createModel<RootModel>()({
  state: sessionsState,
  effects: dispatch => ({
    async fetch() {
      try {
        const response = await graphQLRequest(
          ` query Sessions($accountId: String) {
              login {
                account(id: $accountId) {
                  sessions {
                    id
                    timestamp
                    source
                    endpoint {
                      proxy
                      platform
                      manufacturer
                      geo {
                        city
                        stateName
                        countryName
                      }
                    }
                    user {
                      id
                      email
                    }
                    target {
                      id
                      name
                      platform
                      application
                      owner {
                        id
                      }
                      device {
                        id
                        name
                        access {
                          user {
                            id
                          }
                        }
                      }
                    }
                  }
                }
              }
            }`
        )
        graphQLGetErrors(response)
        const all = await dispatch.sessions.parse(response)
        console.log('SESSIONS', all)
        dispatch.sessions.updatePublicConnections(all)
        dispatch.sessions.set({ all })
      } catch (error) {
        await apiError(error)
      }
    },

    /* 
    Sort and filter session data
      - Sort by timestamp
      - Filter out this user's sessions
      - Combine same user sessions
    */
    async parse(response: AxiosResponse | void, state): Promise<ISession[]> {
      if (!response) return []
      const data = response?.data?.data?.login?.account?.sessions
      if (!data) return []
      console.log('SESSION DATA', data)
      const dates = data.map((e: any) => ({ ...e, timestamp: new Date(e.timestamp) }))
      const sorted = dates.sort((a: any, b: any) => a.timestamp - b.timestamp)
      return sorted.reduce((sessions: ISession[], s: any) => {
        // if (!sessions.some(s => s.id === e.user?.id && s.platform === e.endpoint?.platform))
        if (!s.endpoint) return sessions
        const reverseProxy = isReverseProxy(state, s.target.application)
        sessions.push({
          id: s.id,
          reverseProxy,
          manufacturer: getManufacturerType(s.endpoint.manufacturer, reverseProxy),
          timestamp: new Date(s.timestamp),
          source: s.source,
          isP2P: !s.endpoint.proxy,
          platform: s.endpoint.platform,
          user: getManufacturerUser(s.endpoint.manufacturer, reverseProxy) || s.user,
          geo: s.endpoint.geo,
          target: {
            id: s.target.id,
            accountId: accountFromDevice(
              state,
              s.target.owner.id,
              s.target.device.access.map(a => a.user.id)
            ),
            deviceId: s.target.device.id,
            platform: s.target.platform,
            name: combinedName(s.target, s.target.device),
          },
        })
        return sessions
      }, [])
    },

    // updating public proxy connections mainly for portal
    async updatePublicConnections(all: ISession[], state) {
      const publicConnections = state.connections.all.filter(c => c.public && !c.connectLink)
      console.log('PUBLIC CONNECTIONS', publicConnections)
      publicConnections.forEach(connection => {
        const session = all.find(s => s.id === connection.sessionId)
        if (connection.connecting !== false || connection.enabled !== !!session || connection.connected !== !!session) {
          setConnection({ ...connection, connecting: false, enabled: !!session, connected: !!session })
        }
      })
    },

    async disconnect({ id, sessionId }: { id: string; sessionId?: string }) {
      if (!sessionId) {
        console.warn('No sessionId for disconnect')
        return
      }

      const result = await graphQLDisconnect(id, sessionId)

      if (result === 'ERROR') {
        return false
      }

      console.log('PROXY DISCONNECTED', result)
      return true
    },
  }),
  reducers: {
    setSession(state, session: ISession) {
      const index = state.all.findIndex(s => s.id === session.id)
      if (index > -1) state.all[index] = session
      else state.all.push(session)
      return state
    },
    removeSession(state, sessionId: string) {
      const index = state.all.findIndex(s => s.id === sessionId)
      state.all.splice(index, 1)
      return state
    },
    reset(state: ISessionsState) {
      state = sessionsState
      return state
    },
    set(state, params: ILookup<ISession[]>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

export function selectSessionsByService(state: ApplicationState, id?: string) {
  const sessions = state.sessions.all.filter(s => s.target.id === id)
  return sessions
}

export function selectSessionUsers(state: ApplicationState, id?: string) {
  let ids: string[] = []
  const activeSessionIds = selectConnections(state).map(c => c.sessionId)
  return state.sessions.all.reduce((users: IUserRef[], session) => {
    if (
      session.user &&
      !ids.includes(session.user.id) &&
      !activeSessionIds.includes(session.id) &&
      (session.target.id === id || session.target.deviceId === id)
    ) {
      ids.push(session.user.id)
      users.push(session.user)
    }
    return users
  }, [])
}
