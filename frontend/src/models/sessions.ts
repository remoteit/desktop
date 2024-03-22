import { State } from '../store'
import { createModel } from '@rematch/core'
import { getAccountIds } from './accounts'
import { graphQLFetchSessions } from '../services/graphQLRequest'
import { setConnection, getManufacturerType, getManufacturerUser } from '../helpers/connectionHelper'
import { graphQLDisconnect } from '../services/graphQLMutation'
import { accountFromDevice } from './accounts'
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
    async fetch(_: void, state) {
      const ids: string[] = getAccountIds(state)
      const result = await graphQLFetchSessions(ids)
      if (result === 'ERROR') return

      const all = await dispatch.sessions.parse({ result, ids })
      console.log('SESSIONS', all)
      dispatch.sessions.updatePublicConnections(all)
      dispatch.sessions.set({ all })
    },

    async parse({ result, ids }: { result: AxiosResponse<any> | undefined; ids: string[] }): Promise<ISession[]> {
      if (!result) return []
      const data = result?.data?.data?.login
      let all: ISession[] = []
      for (let index = 0; index < ids.length; index++) {
        const accountId = ids[index]
        if (!data?.[`_${index}`]) continue
        const { sessions } = data[`_${index}`]
        const parsed = await dispatch.sessions.parseSessions({ data: sessions, accountId })
        all = all.concat(parsed)
      }
      return all
    },

    /* 
    Sort and filter session data
      - Sort by timestamp
      - Filter out this user's sessions
      - Combine same user sessions
    */
    async parseSessions({ data, accountId }: { data: any; accountId: string }, state): Promise<ISession[]> {
      if (!data) return []
      const dates = data.map((e: any) => ({ ...e, timestamp: new Date(e.timestamp) }))
      const sorted = dates.sort((a: any, b: any) => a.timestamp - b.timestamp)
      return sorted.reduce((sessions: ISession[], s: any) => {
        // if (!sessions.some(s => s.id === e.user?.id && s.platform === e.endpoint?.platform))
        if (!s.endpoint) return sessions
        const reverseProxy = isReverseProxy(state, s.target.application)
        // const accountIdFromDevice = accountFromDevice(
        //   state,
        //   s.target.owner.id,
        //   s.target.device.access.map(a => a.user.id)
        // )
        // if (accountIdFromDevice !== accountId) console.warn('ACCOUNT MISMATCH', accountId, accountIdFromDevice, s)
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
            accountId,
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

export function selectSessionsByService(state: State, id?: string) {
  const sessions = state.sessions.all.filter(s => s.target.id === id)
  return sessions
}
