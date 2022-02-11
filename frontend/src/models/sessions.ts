import { createModel } from '@rematch/core'
import { graphQLRequest, graphQLGetErrors, apiError } from '../services/graphQL'
import { findLocalConnection, setConnection } from '../helpers/connectionHelper'
import { combinedName } from '../shared/nameHelper'
import { ApplicationState } from '../store'
import { AxiosResponse } from 'axios'
import { RootModel } from './rootModel'

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
          ` {
              login {
                sessions {
                  id
                  timestamp
                  endpoint {
                    proxy
                    platform
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
                    device {
                      id
                      name
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
    async parse(response: AxiosResponse | void, globalState): Promise<ISession[]> {
      if (!response) return []
      const data = response?.data?.data?.login?.sessions
      if (!data) return []
      console.log('SESSION DATA', data)
      const dates = data.map((e: any) => ({ ...e, timestamp: new Date(e.timestamp) }))
      const sorted = dates.sort((a: any, b: any) => a.timestamp - b.timestamp)
      return sorted.reduce((sessions: ISession[], e: any) => {
        // if (!sessions.some(s => s.id === e.user?.id && s.platform === e.endpoint?.platform))
        const connection = findLocalConnection(globalState, e.target.id, e.id)
        sessions.push({
          id: e.id,
          timestamp: new Date(e.timestamp),
          isP2P: e.endpoint ? !e.endpoint?.proxy : undefined,
          platform: e.endpoint?.platform,
          user: e.user,
          geo: e.endpoint?.geo,
          public: !!connection?.public,
          target: {
            id: e.target.id,
            deviceId: e.target.device.id,
            platform: e.target.platform,
            name: combinedName(e.target, e.target.device),
          },
        })
        return sessions
      }, [])
    },
    async updatePublicConnections(all: ISession[], globalState) {
      const publicConnections = globalState.connections.all.filter(c => c.public)
      console.log('PUBLIC CONNECTIONS', publicConnections)
      publicConnections.forEach(connection => {
        const session = all.find(s => s.id === connection.sessionId)
        connection.connecting = false
        connection.enabled = !!session
        connection.connected = !!session
        setConnection(connection)
      })
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
  return state.sessions.all.reduce((users: IUserRef[], session) => {
    if (
      session.user &&
      !ids.includes(session.user.id) &&
      (session.target.id === id || session.target.deviceId === id)
    ) {
      ids.push(session.user.id)
      users.push(session.user)
    }
    return users
  }, [])
}
