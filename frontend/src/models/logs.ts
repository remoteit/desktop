import { createModel } from '@rematch/core'
import { graphQLGetLogs, graphQLGetDeviceLogs, graphQLGetUrl, graphQLGetDeviceUrl } from '../services/graphQLLogs'
import { selectActiveAccountId } from '../selectors/accounts'
import { RootModel } from '.'

type ILogState = {
  size: number
  after?: string
  maxDate?: Date
  minDate?: Date
  deviceId?: string
  fetching: boolean
  fetchingMore: boolean
  eventsUrl: string
  selectedDate?: Date
  planUpgrade: boolean
  daysAllowed: number
  events: IEventList
}

const defaultState: ILogState = {
  after: undefined,
  size: 100,
  maxDate: undefined,
  minDate: undefined,
  deviceId: undefined,
  fetching: false,
  fetchingMore: false,
  eventsUrl: '',
  selectedDate: undefined,
  planUpgrade: false,
  daysAllowed: 0,
  events: {
    total: 0,
    last: '',
    items: [],
    hasMore: false,
  },
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async fetch(_: void, state) {
      const { set } = dispatch.logs
      const { deviceId, size, after, maxDate, minDate, events } = state.logs
      const accountId = selectActiveAccountId(state)
      let items = after ? events.items : []

      after ? set({ fetchingMore: true }) : set({ fetching: true })

      let result
      let response: Awaited<ReturnType<typeof graphQLGetDeviceUrl>>

      if (deviceId) {
        response = await graphQLGetDeviceLogs(deviceId, size, after, minDate, maxDate)
        if (response === 'ERROR') return
        result = response?.data?.data?.login?.device[0] || {}
      } else {
        response = await graphQLGetLogs(accountId, size, after, minDate, maxDate)
        if (response === 'ERROR') return
        result = response?.data?.data?.login?.account || {}
      }

      set({
        events: {
          ...result.events,
          items: items.concat(result?.events?.items || []),
          deviceId,
        },
      })

      set({ fetching: false, fetchingMore: false })
    },

    async fetchUrl(_: void, state): Promise<string | undefined> {
      const { deviceId, minDate, maxDate } = state.logs

      let result
      let response: Awaited<ReturnType<typeof graphQLGetDeviceUrl>>

      if (deviceId) {
        response = await graphQLGetDeviceUrl(deviceId, minDate, maxDate)
        if (response === 'ERROR') return
        result = response?.data?.data?.login?.device[0] || {}
      } else {
        response = await graphQLGetUrl(minDate, maxDate)
        if (response === 'ERROR') return
        result = response?.data?.data?.login || {}
      }
      // const { events, eventsUrl } = result.events
      console.log('LOG URL', result?.eventsUrl)
      return result?.eventsUrl
    },
  }),

  reducers: {
    reset(state: ILogState) {
      state = { ...defaultState }
      return state
    },
    set(state: ILogState, params: Partial<ILogState>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
