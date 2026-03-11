import { createModel } from '@rematch/core'
import {
  graphQLGetConnectionUsage,
  graphQLGetLogs,
  graphQLGetDeviceConnectionUsage,
  graphQLGetDeviceLogs,
  graphQLGetUrl,
  graphQLGetDeviceUrl,
} from '../services/graphQLLogs'
import { selectActiveAccountId } from '../selectors/accounts'
import { RootModel } from '.'

const DAY_MS = 24 * 60 * 60 * 1000

type IConnectionUsageEvent = {
  timestamp: Date
  state?: string
  session?: string
  txBytes?: number
  rxBytes?: number
  lifetime?: number
  actor?: { email?: string }
  target?: { id?: string }[]
}

const usageKey = (event: Pick<IEvent, 'timestamp' | 'state' | 'actor' | 'target'>) =>
  [
    new Date(event.timestamp).toISOString(),
    event.state || '',
    event.actor?.email || '',
    event.target?.[0]?.id || '',
  ].join('|')

const mergeUsage = (items: IEvent[], usageItems: IConnectionUsageEvent[]) => {
  if (!usageItems.length) return items

  const usageMap = new Map(usageItems.map(item => [usageKey(item as IEvent), item]))

  return items.map(item => {
    if (item.type !== 'DEVICE_CONNECT') return item

    const usage = usageMap.get(usageKey(item))
    if (!usage) return item

    return {
      ...item,
      txBytes: usage.txBytes,
      rxBytes: usage.rxBytes,
      lifetime: usage.lifetime,
    }
  })
}

type ILogState = {
  size: number
  after?: string
  eventTypes?: IEventType[]
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

      after ? set({ fetchingMore: true }) : set({ fetching: true })

      let result
      let response: Awaited<ReturnType<typeof graphQLGetDeviceUrl>>
      let usageItems: IConnectionUsageEvent[] = []

      if (deviceId) {
        const [logsResponse, usageResponse] = await Promise.all([
          graphQLGetDeviceLogs(deviceId, size, after, minDate, maxDate, eventTypes),
          graphQLGetDeviceConnectionUsage(deviceId, size, after, minDate, maxDate),
        ])
        response = logsResponse
        if (response === 'ERROR') return
        result = response?.data?.data?.login?.device[0] || {}
        if (usageResponse !== 'ERROR') {
          usageItems = usageResponse?.data?.data?.login?.device[0]?.events?.items || []
        }
      } else {
        const [logsResponse, usageResponse] = await Promise.all([
          graphQLGetLogs(accountId, size, after, minDate, maxDate, eventTypes),
          graphQLGetConnectionUsage(accountId, size, after, minDate, maxDate),
        ])
        response = logsResponse
        if (response === 'ERROR') return
        result = response?.data?.data?.login?.account || {}
        if (usageResponse !== 'ERROR') {
          usageItems = usageResponse?.data?.data?.login?.account?.events?.items || []
        }
      }

      const mergedItems = mergeUsage(existingItems.concat(result?.events?.items || []), usageItems)
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
