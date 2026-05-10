import { createModel } from '@rematch/core'
import { graphQLGetLogs, graphQLGetDeviceLogs, graphQLGetUrl, graphQLGetDeviceUrl } from '../services/graphQLLogs'
import { selectActiveAccountId } from '../selectors/accounts'
import { RootModel } from '.'
import { store } from '../store'

export const DAY_MS = 24 * 60 * 60 * 1000

type ILogState = {
  size: number
  after?: string
  eventTypes?: IEventType[]
  requestId: number
  maxDate?: Date
  minDate?: Date
  fetching: boolean
  fetchingMore: boolean
  eventsUrl: string
  selectedDate?: Date
  planUpgrade: boolean
  events: IEventList
}

const defaultState: ILogState = {
  after: undefined,
  eventTypes: undefined,
  requestId: 0,
  size: 100,
  maxDate: undefined,
  minDate: undefined,
  fetching: false,
  fetchingMore: false,
  eventsUrl: '',
  selectedDate: undefined,
  planUpgrade: false,
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
    async fetch({ allowedDays, deviceId }: { allowedDays: number; deviceId?: string }, state) {
      const { set } = dispatch.logs
      const { size, after, maxDate, minDate, events, eventTypes } = state.logs
      const accountId = selectActiveAccountId(state)
      const existingItems = after ? events.items : []
      const requestId = state.logs.requestId + 1

      after ? set({ fetchingMore: true, requestId }) : set({ fetching: true, requestId })

      let result
      let response: Awaited<ReturnType<typeof graphQLGetDeviceUrl>>

      if (deviceId) {
        response = await graphQLGetDeviceLogs(deviceId, size, after, minDate, maxDate, eventTypes)
        if (response === 'ERROR') {
          if (store.getState().logs.requestId === requestId) set({ fetching: false, fetchingMore: false })
          return
        }
        result = response?.data?.data?.login?.device[0] || {}
      } else {
        response = await graphQLGetLogs(accountId, size, after, minDate, maxDate, eventTypes)
        if (response === 'ERROR') {
          if (store.getState().logs.requestId === requestId) set({ fetching: false, fetchingMore: false })
          return
        }
        result = response?.data?.data?.login?.account || {}
      }

      if (store.getState().logs.requestId !== requestId) return

      const mergedItems = existingItems.concat(result?.events?.items || [])
      const nextEvents = {
        ...result.events,
        items: mergedItems,
      }

      const hasReachedLimit = !nextEvents.hasMore && allowedDays > 0
      const firstLogMs = state.user.created?.getTime() || 0
      const logLimitMs = Date.now() - allowedDays * DAY_MS
      const planUpgrade = hasReachedLimit && firstLogMs < logLimitMs

      set({
        events: nextEvents,
        fetching: false,
        fetchingMore: false,
        planUpgrade,
      })
    },

    async fetchUrl(deviceId: string | undefined, state): Promise<string | undefined> {
      const { minDate, maxDate, eventTypes } = state.logs
      const accountId = selectActiveAccountId(state)

      let result
      let response: Awaited<ReturnType<typeof graphQLGetUrl>>

      if (deviceId) {
        response = await graphQLGetDeviceUrl(deviceId, minDate, maxDate, eventTypes)
        if (response === 'ERROR') return
        result = response?.data?.data?.login?.device[0] || {}
      } else {
        response = await graphQLGetUrl(accountId, minDate, maxDate, eventTypes)
        if (response === 'ERROR') return
        result = response?.data?.data?.login?.account || {}
      }

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
