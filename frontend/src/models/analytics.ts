import { createModel } from '@rematch/core'
import { graphQLRequest, graphQLGetErrors, apiError } from '../services/graphQL'
import { hasCredentials } from '../services/remote.it'
import { RootModel } from '.'
import { set as setDate, eachDayOfInterval, isEqual } from 'date-fns'
import { getTimeZone } from '../helpers/dateHelper'
import { startOfDay } from 'date-fns/esm'
import { AxiosResponse } from 'axios'

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
  startDate: Date
  endDate: Date
}
export interface ITimeSeriesData {
  date: Date
  count: number
}

type IAnalyticsState = {
  fetching: boolean
  startDate: Date
  endDate?: Date
  from: number
  size: number
  totalDevices: number
  lastMonthDeviceCount: number
  lastMonthConnectionCount: number
  devices: IAnalyticsDevice[]
  deviceTimeseries: ITimeSeriesData[]
  connectionTimeseries: ITimeSeriesData[]
  timeZone?: string
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
  deviceTimeseries: [],
  connectionTimeseries: [],
}

type analyticsGQLOptions = {
  size: number
  from: number
}
type parseDeviceOptions = {
  devices: any[]
  connectionTimeseries: ITimeSeriesData[]
  lastMonthConnectionCount: number
}
export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async fetchAnalytics(_: void, globalState) {
      if (!hasCredentials()) return
      const { from, size, startDate, endDate } = globalState.analytics
      if (!endDate) return
      const { getAnalytics, set, primeGraphTimeseries } = dispatch.analytics
      const primedGraphTimeseries = primeGraphTimeseries({ startDate: startDate, endDate: endDate })
      set({
        fetching: true,
        deviceTimeseries: primedGraphTimeseries,
        connectionTimeseries: primedGraphTimeseries,
      })
      getAnalytics({ from, size })
    },
    async getAnalytics({ from, size }: analyticsGQLOptions, globalState) {
      const { startDate, endDate } = globalState.analytics
      const { parse } = dispatch.analytics
      const options = { from, size, start: startDate, end: endDate, timezone: getTimeZone() }

      try {
        const result = await graphQLRequest(
          `query Analytics($from: Int, $size: Int, $start: DateTime, $end: DateTime, $timezone: String) {
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
        await parse(result)
      } catch (error) {
        await apiError(error)
      }
    },
    async parse(gqlResponse: undefined | AxiosResponse<any>, globalState) {
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
        lastMonthConnectionCount,
      } = globalState.analytics
      const { set, getAnalytics, parseDevices } = dispatch.analytics
      if (!gqlData) {
        const newState = set({
          fetching: false,
        })
        return
      }
      const { parsedDevices, updatedConnectionTimeseries, updatedLastMonthConnectionCount } = parseDevices({
        devices: gqlData.devices.items,
        connectionTimeseries: connectionTimeseries,
        lastMonthConnectionCount: lastMonthConnectionCount,
      })
      const devicelist: IAnalyticsDevice[] = devices.length < 1 ? parsedDevices : devices.concat(parsedDevices)
      let newFromIndex = from
      if (gqlData.devices.hasMore) {
        newFromIndex += size
      } else {
        newFromIndex = gqlData.devices.total
      }
      set({
        from: newFromIndex,
        devices: devicelist,
        totalDevices: gqlData.devices.total,
        connectionTimeseries: updatedConnectionTimeseries,
        lastMonthConnectionCount: updatedLastMonthConnectionCount,
      })
      if (gqlData.devices.hasMore) {
        getAnalytics({ from: newFromIndex, size })
        return
      }
      //iterate over devices to put them in a timeseries & calculate connections
      let pastMonthDevices = 0
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
        return { date: item.date, count }
      })
      set({
        fetching: false,
        lastMonthDeviceCount: pastMonthDevices,
        deviceTimeseries: newDeviceTimeseries,
      })
    },
    primeGraphTimeseries({ startDate, endDate }: IDateOptions) {
      //make an array of graph objects for each day in the month
      if (startDate && endDate) {
        const daysInMonth = eachDayOfInterval({
          start: startDate,
          end: endDate,
        })
        const initTimeSeries = daysInMonth.map(d => {
          return { date: d, count: 0 }
        })
        return initTimeSeries
      }
    },
    parseDevices({ devices, connectionTimeseries, lastMonthConnectionCount }: parseDeviceOptions, globalState) {
      let updatedLastMonthConnectionCount = lastMonthConnectionCount
      const parsedDevices: IAnalyticsDevice[] = devices.map(d => {
        const createdDate = new Date(d.created)
        const deviceQuality = d.endpoint?.quality
        const qualitySort = getQualityNumber(deviceQuality)
        const device: IAnalyticsDevice = {
          createdAt: createdDate,
          id: d.id,
          name: d.name,
          quality: deviceQuality,
          qualitySort,
        }

        //go through the services and extract connection time series
        d.services.map(s => {
          //start adding to the connections timeseries
          if (s.timeSeries.data.length > 0) {
            s.timeSeries.data.map((c, i) => {
              if (c > 0) {
                connectionTimeseries[i]['count'] += c
                updatedLastMonthConnectionCount += c
              }
            })
          }
        })
        return device
      })
      return {
        parsedDevices: parsedDevices,
        updatedConnectionTimeseries: connectionTimeseries,
        updatedLastMonthConnectionCount: updatedLastMonthConnectionCount,
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
