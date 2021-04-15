import { graphQLCatchError } from '../services/graphQL'
import { hasCredentials } from '../services/remote.it'
import { createModel } from '@rematch/core'
import {
  graphQLGetEventsLogs,
  graphQLGetMoreLogs,
} from '../services/graphQLLogs'
import { RootModel } from './rootModel'

const MAX_LOG_LENGTH = 1000

type ILogState = {
  total: number
  fetching: boolean
  fetchingMore: boolean
  from: number
  eventsUrl: string
  events?: IEventList
  maxDate?: string
  minDate?: string
  selectedDate: Date | null
  planUpgrade: boolean
  daysAllowed: number
}

const state: ILogState = {
  total: 0,
  fetching: false,
  fetchingMore: false,
  from: 0,
  eventsUrl: '',
  events: undefined,
  maxDate: new Date().toString(),
  minDate: '',
  selectedDate: null,
  planUpgrade: false,
  daysAllowed: 0
}

export type eventLogs = {
  id: string
  from?: number
  maxDate?: string
  minDate?: string
}

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async fetchLogs({ id, from, maxDate, minDate }: eventLogs, globalState) {
      const { set } = dispatch.logs

      from === 0 ? set({ fetching: true }) : set({ fetchingMore: true })

      set({ maxDate, minDate, from })

      try {
        const gqlResponse = await graphQLGetMoreLogs(id, from, maxDate, minDate)
        const { items } = globalState.logs.events?.deviceId === id ? globalState.logs.events : { items: [] }
        const { device } = gqlResponse?.data?.data?.login || {}
        const events = { ...device[0].events, deviceId: id }
        set({ events: from === 0 ? events : { ...events, items: items.concat(events.items) }, eventsUrl: device[0].eventsUrl })
      } catch (error) {
        await graphQLCatchError(error)
      }

      from === 0 ? set({ fetching: false }) : set({ fetchingMore: false })
    },
    async getEventsLogs({ from, minDate, maxDate }: eventLogs, globalState) {
      const { set } = dispatch.logs
      from === 0 ? set({ fetching: true }) : set({ fetchingMore: true })
      set({ maxDate, minDate, from })
      try {
        const gqlResponse = await graphQLGetEventsLogs(from, minDate, maxDate)
        const {events, eventsUrl} = gqlResponse.data.data?.login
        const { items } = globalState.logs.events || { items: [] }
        set({ events: from === 0 ? events : { ...events, items: items.concat(events.items) }, eventsUrl })
      } catch (error) {
        await graphQLCatchError(error)
      }
      from === 0 ? set({ fetching: false }) : set({ fetchingMore: false })
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
