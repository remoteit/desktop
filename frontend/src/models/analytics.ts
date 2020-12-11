import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import { graphQLRequest, graphQLGetErrors, graphQLHandleError } from '../services/graphQL'
import { hasCredentials } from '../services/remote.it'
import { RootModel } from './rootModel'
import { set, set as setDate } from 'date-fns'
import { getTimeZone } from '../helpers/dateHelper'

const MAX_DEVICE_LENGTH = 1000

interface IAnalyticsDevice {
  id: string
  name: string
  quality: 'GOOD' | 'MODERATE' | 'POOR' | 'UNKNOWN'
  createdAt: Date
}
interface IAnalyticsConnection {
  id: string
  deviceID: string
  active?: boolean // active if connected
  starttime: Date
  endtime?: Date
}

type IAnalyticsState = ILookup<any> & {
  fetching: boolean
  fetchingMore: boolean
  startDate?: Date
  from: number
  totalDevices: number
  totalConnections: number
  devices: IAnalyticsDevice[]
  connections: IAnalyticsConnection[]
}

const state: IAnalyticsState = {
  fetching: false,
  fetchingMore: false,
  from: 0,
  totalDevices: 0,
  totalConnections: 0,
  devices: [],
  connections: [],
  deviceTimeSeries: [],
}
type analyticsGQOptions = {
  size: number
  from: number
  start: Date
  end: Date
  timeZone: string
}

const fetchSize = 2
export default createModel<RootModel>()({
  state,
  effects: (dispatch: any) => ({
    async fetchAnalytics() {
      if (!hasCredentials()) return
      const { set, startDate } = dispatch.analytics
      const timeZone = getTimeZone()
      const monthStart = setDate(new Date().setMonth(new Date().getMonth() - 1), {
        date: 1,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      })
      if (startDate && monthStart <= startDate && !dispatch.analytics.fetching) {
        return
      } else {
        set({ startDate: monthStart, fetching: true })
      }
      const monthEnd = setDate(new Date().setDate(0), { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 })
      const options: analyticsGQOptions = { from: 0, size: fetchSize, start: monthStart, end: monthEnd, timeZone }
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
        await dispatch.analytics.parse(result)
      } catch (error) {
        await graphQLHandleError(error)
      }
    },
    async parse(gqlResponse: any, globalState: ApplicationState) {
      const gqlData = gqlResponse?.data?.data?.login
      if (!gqlData) return
      const currentDeviceList = dispatch.analytics.devices
      const updatedDevices: IAnalyticsDevice[] = currentDeviceList
        ? currentDeviceList.concat(gqlData.devices)
        : gqlData.devices
      dispatch.analytics.set({ from: dispatch.analytics.from + fetchSize, devices: updatedDevices })
      if (gqlData.devices.hasMore) {
        this.fetchAnalytics()
      } else {
        //iterate over devices to put them in a timeseries
      }
      //need to get only the devices in the date range
      const totalDevices = gqlData.devices.total
      dispatch.analytics.set({ totalDevices: totalDevices, fetching: false })
    },
  }),
  reducers: {
    set(state: IAnalyticsState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
