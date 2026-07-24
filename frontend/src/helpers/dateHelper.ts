import { DateTime, Duration } from 'luxon'
import humanize, { Unit, HumanizerOptions } from 'humanize-duration'
import i18n from '../i18n'

// The active locale for all date/duration formatting. Driven by the app language
// preference (ui.setLanguage), falling back to the OS/browser language.
export const getLocale = () => i18n.resolvedLanguage || window.navigator.language || 'en'

// Localized humanize-duration. Use this everywhere instead of importing
// humanize-duration directly so durations ("3 days", "2 hours") translate.
export const humanizeDuration = (ms: number, options: HumanizerOptions = {}) =>
  humanize(ms, { language: getLocale(), fallbacks: ['en'], ...options })

// Wrap a humanized duration as a localized relative-past phrase. Word order is
// language-specific (en "3 days ago", de "vor 3 Tagen", ja "3日前", es "hace 3 días"),
// so the ordering lives in the catalog rather than a hard-coded English suffix.
export const relativeTime = (duration: string): string =>
  i18n.t('duration.ago', { defaultValue: '{{duration}} ago', duration })

export function isToday(dateToCheck: Date): boolean {
  const today = new Date().toLocaleDateString()
  const check = dateToCheck.toLocaleDateString()

  return today === check
}

export const getDateFormatString = () => {
  const formatObj = new Intl.DateTimeFormat(getLocale()).formatToParts(new Date())
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

// The graph type/resolution lookups above are module-level, so their display
// labels resolve translation at access time (keyed by the lookup key under
// `graphType.*` / `graphUnit.*`, hand-maintained in the catalogs), falling back
// to the English label.
export const timeSeriesTypeLabel = (type?: string): string =>
  type ? i18n.t(`graphType.${type}`, { defaultValue: TimeSeriesTypeLookup[type] || type }) : ''
export const timeSeriesResolutionLabel = (res?: string): string =>
  res ? i18n.t(`graphUnit.${res}`, { defaultValue: TimeSeriesAvailableResolutions[res] || res }) : ''

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
