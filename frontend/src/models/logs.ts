import { createModel } from '@rematch/core'
import { graphQLGetLogs, graphQLGetDeviceLogs, graphQLGetUrl, graphQLGetDeviceUrl } from '../services/graphQLLogs'
import { selectActiveAccountId } from '../selectors/accounts'
import { RootModel } from '.'

const DAY_MS = 24 * 60 * 60 * 1000

const toTimestamp = (value?: Date | string) => (value ? new Date(value).getTime() : undefined)

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const evaluateRetention = ({
  items,
  minDate,
  hasMore,
  allowedDays,
}: {
  items: IEvent[]
  minDate?: Date
  hasMore?: boolean
  allowedDays: number
}) => {
  const minDateMs = toTimestamp(minDate)
  const oldestMs = toTimestamp(items[items.length - 1]?.timestamp)
  const boundaryReady = Boolean(items.length && !hasMore && minDateMs !== undefined && oldestMs !== undefined)
  if (!boundaryReady) return { reached: false, near: false }

  const reached = oldestMs! <= minDateMs!
  const thresholdDays = clamp(allowedDays > 0 ? allowedDays * 0.1 : 1, 0.25, 1)
  const near = !reached && oldestMs! - minDateMs! <= thresholdDays * DAY_MS

  return { reached, near }
}

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
      const { deviceId, size, after, maxDate, minDate, events, daysAllowed } = state.logs
      const accountId = selectActiveAccountId(state)
      const existingItems = after ? events.items : []

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

      const mergedItems = existingItems.concat(result?.events?.items || [])
      const nextEvents = {
        ...result.events,
        items: mergedItems,
        deviceId,
      }

      const { reached, near } = evaluateRetention({
        items: mergedItems,
        minDate,
        hasMore: nextEvents.hasMore,
        allowedDays: daysAllowed,
      })

      set({
        events: nextEvents,
        fetching: false,
        fetchingMore: false,
        planUpgrade: reached || near,
      })
    },

    async fetchUrl(_: void, state): Promise<string | undefined> {
      const { deviceId, minDate, maxDate } = state.logs
      const accountId = selectActiveAccountId(state)

      let result
      let response: Awaited<ReturnType<typeof graphQLGetUrl>>

      if (deviceId) {
        response = await graphQLGetDeviceUrl(deviceId, minDate, maxDate)
        if (response === 'ERROR') return
        result = response?.data?.data?.login?.device[0] || {}
      } else {
        response = await graphQLGetUrl(accountId, minDate, maxDate)
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
