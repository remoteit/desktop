import { ApplicationState } from '../store'
import { DateTime, Duration } from 'luxon'
import { selectLimit } from '../models/plans'
import { Unit } from 'humanize-duration'

export function isToday(dateToCheck: Date): boolean {
  const today = new Date().toLocaleDateString()
  const check = dateToCheck.toLocaleDateString()

  return today === check
}

export const getDateFormatString = () => {
  const formatObj = new Intl.DateTimeFormat(window.navigator.language).formatToParts(new Date())
  return formatObj
    .map(obj => {
      switch (obj.type) {
        case 'day':
          return 'dd'
        case 'month':
          return 'MM'
        case 'year':
          return 'yyyy'
        default:
          return obj.value
      }
    })
    .join('')
}

export const getTimeZone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function limitTimeSeries(state: ApplicationState, timeSeries: ITimeSeriesOptions): ITimeSeriesOptions {
  const defaultDuration = getMaxDuration(timeSeries.resolution)
  const logLimit = selectLimit('log-limit', state)
  const logLimitDuration = Duration.fromISO(logLimit)
  const shortestDuration = defaultDuration.valueOf() < logLimitDuration.valueOf() ? defaultDuration : logLimitDuration
  const start = DateTime.local().minus(shortestDuration).toJSDate()
  return { ...timeSeries, start }
}

export const getStart = (resolution: ITimeSeriesResolution) => {
  return DateTime.local().minus(getMaxDuration(resolution)).toJSDate()
}

export const getDuration = (unit: ITimeSeriesResolution) => {
  return Duration.fromObject({ [TimeSeriesResolutionLookup[unit]]: 1 })
}

export const getMaxDuration = (unit: ITimeSeriesResolution) => {
  return Duration.fromObject({ [resolutionMaxLookup[unit]]: 1 })
}

export const connectionTypes = ['USAGE', 'CONNECT_DURATION', 'CONNECT', 'DISCONNECT']
export const secondResolutions = ['SECOND', 'MINUTE', 'HOUR']

export const humanizeResolutionLookup: ILookup<Unit, ITimeSeriesResolution> = {
  SECOND: 's',
  MINUTE: 'm',
  HOUR: 'h',
  DAY: 'd',
  WEEK: 'w',
  MONTH: 'mo',
  QUARTER: 'mo',
  YEAR: 'y',
}

export const TimeSeriesTypeScale: ILookup<ITimeSeriesScale, ITimeSeriesType> = {
  AVAILABILITY: { unit: '%', scale: 100 },
  ONLINE_DURATION: { unit: 'time', scale: 1 },
  ONLINE: { unit: 'events', scale: 1 },
  OFFLINE: { unit: 'events', scale: 1 },
  USAGE: { unit: '%', scale: 100 },
  CONNECT_DURATION: { unit: 'time', scale: 1 },
  CONNECT: { unit: 'events', scale: 1 },
  DISCONNECT: { unit: 'events', scale: 1 },
}

export const TimeSeriesTypeLookup: ILookup<string, ITimeSeriesType> = {
  AVAILABILITY: 'Online percentage',
  ONLINE_DURATION: 'Online duration',
  ONLINE: 'Number of online events',
  OFFLINE: 'Number of offline events',
  USAGE: 'Connected percentage',
  CONNECT_DURATION: 'Connected duration',
  CONNECT: 'Number of connection events',
  DISCONNECT: 'Number of disconnect events',
}

export const TimeSeriesResolutionLookup: ILookup<string, ITimeSeriesResolution> = {
  SECOND: 'Second',
  MINUTE: 'Minute',
  HOUR: 'Hour',
  DAY: 'Day',
  WEEK: 'Week',
  MONTH: 'Month',
  QUARTER: 'Quarter',
  YEAR: 'Year',
}

const resolutionMaxLookup: ILookup<string, ITimeSeriesResolution> = {
  SECOND: 'hours',
  MINUTE: 'days',
  HOUR: 'weeks',
  DAY: 'months',
  WEEK: 'quarters',
  MONTH: 'years',
  QUARTER: 'years',
  YEAR: 'years',
}
