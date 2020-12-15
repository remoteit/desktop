import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import { graphQLRequest, graphQLGetErrors, graphQLHandleError } from '../services/graphQL'
import { hasCredentials } from '../services/remote.it'
import { RootModel } from './rootModel'
import { add as addDate, set as setDate, differenceInDays, eachDayOfInterval, set } from 'date-fns'
import { getTimeZone } from '../helpers/dateHelper'

const MAX_DEVICE_LENGTH = 1000

interface IAnalyticsDevice {
  id: string
  name: string
  quality: 'GOOD' | 'MODERATE' | 'POOR' | 'UNKNOWN'
  createdAt: Date
}
interface ITimeSeriesData {
  x: Date
  y: number
}
type IAnalyticsState = ILookup<any> & {
  fetching: boolean
  startDate?: Date
  endDate?: Date
  from: number
  size: number
  totalDevices: number
  last30DaysDevices: number
  last30DaysConnections: number
  devices: IAnalyticsDevice[]
  deviceTimeseries: ITimeSeriesData[]
  connectionTimeseries: ITimeSeriesData[]
}

const state: IAnalyticsState = {
  fetching: false,
  from: 0,
  size: 2,
  startDate: setDate(new Date().setMonth(new Date().getMonth() - 1), {
    date: 1,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  }),
  endDate: setDate(new Date().setDate(0), { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 }),
  totalDevices: 0,
  last30DaysDevices: 0,
  last30DaysConnections: 0,
  devices: [],
  deviceTimeseries: [],
  connectionTimeseries: [],
}
type analyticsGQOptions = {
  size: number
  from: number
  start: Date
  end: Date
  timeZone: string
}

export default createModel<RootModel>()({
  state,
  effects: (dispatch: any) => ({
    async fetchAnalytics(_: void, rootState: any) {
      if (!hasCredentials()) return
      const { from, size, startDate, endDate } = rootState.analytics
      const { getAnalytics, set, primeGraphTimeseries } = dispatch.analytics
      set({ fetching: true })
      const timeZone = getTimeZone()
      const monthStart = setDate(new Date().setMonth(new Date().getMonth() - 1), {
        date: 1,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      })
      const monthEnd = endDate
      console.log(rootState)
      if (startDate != monthStart) {
        const monthEnd = setDate(new Date().setDate(0), { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 })
        const primedGraphTimeseries = primeGraphTimeseries({ startDate: monthStart, endDate: monthEnd })
        set({
          from: 0,
          startDate: monthStart,
          endDate: monthEnd,
          totalDevices: 0,
          totalConnections: 0,
          last30DaysDevices: 0,
          last30DaysConnections: 0,
          devices: [],
          connections: [],
          deviceTimeseries: primedGraphTimeseries,
          connectionTimeseries: primedGraphTimeseries,
        })
      }
      getAnalytics({ from, size, start: monthStart, end: monthEnd, timeZone })
    },
    async getAnalytics({ from, size, start, end, timeZone }: analyticsGQOptions) {
      const options = { from, size, start, end, timeZone }
      const { parse } = dispatch.analytics
      try {
        const result = await graphQLRequest(
          `query($from: Int, $size: Int, $start: DateTime, $end: DateTime, $timezone: String) {
             login {
              devices(size: $size, from: $from, owner: true) {
                total
                hasMore
                items {
                  id
                  name
                  created
                  services {
                    id
                    name
                    type
                    endpoint {
                      quality
                    }
                    timeSeries(type: CONNECT, start: $start, end: $end, resolution: DAY, timezone: $timezone) {
                      data
                    }
                  }
                }
              }
            }
          }`,
          options
        )
        graphQLGetErrors(result)
        parse(result)
      } catch (error) {
        await graphQLHandleError(error)
      }
    },
    parse(gqlResponse: any, globalState: ApplicationState) {
      const gqlData = gqlResponse?.data?.data?.login
      const { from, size, startDate, endDate, devices } = globalState.analytics
      const { set, primeGraphTimeseries, fetchAnalytics } = dispatch.analytics
      const primedGraphTimeseries = primeGraphTimeseries({
        start: startDate,
        end: endDate,
      })
      if (!gqlData) {
        const newState = set({
          fetching: false,
          from: 0,
          totalDevices: 0,
          totalConnections: 0,
          last30DaysDevices: 0,
          last30DaysConnections: 0,
          devices: [],
          connections: [],
          deviceTimeSeries: primedGraphTimeseries,
          connectionTimeSeries: primedGraphTimeseries,
        })
        return
      }
      let currentDeviceList = devices
      const updatedDevices: IAnalyticsDevice[] =
        currentDeviceList && currentDeviceList.length > 0
          ? currentDeviceList.concat(gqlData.devices.items)
          : gqlData.devices.items

      set({ from: from + size, devices: updatedDevices })
      if (gqlData.devices.hasMore) {
        //fetchAnalytics()
        return
      }
      //iterate over devices to put them in a timeseries & calculate connections
      let last30DaysDevices,
        last30DaysConnections = 0
      let periodConnections = []
      //add to the devices in this period
      if (primedGraphTimeseries && primedGraphTimeseries.length > 0) {
        let connectionTimeseries = primedGraphTimeseries
        const deviceTimeseries = primedGraphTimeseries.map((x, y) => {
          globalState.analytics.devices.map(d => {
            if ((x = d.created)) {
              y = +1
              last30DaysDevices += 1
            }
            if (d.timesSeries && d.timeSeries.data.size > 0) {
              d.timeSeries.data.map((c, i) => {
                connectionTimeseries[i].y += c
                last30DaysConnections += c
              })
            }
          })
        })

        //need to get only the devices in the date range
        const totalDevices = gqlData.devices.total
        set({
          totalDevices: totalDevices,
          fetching: false,
          last30DaysConnections,
          last30DaysDevices,
          deviceTimeseries,
          connectionTimeseries,
        })
      }
    },
    primeGraphTimeseries({ start, end }) {
      //make an array of graph objects for each day in the month
      if (start && end) {
        const daysInMonth = eachDayOfInterval({
          start,
          end,
        })
        const initTimeSeries = daysInMonth.map(d => {
          return { x: d, y: 0 }
        })
        return initTimeSeries
      }
    },
  }),
  reducers: {
    set(state: IAnalyticsState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
