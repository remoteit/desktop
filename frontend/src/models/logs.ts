import { createModel } from '@rematch/core'
import { graphQLGetErrors, apiError } from '../services/graphQL'
import { graphQLGetLogs, graphQLGetDeviceLogs, graphQLGetUrl, graphQLGetDeviceUrl } from '../services/graphQLLogs'
import { getActiveAccountId } from './accounts'
import { RootModel } from '.'

type ILogState = {
  from: number
  size: number
  maxDate: Date
  minDate: Date
  deviceId?: string
  fetching: boolean
  fetchingMore: boolean
  eventsUrl: string
  selectedDate: Date | null
  planUpgrade: boolean
  daysAllowed: number
  events: IEventList
}

const defaultState: ILogState = {
  from: 0,
  size: 100,
  maxDate: new Date(),
  minDate: new Date(),
  deviceId: undefined,
  fetching: false,
  fetchingMore: false,
  eventsUrl: '',
  selectedDate: null,
  planUpgrade: false,
  daysAllowed: 0,
  events: {
    total: 0,
    items: [],
    hasMore: false,
  },
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async fetch(_: void, globalState) {
      const { set } = dispatch.logs
      const { deviceId, from, size, maxDate, minDate, events } = globalState.logs
      const accountId = getActiveAccountId(globalState)
      let items = from === 0 ? [] : events.items

      from === 0 ? set({ fetching: true }) : set({ fetchingMore: true })

      let result, response
      if (deviceId) {
        response = await graphQLGetDeviceLogs(deviceId, from, size, minDate, maxDate)
        if (response === 'ERROR') return
        result = response?.data?.data?.login?.device[0] || {}
      } else {
        response = await graphQLGetLogs(accountId, from, size, minDate, maxDate)
        if (response === 'ERROR') return
        result = response?.data?.data?.login?.account || {}
      }

      set({
        // eventsUrl,
        events: {
          ...result.events,
          items: items.concat(result?.events?.items || []),
          deviceId,
        },
      })

      from === 0 ? set({ fetching: false }) : set({ fetchingMore: false })
    },

    async fetchUrl(_: void, globalState): Promise<string | undefined> {
      const { deviceId, minDate, maxDate } = globalState.logs
      try {
        let result, response
        if (deviceId) {
          response = await graphQLGetDeviceUrl(deviceId, minDate, maxDate)
          graphQLGetErrors(response)
          result = response?.data?.data?.login?.device[0] || {}
        } else {
          response = await graphQLGetUrl(minDate, maxDate)
          graphQLGetErrors(response)
          result = response?.data?.data?.login || {}
        }
        // const { events, eventsUrl } = result.events
        console.log('LOG URL', result?.eventsUrl)
        return result?.eventsUrl
      } catch (error) {
        await apiError(error)
      }
    },
  }),

  reducers: {
    reset(state: ILogState) {
      state = { ...defaultState }
      return state
    },
    set(state: ILogState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
