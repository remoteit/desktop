import { createModel } from '@rematch/core'
import { graphQLRequest, graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { getConnectionSessionIds, connectionName } from '../helpers/connectionHelper'
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
        dispatch.sessions.set({ all })
      } catch (error) {
        await graphQLCatchError(error)
      }
    },

    /* 
    Sort and filter session data
      - Sort by timestamp
      - Filter out this user's sessions
      - Combine same user sessions
    */
    async parse(response: AxiosResponse<any> | undefined): Promise<ISession[]> {
      const data = response?.data?.data?.login?.sessions
      console.log('SESSION DATA', data)
      const dates = data.map((e: any) => ({ ...e, timestamp: new Date(e.timestamp) }))
      const sorted = dates.sort((a: any, b: any) => a.timestamp - b.timestamp)
      return sorted.reduce((sessions: ISession[], e: any) => {
        if (!sessions.some(s => s.id === e.user?.id && s.platform === e.endpoint?.platform))
          sessions.push({
            id: e.id,
            timestamp: new Date(e.timestamp),
            platform: e.endpoint?.platform,
            user: e.user,
            geo: e.endpoint?.geo,
            target: {
              id: e.target.id,
              deviceId: e.target.device.id,
              platform: e.target.platform,
              name: connectionName(e.target, e.target.device),
            },
          })
        return sessions
      }, [])
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
  return state.sessions.all.reduce((users: IUserRef[], session) => {
    if (session.target.id === id || session.target.deviceId === id) users.push(session.user)
    return users
  }, [])
}

/* 
export function getCnnected(services?: IService[]) {
  const connected: IUser[] = []
  services?.forEach(s => s.sessions.forEach(session => !connected.includes(session) && connected.push(session)))
  return connected
}
 */
