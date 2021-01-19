import { graphQLHandleError } from '../services/graphQL'
import { getDevices } from './accounts'
import { hasCredentials } from '../services/remote.it'
import { createModel } from '@rematch/core'
import { graphQLGetEventsURL, graphQLGetMoreLogs } from '../services/graphQLLogs'
import { RootModel } from './rootModel'

const MAX_LOG_LENGTH = 1000

type ILogState = {
  total: number
  fetching: boolean
  fetchingMore: boolean
  from: number
  eventsUrl: string
}

const state: ILogState = {
  total: 0,
  fetching: false,
  fetchingMore: false,
  from: 0,
  eventsUrl: '',
}

type eventLogs = {
  id: string
  from?: number
  maxDate?: string
}

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async fetchLogs(data: eventLogs, globalState: any) {
      const { id, from, maxDate } = data
      const { set } = dispatch.logs
      const all = getDevices(globalState)
      if (!hasCredentials()) return
      from === 0 ? set({ fetching: true }) : set({ fetchingMore: true })
      try {
        const gqlResponse = await graphQLGetMoreLogs(id, from, maxDate)
        const { events } = gqlResponse?.data?.data?.login?.device[0] || {}
        const device: IDevice[] = all
          .filter((d: IDevice) => d.id === id)
          .map((_d: IDevice) => {
            const items = from === 0 ? events.items : _d.events.items.concat(events.items)
            return { ..._d, events: { ...events, items } }
          })
        dispatch.accounts.setDevice({ id, device: device[0] })
      } catch (error) {
        await graphQLHandleError(error)
      }
      from === 0 ? set({ fetching: false }) : set({ fetchingMore: false })
    },
    async getEventsURL(data: eventLogs) {
      const { id, maxDate } = data
      const { set } = dispatch.logs

      if (!hasCredentials()) return
      try {
        const gqlResponse = await graphQLGetEventsURL(id, maxDate)
        const { device } = gqlResponse?.data?.data?.login || {}
        const { eventsUrl } = device[0]
        set({ eventsUrl: eventsUrl })
      } catch (error) {
        await graphQLHandleError(error)
      }
    },
  }),

  reducers: {
    reset(state: ILogState) {
      //state = {}
      return state
    },
    clear(state: ILogState, id: string) {
      if (state[id]) state[id] = []
      return state
    },
    add(state: ILogState, { id, log }: { id: string; log?: string }) {
      state[id] = state[id] || []
      // Remove the first item from the array of logs
      // so it doesn't get too long and crash the browser.
      if (state[id].length > MAX_LOG_LENGTH) state[id].shift()
      state[id].push(log)
      return state
    },
    set(state: ILogState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
