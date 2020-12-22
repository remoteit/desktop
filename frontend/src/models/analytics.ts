import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import { graphQLRequest, graphQLGetErrors, graphQLHandleError } from '../services/graphQL'
import { hasCredentials } from '../services/remote.it'
import { RootModel } from './rootModel'
import { set as setDate, eachDayOfInterval, isSameDay, isEqual, set } from 'date-fns'
import { getTimeZone } from '../helpers/dateHelper'
import { startOfDay } from 'date-fns/esm'

const MAX_DEVICE_LENGTH = 1000

export interface IAnalyticsDevice {
  id: string
  name: string
  quality: 'GOOD' | 'MODERATE' | 'POOR' | 'UNKNOWN'
  createdAt: Date
  qualitySort: number
}
export enum QualityType {
  'GOOD' = 3,
  'MODERATE' = 2,
  'POOR' = 1,
  'UNKNOWN' = 0,
}
export interface IDateOptions {
  start: Date
  end: Date
}
export interface ITimeSeriesData {
  date: Date
  count: number
}

type IAnalyticsState = ILookup<any> & {
  fetching: boolean
  startDate?: Date
  endDate?: Date
  from: number
  size: number
  totalDevices: number
  lastMonthDeviceCount: number
  lastMonthConnectionCount: number
  devices: IAnalyticsDevice[]
  deviceTimeseriesMaxCount: number
  connectionTimeseriesMaxCount: number
  deviceTimeseries: ITimeSeriesData[]
  connectionTimeseries: ITimeSeriesData[]
}

const state: IAnalyticsState = {
  fetching: false,
  from: 0,
  size: MAX_DEVICE_LENGTH,
  startDate: setDate(new Date().setMonth(new Date().getMonth() - 1), {
    date: 1,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  }),
  endDate: setDate(new Date().setDate(0), { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 }),
  totalDevices: 0,
  lastMonthDeviceCount: 0,
  lastMonthConnectionCount: 0,
  devices: [],
  deviceTimeseriesMaxCount: 0,
  connectionTimeseriesMaxCount: 0,
  deviceTimeseries: [],
  connectionTimeseries: [],
  sortPreference: { sortOrder: 'desc', sortPreferenceKey: 'quality' },
}

type analyticsGQLOptions = {
  size: number
  from: number
  start: Date
  end: Date
  timeZone: string
}

export default createModel<RootModel>()({
  state,
  effects: (dispatch: any) => ({
    async fetchAnalytics(_: void, globalState: any) {
      if (!hasCredentials()) return
      const { from, size, startDate, endDate } = globalState.analytics
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
      if (!isSameDay(startDate, monthStart)) {
        const monthEnd = setDate(new Date().setDate(0), { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 })
        set({
          from: 0,
          startDate: monthStart,
          endDate: monthEnd,
          totalDevices: 0,
          totalConnections: 0,
          lastMonthDeviceCount: 0,
          lastMonthConnectionCount: 0,
          devices: [],
          connections: [],
          deviceTimeseries: [],
          connectionTimeseries: [],
        })
      }
      getAnalytics({ from, size, start: monthStart, end: monthEnd, timeZone })
    },
    async getAnalytics({ from, size, start, end, timeZone }: analyticsGQLOptions) {
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
                  endpoint {
                    quality
                  }
                  services {
                    id
                    name
                    type
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
    async parse(gqlResponse: any, globalState: ApplicationState) {
      const gqlData = gqlResponse?.data?.data?.login
      const {
        from,
        size,
        startDate,
        endDate,
        timeZone,
        devices,
        connectionTimeseries,
        deviceTimeseries,
      } = globalState.analytics
      const { set, primeGraphTimeseries, getAnalytics, parseDevices } = dispatch.analytics
      if (!gqlData) {
        const newState = set({
          fetching: false,
          from: 0,
          totalDevices: 0,
          totalConnections: 0,
          lastMonthDeviceCount: 0,
          lastMonthConnectionCount: 0,
          devices: [],
          connections: [],
          deviceTimeseries: [],
          connectionTimeseries: [],
        })
        return
      }
      if (deviceTimeseries.length < 1) {
        const primedGraphTimeseries = await primeGraphTimeseries({
          start: startDate,
          end: endDate,
        })
        set({ connectionTimeseries: primedGraphTimeseries, deviceTimeseries: primedGraphTimeseries })
      }
      const devicelist: IAnalyticsDevice[] =
        devices.length < 1 ? parseDevices(gqlData.devices.items) : devices.concat(parseDevices(gqlData.devices.items))
      let newFromIndex = from
      if (gqlData.devices.hasMore) {
        newFromIndex += size
      } else {
        newFromIndex = gqlData.devices.total
      }
      set({ from: newFromIndex, devices: devicelist, totalDevices: gqlData.devices.total })
      if (gqlData.devices.hasMore) {
        getAnalytics({ from: newFromIndex, size, start: startDate, end: endDate, timeZone })
        return
      }
      //iterate over devices to put them in a timeseries & calculate connections

      let pastMonthDevices = 0
      let deviceTimeseriesMaxCount = 0
      //add to the devices in this period
      const newDeviceTimeseries = deviceTimeseries.map(item => {
        let count = 0
        devicelist.map(d => {
          if (isEqual(startOfDay(item.date), startOfDay(d.createdAt))) {
            pastMonthDevices += 1
            count += 1
            return count
          }
        })
        if (count > deviceTimeseriesMaxCount) {
          deviceTimeseriesMaxCount = count
        }
        return { date: item.date, count }
      })
      //need to do an initial sort

      set({
        totalDevices: gqlData.devices.total,
        fetching: false,
        lastMonthDeviceCount: pastMonthDevices,
        deviceTimeseries: newDeviceTimeseries,
        deviceTimeseriesMaxCount,
        connectionTimeseries,
      })
    },
    primeGraphTimeseries({ start, end }: IDateOptions) {
      //make an array of graph objects for each day in the month
      if (start && end) {
        const daysInMonth = eachDayOfInterval({
          start,
          end,
        })
        const initTimeSeries = daysInMonth.map(d => {
          return { date: d, count: 0 }
        })
        return initTimeSeries
      }
    },
    parseDevices(devices, globalState) {
      const { set } = dispatch.analytics
      const connectionTimeseries = globalState.analytics.connectionTimeseries
      let lastMonthConnectionCount = globalState.analytics.lastMonthConnectionCount
      const parsedDevices: IAnalyticsDevice[] = devices.map(d => {
        const createdDate = new Date(d.created)
        const qualitySort = getQualityNumber(d.endpoint.quality)
        const device: IAnalyticsDevice = {
          createdAt: createdDate,
          id: d.id,
          name: d.name,
          quality: d.endpoint.quality,
          qualitySort,
        }
        //go through the services and extract connection time series
        d.services.map(s => {
          //start adding to the connections timeseries
          if (s.timeSeries.data.length > 0) {
            s.timeSeries.data.map((c, i) => {
              if (c > 0) {
                connectionTimeseries[i]['count'] += c
                lastMonthConnectionCount += c
              }
            })
          }
        })
        return device
      })
      console.log(connectionTimeseries)
      set({ connectionTimeseries, lastMonthConnectionCount })
      return parsedDevices
    },
  }),
  reducers: {
    set(state: IAnalyticsState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
function getQualityNumber(quality: string) {
  let value
  switch (quality) {
    case 'GOOD':
      value = 3
      break
    case 'MODERATE':
      value = 2
      break
    case 'POOR':
      value = 1
      break
    case 'UNKNOWN':
      value = 0
      break
  }
  return value
}
