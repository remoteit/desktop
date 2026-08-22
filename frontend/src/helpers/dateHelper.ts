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

// Whether to write 6pm or 18:00 is regional, not a matter of language — en-GB
// writes 18:00 where en-US writes 6pm. So when the OS locale is a region of the
// app's language, let it decide; otherwise the app language speaks for itself.
// One locale drives both the choice and the formatting, which keeps a 24 hour
// language from being forced into a 12 hour shape it has no words for.
const getClockLocale = () => {
  const app = getLocale()
  const os = window.navigator.language
  return os && os.split('-')[0] === app.split('-')[0] ? os : app
}

// A friendlier hour axis than 00:00/06:00/12:00/18:00 wherever a 12 hour clock
// is the norm. Midnight and noon get words because "12am" and "12pm" are the
// two labels people reliably misread.
// Building an Intl.DateTimeFormat costs orders of magnitude more than using one,
// and only four hours in one locale are ever asked for.
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

// The unit `length` counts. A heat map's length is a number of day columns
// while its resolution sets the rows within each day; every other style counts
// buckets of its own resolution.
export const timeSeriesLengthUnit = (options: ITimeSeriesOptions): ITimeSeriesResolution =>
  options.style === 'heatmap' ? 'DAY' : options.resolution

// Whether a span fits inside the plan's log limit. An unknown limit — it is
// absent until the organization loads, and unparsable durations come back
// invalid rather than throwing — restricts nothing, so the settings page offers
// every span instead of greying all of them out until the account arrives.
export const withinLogLimit = (limitDuration: Duration, unit: string, length: number) =>
  !limitDuration.isValid || limitDuration.valueOf() >= Duration.fromObject({ [unit]: length }).valueOf()

// The longest span the log limit covers. Until the limit is known it picks the
// shortest instead of the longest: asking for more history than the plan holds
// is the direction that fails, and the length is corrected as soon as the
// organization lands. Never undefined — timeSeriesRequest() would carry that
// through to the query as NaN.
export const findLongestLength = (limitDuration: Duration, resolution: string) => {
  const lengths = TimeSeriesLengths[resolution]
  if (!limitDuration.isValid) return lengths[0]
  const allowed = lengths.filter(length => withinLogLimit(limitDuration, resolution, length))
  return allowed[allowed.length - 1] ?? lengths[0]
}

export const connectionTypes = ['USAGE', 'CONNECT_DURATION', 'CONNECT', 'DISCONNECT']
export const secondResolutions = ['SECOND', 'MINUTE', 'HOUR']

// A device is online or it isn't, around the clock, so the hour-of-day grid has
// something to say about it: an absolute color scale makes a device that is only
// up two hours a day read as pale at a glance, where a bar graph auto-scales to
// the device's own peak and hides it. The list column costs the same either
// way — listTimeSeriesOptions collapses a heat map back to one bucket per day.
export const defaultDeviceTimeSeries: ITimeSeriesOptions = {
  type: 'ONLINE_DURATION',
  resolution: 'HOUR',
  length: 7,
  style: 'heatmap',
}

// Connections are occasional rather than continuous, so most cells in a service
// heat map are empty and the daily bars read better. Still switchable per the
// graph style setting.
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
// ever enabled in TimeSeriesAvailableResolutions. Its span is picked in days,
// which is what TimeSeriesLengths.DAY already offers.
export const TimeSeriesHeatmapResolutions: ITimeSeriesResolution[] = ['HOUR']

const resolutionSeconds = (resolution: ITimeSeriesResolution) => Duration.fromObject({ [resolution]: 1 }).as('seconds')

export const heatmapRows = (resolution: ITimeSeriesResolution) =>
  Math.max(Math.round(resolutionSeconds('DAY') / resolutionSeconds(resolution)), 1)

// What to actually ask the API for. Its window ends at the bucket in progress,
// so every graph fetches one period beyond the span it shows and drops it in
// trimIncomplete() — otherwise the last bar is always short by however much of
// the period has yet to run, and a heat map's first column opens partway
// through a day. A grid of sub-day rows fetches a second spare day on top: a
// DST fall-back day is 25 hours, so `length` whole days can need an hour more
// than `length * rows` and the oldest column would come up one cell short.
export const timeSeriesRequest = (options: ITimeSeriesOptions): ITimeSeriesOptions => {
  const rows = options.style === 'heatmap' ? heatmapRows(options.resolution) : 1
  return { ...options, length: (options.length + (rows > 1 ? 2 : 1)) * rows }
}

// The GraphQL variables a list query resolves to. The list draws day buckets
// whatever style the details view is set to, so switching style over the same
// span lands on the same query — which is how devices.setTimeSeries knows a
// refetch would return the data it already has.
export const listTimeSeriesKey = (options: ITimeSeriesOptions) => {
  const { type, resolution, length } = timeSeriesRequest(listTimeSeriesOptions(options))
  return `${type}-${resolution}-${length}`
}

// Drop the period still in progress, at the boundary where the payload is
// normalized so no consumer has to know the request ran long. A heat map draws
// a column per day, so the whole day in progress goes — dropping only its
// latest bucket would leave a short column, and in the midnight hour it would
// discard a complete day instead.
export const trimIncomplete = (data: ITimeSeries): ITimeSeries => {
  const last = data.time[data.time.length - 1]
  if (!last) return data
  const lastDay = localDayKey(last)
  const keep =
    data.style === 'heatmap' ? data.time.findIndex(time => localDayKey(time) === lastDay) : data.time.length - 1
  if (keep < 1) return data
  return { ...data, end: data.time[keep], time: data.time.slice(0, keep), data: data.data.slice(0, keep) }
}

// Local calendar day, as a value that can key a lookup. Plain Date getters
// rather than luxon: they read the same system zone (nothing sets
// Settings.defaultZone) and this runs once per bucket, up to 744 of them.
const localDayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

// Heat cells are colored on an absolute scale so two devices are directly
// comparable — a full bucket is 100% for a percentage type and the bucket's own
// duration for a time type. Event counts have no ceiling, so they auto-scale.
export const timeSeriesFullScale = (type: ITimeSeriesType, resolution: ITimeSeriesResolution): number | undefined => {
  const { unit, scale } = TimeSeriesTypeScale[type]
  if (unit === '%') return scale
  if (unit === 'time') return resolutionSeconds(resolution)
  return undefined
}

// Reduced rather than spread through Math.max: a comparison skips a null or
// undefined bucket the way d3.max does, where spreading one in returns NaN and
// takes the whole scale with it.
export const timeSeriesMax = (data: number[]) => data.reduce((max, value) => (value > max ? value : max), 0.1)

// "Last 30 days" — the span a graph is showing, in its own largest unit. A heat
// map counts the day columns it draws rather than measuring the fetched window,
// which still carries the partial day the grid windows off and would round up.
// `days` defaults to the series' own stamp; a view mid-load passes the span it
// is drawing so the caption describes the grid on screen rather than the data
// being replaced.
export const timeSeriesSpanLabel = (data: ITimeSeries, days = data.style === 'heatmap' ? data.days : undefined) => {
  const span = days ? Duration.fromObject({ days }).toMillis() : data.end.getTime() - data.start.getTime()
  return humanizeDuration(span, {
    largest: 1,
    round: true,
    units: [days ? 'd' : humanizeResolutionLookup[data.resolution || 'DAY']],
  })
}

// Fold a series into day columns for the heat map. `rows` is the number of cells
// per column — 24 for hour buckets, or 1 to collapse each day into a single
// strip cell, which is what the list column does so it stays one row tall no
// matter which resolution the details page last fetched. `days` is how many
// columns to keep, dropping the partial day the request opened in the middle of.
export const heatmapGrid = (data: ITimeSeries, rows: number, days: number): ITimeSeriesGrid => {
  const average = TimeSeriesTypeScale[data.type]?.unit === '%'
  const keys: string[] = []
  const buckets: ILookup<ITimeSeriesCell[][]> = {}

  data.time.forEach((time, i) => {
    const key = localDayKey(time)
    if (!buckets[key]) {
      keys.push(key)
      buckets[key] = Array.from({ length: rows }, () => [] as ITimeSeriesCell[])
    }
    // Rows are clock position within the local day, so a cell always means the
    // same time of day. The hour a DST jump skips stays empty and the hour it
    // repeats collects both buckets.
    const clock = time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds()
    const row = Math.min(Math.floor((clock / 86400) * rows), rows - 1)
    buckets[key][row].push({ date: time, value: data.data[i] ?? 0 })
  })

  const windowed = days > 0 ? keys.slice(-days) : keys
  // Always `days` columns, padded in front so the newest day stays at the right
  // edge. A device with less history than the span then draws its days at the
  // grid's own cell size against an empty month, rather than stretching a
  // handful of fat columns across the full width as if it had a month of them.
  const padding = days > 0 ? Math.max(days - windowed.length, 0) : 0

  return {
    columns: [
      ...Array.from({ length: padding }, (_, i) => ({ key: `empty-${i}`, cells: new Array(rows).fill(undefined) })),
      ...windowed.map(key => ({
        key,
        cells: buckets[key].map(cells => {
          if (!cells.length) return undefined
          const total = cells.reduce((sum, cell) => sum + cell.value, 0)
          return { date: cells[0].date, value: average ? total / cells.length : total }
        }),
      })),
    ],
  }
}

// Collapse a series to one bucket per local day. The list column asks for daily
// buckets, but a device whose details page has been opened holds the hourly ones
// that view needed, and drawing 744 bars into a 100px column is neither readable
// nor cheap.
export const toDailySeries = (data: ITimeSeries, days: number): ITimeSeries => {
  const cells = heatmapGrid(data, 1, days)
    .columns.map(column => column.cells[0])
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

// Switching style re-scopes resolution and length, since a bar graph counts
// buckets of its own resolution and a heat map counts days. Either way it lands
// on the longest span the plan's log limit allows rather than silently asking
// for more than it has.
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

// A series carries the options it was fetched with, so changing the setting
// leaves the previous one on screen until the refetch lands. The heat map is the
// case that shows: daily buckets cannot fill an hour-of-day grid.
// Whether a series has the sub-day buckets a heat map grid needs. Its negation
// is what "still loading" means for a heat map, so both read from here.
export const isHeatmapSeries = (data?: ITimeSeries) => data?.style === 'heatmap' && heatmapRows(data.resolution) > 1

export const timeSeriesLoading = (data: ITimeSeries | undefined, options: ITimeSeriesOptions) =>
  options.style === 'heatmap' && !isHeatmapSeries(data)

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
