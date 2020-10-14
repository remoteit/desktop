import { graphQLHandleError } from '../services/graphQL'
import { getDevices } from './accounts'
import { hasCredentials } from '../services/remote.it'
import { createModel } from '@rematch/core'
import { graphQLGetEventsURL, graphQLGetMoreLogs } from '../services/graphQLLogs'

const MAX_LOG_LENGTH = 1000

type LogParams = { [key: string]: any }

type ILogState = LogParams & {
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

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async fetchLogs({ id, from, maxDate }: any, globalState: any) {
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

    async getEventsURL({ id, maxDate }: any, globalState: any) {
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
    },
    clear(state: ILogState, id: string) {
      if (state[id]) state[id] = []
    },
    add(state: ILogState, { id, log }: { id: string; log: string }) {
      state[id] = state[id] || []
      // Remove the first item from the array of logs
      // so it doesn't get too long and crash the browser.
      if (state[id].length > MAX_LOG_LENGTH) state[id].shift()
      state[id].push(log)
    },
    set(state: ILogState, params: LogParams) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
    },
  },
})
