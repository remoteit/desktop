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

// 6pm vs 18:00 is regional, not linguistic — en-GB writes 18:00 where en-US
// writes 6pm — so the OS locale decides when it is a region of the app's.
const getClockLocale = () => {
  const app = getLocale()
  const os = window.navigator.language
  return os && os.split('-')[0] === app.split('-')[0] ? os : app
}

// Cached because building an Intl.DateTimeFormat costs orders of magnitude more
// than using one, and only four hours in one locale are ever asked for.
const clockFormats: ILookup<{ hour12: boolean; format: Intl.DateTimeFormat }> = {}
const getClockFormat = () => {
  const locale = getClockLocale()
  if (!clockFormats[locale]) {
    const hour12 = !!new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hour12
    const shape: Intl.DateTimeFormatOptions = hour12
      ? { hour: 'numeric' }
      : { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
    clockFormats[locale] = { hour12, format: new Intl.DateTimeFormat(locale, shape) }
  }
  return clockFormats[locale]
}

export const hourLabel = (hour: number): string => {
  const { hour12, format } = getClockFormat()
  const date = new Date(2000, 0, 1, hour)
  if (!hour12) return format.format(date)
  if (hour === 0) return i18n.t('time.midnight', 'midnight')
  if (hour === 12) return i18n.t('time.noon', 'noon')
  // "6 PM" -> "6pm"; the locale supplies the day period, this only tightens it
  return format.format(date).replace(/\s/g, '').toLowerCase()
}

export const getStart = (resolution: ITimeSeriesResolution) => {
  return DateTime.local().minus(getMaxDuration(resolution)).toJSDate()
}

export const getMaxDuration = (unit: ITimeSeriesResolution) => {
  return Duration.fromObject({ [resolutionMaxLookup[unit]]: 1 })
}

// A heat map's length counts day columns; its resolution only sets the rows
// within each. Every other style counts buckets of its own resolution.
export const timeSeriesLengthUnit = (options: ITimeSeriesOptions): ITimeSeriesResolution =>
  options.style === 'heatmap' ? 'DAY' : options.resolution

// An unknown limit restricts nothing — it is absent until the organization
// loads, and greying out every span until then is worse than offering them.
export const withinLogLimit = (limitDuration: Duration, unit: string, length: number) =>
  !limitDuration.isValid || limitDuration.valueOf() >= Duration.fromObject({ [unit]: length }).valueOf()

// Falls back to the shortest rather than the longest while the limit is
// unknown: asking for more history than the plan holds is the direction that
// fails. Never undefined — the query would carry that through as NaN.
export const findLongestLength = (limitDuration: Duration, resolution: string) => {
  const lengths = TimeSeriesLengths[resolution]
  if (!limitDuration.isValid) return lengths[0]
  const allowed = lengths.filter(length => withinLogLimit(limitDuration, resolution, length))
  return allowed[allowed.length - 1] ?? lengths[0]
}

export const connectionTypes = ['USAGE', 'CONNECT_DURATION', 'CONNECT', 'DISCONNECT']
export const secondResolutions = ['SECOND', 'MINUTE', 'HOUR']

// A device is online or not around the clock, so the hour-of-day grid has
// something to say about it: a device up two hours a day reads as pale at a
// glance, where a bar graph auto-scales to its own peak and hides that.
export const defaultDeviceTimeSeries: ITimeSeriesOptions = {
  type: 'ONLINE_DURATION',
  resolution: 'HOUR',
  length: 7,
  style: 'heatmap',
}

// Connections are occasional rather than continuous, so most cells in a service
// heat map are empty and daily bars read better.
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

// A day-by-time-of-day grid only has something to show at sub-day resolutions.
// MINUTE joins this list if TimeSeriesAvailableResolutions ever enables it.
export const TimeSeriesHeatmapResolutions: ITimeSeriesResolution[] = ['HOUR']

const resolutionSeconds = (resolution: ITimeSeriesResolution) => Duration.fromObject({ [resolution]: 1 }).as('seconds')

export const heatmapRows = (resolution: ITimeSeriesResolution) =>
  Math.max(Math.round(resolutionSeconds('DAY') / resolutionSeconds(resolution)), 1)

// A grid asks for one day more than it draws: the window ends at the hour in
// progress, not on a local day boundary, so its oldest day is a partial one
// that heatmapGrid drops. Bars draw every bucket of the span asked for.
export const timeSeriesRequest = (options: ITimeSeriesOptions): ITimeSeriesOptions => {
  const rows = options.style === 'heatmap' ? heatmapRows(options.resolution) : 1
  return { ...options, length: rows > 1 ? (options.length + 1) * rows : options.length }
}

// The list draws day buckets whatever style the details view uses, so a style
// change over the same span resolves to the same query — which is how
// devices.setTimeSeries knows a refetch would return what it already has.
export const listTimeSeriesKey = (options: ITimeSeriesOptions) => {
  const { type, resolution, length } = timeSeriesRequest(listTimeSeriesOptions(options))
  return `${type}-${resolution}-${length}`
}

// Plain Date getters rather than luxon: same system zone, and this runs once
// per bucket, up to 744 of them.
const localDayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

// Resolutions whose buckets are the same length every time. Luxon counts a
// month as 30 days, which would leave an always-online device short every
// February and push all seven 31-day months past the top of the scale.
const fixedLengthResolutions: ITimeSeriesResolution[] = ['SECOND', 'MINUTE', 'HOUR', 'DAY', 'WEEK']

// An absolute scale so two devices are directly comparable. Types with no
// ceiling (event counts) and buckets with no fixed length auto-scale instead.
export const timeSeriesFullScale = (type: ITimeSeriesType, resolution: ITimeSeriesResolution): number | undefined => {
  const { unit, scale } = TimeSeriesTypeScale[type]
  if (unit === '%') return scale
  if (unit === 'time' && fixedLengthResolutions.includes(resolution)) return resolutionSeconds(resolution)
  return undefined
}

// Reduced rather than spread through Math.max, which returns NaN for a null or
// undefined bucket and takes the whole scale with it.
export const timeSeriesMax = (data: number[]) => data.reduce((max, value) => (value > max ? value : max), 0.1)

// "Last 30 days". A heat map counts the columns it draws rather than measuring
// the fetched window, which carries the partial day the grid drops. A view
// mid-load passes the span it is drawing rather than the one being replaced.
export const timeSeriesSpanLabel = (data: ITimeSeries, days = data.style === 'heatmap' ? data.days : undefined) => {
  const span = days ? Duration.fromObject({ days }).toMillis() : data.end.getTime() - data.start.getTime()
  return humanizeDuration(span, {
    largest: 1,
    round: true,
    units: [days ? 'd' : humanizeResolutionLookup[data.resolution || 'DAY']],
  })
}

// The newest `days` day-columns as `[column][row]`. `rows` is cells per column:
// 24 for hour buckets, or 1 to collapse each day to a single strip cell.
// Dropping the older columns is what discards the request's partial first day.
export const heatmapGrid = (data: ITimeSeries, rows: number, days: number): (ITimeSeriesCell | undefined)[][] => {
  const average = TimeSeriesTypeScale[data.type]?.unit === '%'
  const dayLength = resolutionSeconds('DAY')
  const keys: string[] = []
  const buckets: ILookup<ITimeSeriesCell[][]> = {}

  data.time.forEach((time, i) => {
    const key = localDayKey(time)
    if (!buckets[key]) {
      keys.push(key)
      buckets[key] = Array.from({ length: rows }, () => [] as ITimeSeriesCell[])
    }
    // Clock position within the local day, so a cell always means the same time
    // of day. A DST-skipped hour stays empty; a repeated one collects both.
    const clock = time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds()
    const row = Math.min(Math.floor((clock / dayLength) * rows), rows - 1)
    buckets[key][row].push({ date: time, value: data.data[i] ?? 0 })
  })

  return keys.slice(-days).map(key =>
    buckets[key].map(cells => {
      if (!cells.length) return undefined
      const total = cells.reduce((sum, cell) => sum + cell.value, 0)
      return { date: cells[0].date, value: average ? total / cells.length : total }
    })
  )
}

// The list asks for daily buckets, but a device whose details page has been
// opened holds hourly ones — 744 bars in a 100px column is neither readable
// nor cheap.
export const toDailySeries = (data: ITimeSeries, days: number): ITimeSeries => {
  const cells = heatmapGrid(data, 1, days)
    .map(column => column[0])
    .filter((cell): cell is ITimeSeriesCell => !!cell)
  if (!cells.length) return data
  return {
    ...data,
    resolution: 'DAY',
    start: cells[0].date,
    time: cells.map(cell => cell.date),
    data: cells.map(cell => cell.value),
  }
}

// Style changes re-scope resolution and length, since the two styles count
// `length` in different units. Lands on the longest span the plan allows.
export const timeSeriesWithStyle = (
  options: ITimeSeriesOptions,
  style: ITimeSeriesStyle,
  limitDuration: Duration
): ITimeSeriesOptions => {
  // Settings saved before graph style existed have no style at all, and they
  // are bar graphs — picking Bar on one of those should leave it alone.
  if (style === (options.style ?? 'bar')) return options
  return {
    ...options,
    style,
    resolution: style === 'heatmap' ? TimeSeriesHeatmapResolutions[0] : 'DAY',
    length: findLongestLength(limitDuration, 'DAY'),
  }
}

// Whether a series has the sub-day buckets a heat map grid needs.
export const isHeatmapSeries = (data?: ITimeSeries) => data?.style === 'heatmap' && heatmapRows(data.resolution) > 1

// A series answers only for the options it was fetched with, and nothing
// sequences the refetches — so a response for a superseded setting can be the
// one that lands last. Every dimension the series records is compared: a stale
// type draws the previous graph under the new title, and a grid needs sub-day
// buckets over the span being drawn or it reflows when the real data arrives.
export const timeSeriesLoading = (data: ITimeSeries | undefined, options: ITimeSeriesOptions) => {
  if (data && data.type !== options.type) return true
  if (options.style !== 'heatmap') return false
  return !isHeatmapSeries(data) || data?.days !== options.length
}

// The list renders a single strip, so without this a 30 day heat map would pull
// 720 points per device in the list query instead of 30.
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
