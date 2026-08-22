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

// The longest span the plan's log limit actually covers. `lengths` defaults to
// the choices for the resolution, but a heat map passes its own day counts.
export const findLongestLength = (limitDuration: Duration, resolution: string, lengths?: number[]) => {
  const allowed = (lengths ?? TimeSeriesLengths[resolution]).filter(
    length => limitDuration.valueOf() >= Duration.fromObject({ [resolution]: length }).valueOf()
  )
  return allowed[allowed.length - 1]
}

export const connectionTypes = ['USAGE', 'CONNECT_DURATION', 'CONNECT', 'DISCONNECT']
export const secondResolutions = ['SECOND', 'MINUTE', 'HOUR']

export const defaultDeviceTimeSeries: ITimeSeriesOptions = {
  type: 'ONLINE_DURATION',
  resolution: 'DAY',
  length: 7,
  style: 'bar',
}

export const defaultServiceTimeSeries: ITimeSeriesOptions = {
  type: 'CONNECT_DURATION',
  resolution: 'DAY',
  length: 7,
  style: 'bar',
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

export const TimeSeriesAvailableStyles: ILookup<string, ITimeSeriesStyle> = {
  bar: 'Bar',
  heatmap: 'Heat map',
}

export const timeSeriesStyleLabel = (style?: string): string =>
  style ? i18n.t(`graphStyle.${style}`, { defaultValue: TimeSeriesAvailableStyles[style] || style }) : ''

// A heat map is a day (column) by time-of-day (row) grid, so it only has
// something to show at sub-day resolutions. MINUTE joins this list if it is
// ever enabled in TimeSeriesAvailableResolutions.
export const TimeSeriesHeatmapResolutions: Partial<ILookup<string, ITimeSeriesResolution>> = {
  HOUR: 'Hour',
}

export const defaultHeatmapResolution: ITimeSeriesResolution = 'HOUR'

// Heat map spans are picked in days — the number of columns in the grid.
export const TimeSeriesHeatmapDays = [7, 14, 30]

export const resolutionSeconds: ILookup<number, ITimeSeriesResolution> = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
  MONTH: 2592000,
  QUARTER: 7776000,
  YEAR: 31536000,
}

export const heatmapRows = (resolution: ITimeSeriesResolution) =>
  Math.max(Math.round(resolutionSeconds.DAY / resolutionSeconds[resolution]), 1)

// What to actually ask the API for. Its window ends at the bucket in progress,
// so every graph fetches one period beyond the span it shows and drops it —
// otherwise the last bar is always short by however much of the period is left
// to run, and a heat map's first column opens partway through a day.
export const timeSeriesRequest = (options: ITimeSeriesOptions): ITimeSeriesOptions => ({
  ...options,
  length: (options.length + 1) * (options.style === 'heatmap' ? heatmapRows(options.resolution) : 1),
})

// Drop that trailing in-progress bucket. Heat maps do their own trimming in
// heatmapGrid(), which has to work a whole column at a time.
export const trimIncomplete = (data: ITimeSeries): ITimeSeries =>
  data.time.length < 2
    ? data
    : { ...data, end: data.time[data.time.length - 1], time: data.time.slice(0, -1), data: data.data.slice(0, -1) }

// Heat cells are colored on an absolute scale so two devices are directly
// comparable — a full bucket is 100% for a percentage type and the bucket's own
// duration for a time type. Event counts have no ceiling, so they auto-scale.
export const timeSeriesFullScale = (type: ITimeSeriesType, resolution: ITimeSeriesResolution): number | undefined => {
  const { unit, scale } = TimeSeriesTypeScale[type]
  if (unit === '%') return scale
  if (unit === 'time') return resolutionSeconds[resolution]
  return undefined
}

// Fold a series into day columns for the heat map. `rows` is the number of cells
// per column — 24 for hour buckets, or 1 to collapse each day into a single
// strip cell, which is what the list column does so it stays one row tall no
// matter which resolution the details page last fetched. `days` is how many
// columns to keep: the day in progress goes, then the partial day the request
// opened in the middle of, leaving that many whole days.
export const heatmapGrid = (data: ITimeSeries, rows: number, days?: number): ITimeSeriesGrid => {
  const average = TimeSeriesTypeScale[data.type]?.unit === '%'
  const keys: string[] = []
  const buckets: ILookup<number[][]> = {}

  data.time.forEach((time, i) => {
    const date = DateTime.fromJSDate(time)
    const key = date.toISODate() ?? ''
    if (!buckets[key]) {
      keys.push(key)
      buckets[key] = Array.from({ length: rows }, () => [] as number[])
    }
    // Rows are clock position within the local day, so a cell always means the
    // same time of day. The hour a DST jump skips stays empty and the hour it
    // repeats collects both buckets.
    const clock = date.hour * 3600 + date.minute * 60 + date.second
    const row = rows === 1 ? 0 : Math.min(Math.floor((clock / 86400) * rows), rows - 1)
    buckets[key][row].push(data.data[i] ?? 0)
  })

  const whole = keys.slice(0, -1)

  return {
    rows,
    columns: (days ? whole.slice(-days) : whole).map(key => ({
      key,
      date: DateTime.fromISO(key).toJSDate(),
      values: buckets[key].map(values => {
        if (!values.length) return undefined
        const total = values.reduce((sum, value) => sum + value, 0)
        return average ? total / values.length : total
      }),
    })),
  }
}

// The device/service list renders a single row strip, so it never needs the
// sub-day buckets a heat map details view asks for — without this a 30 day heat
// map would pull 720 points for every device in the list query.
export const listTimeSeriesOptions = (options: ITimeSeriesOptions): ITimeSeriesOptions =>
  options.style === 'heatmap' ? { ...options, resolution: 'DAY' } : options

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
