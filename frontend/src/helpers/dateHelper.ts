import { DateTime, Duration } from 'luxon'
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

export const getStart = (resolution: ITimeSeriesResolution) => {
  return DateTime.local().minus(getMaxDuration(resolution)).toJSDate()
}

export const getMaxDuration = (unit: ITimeSeriesResolution) => {
  return Duration.fromObject({ [resolutionMaxLookup[unit]]: 1 })
}

export const findLongestLength = (limitDuration: Duration, resolution: string) => {
  const lengths: number[] = []
  TimeSeriesLengths[resolution].forEach(length => {
    if (limitDuration.valueOf() >= Duration.fromObject({ [resolution]: length }).valueOf()) {
      lengths.push(length)
    }
  })
  return lengths[lengths.length - 1]
}

export const connectionTypes = ['USAGE', 'CONNECT_DURATION', 'CONNECT', 'DISCONNECT']
export const secondResolutions = ['SECOND', 'MINUTE', 'HOUR']

export const defaultDeviceTimeSeries: ITimeSeriesOptions = {
  type: 'ONLINE_DURATION',
  resolution: 'DAY',
  length: 7,
}

export const defaultServiceTimeSeries: ITimeSeriesOptions = {
  type: 'CONNECT_DURATION',
  resolution: 'DAY',
  length: 7,
}

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

export const humanizeMaxResolutionLookup: ILookup<Unit, ITimeSeriesResolution> = {
  SECOND: 'm',
  MINUTE: 'h',
  HOUR: 'd',
  DAY: 'w',
  WEEK: 'mo',
  MONTH: 'y',
  QUARTER: 'y',
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
  AVAILABILITY: 'Online %',
  ONLINE_DURATION: 'Online Time',
  ONLINE: 'Online events',
  OFFLINE: 'Offline events',
  USAGE: 'Connected %',
  CONNECT_DURATION: 'Connected Time',
  CONNECT: 'Connect events',
  DISCONNECT: 'Disconnect events',
}

export const TimeSeriesAvailableResolutions: Partial<ILookup<string, ITimeSeriesResolution>> = {
  // SECOND: 'Second',
  // MINUTE: 'Minute',
  HOUR: 'Hour',
  DAY: 'Day',
  WEEK: 'Week',
  MONTH: 'Month',
  // QUARTER: 'Quarter',
  // YEAR: 'Year',
}

export const TimeSeriesLengths: ILookup<number[], ITimeSeriesResolution> = {
  SECOND: [60],
  MINUTE: [60],
  HOUR: [12, 24, 48],
  DAY: [7, 14, 30],
  WEEK: [4, 12],
  MONTH: [12],
  QUARTER: [4],
  YEAR: [1],
}

export const resolutionMaxLookup: ILookup<string, ITimeSeriesResolution> = {
  SECOND: 'minutes',
  MINUTE: 'hours',
  HOUR: 'days',
  DAY: 'weeks',
  WEEK: 'months',
  MONTH: 'quarters',
  QUARTER: 'years',
  YEAR: 'years',
}
