import React from 'react'
import {
  TimeSeriesTypeScale,
  connectionTypes,
  heatmapRows,
  isHeatmapSeries,
  timeSeriesLoading,
  hourLabel,
  humanizeDuration as humanize,
  secondResolutions,
  timeSeriesFullScale,
  timeSeriesMax,
  timeSeriesSpanLabel,
  toDailySeries,
} from '../helpers/dateHelper'
import { BarGraph, BarGraphProps } from './BarGraph'
import { HeatGraph, HeatColor } from './HeatGraph'
import { Typography, Stack, Box } from '@mui/material'
import { Timestamp } from './Timestamp'
import { radius } from '../styling'

// Cells are square, so one size sets both axes: the hour rows give the height
// and the day columns give the width. A shorter span then draws a narrower
// graph rather than stretching its days into wide rectangles.
const HEATMAP_CELL = 7

type Props = Omit<BarGraphProps, 'data' | 'min'> & {
  timeSeries?: ITimeSeries
  online?: boolean
  size?: 'large' | 'small'
  // The options being asked for, which lead the ones the series was fetched
  // with: hourly buckets can always be folded into daily ones, so switching to
  // bars needs no new data. The other direction can't, which is what makes a
  // series "loading" — see timeSeriesLoading.
  options?: ITimeSeriesOptions
}

export const TimeSeries: React.FC<Props> = ({ timeSeries, online, size = 'small', options, ...props }) => {
  const [display, setDisplay] = React.useState<[Date, number, string?]>()

  // Hourly buckets only exist because a heat map asked for them, so those are
  // the ones safe to fold — a bar graph set to Hour wants its hours kept. Held
  // across renders so BarGraph's own memo isn't invalidated on every hover.
  const bars = React.useMemo(
    () => (isHeatmapSeries(timeSeries) ? toDailySeries(timeSeries!, timeSeries!.days ?? 1) : timeSeries),
    [timeSeries]
  )

  if (!timeSeries || !bars) return null

  const color: HeatColor = connectionTypes.includes(timeSeries.type) ? 'primary' : online ? 'success' : 'gray'
  const heatmap = (options?.style ?? timeSeries.style) === 'heatmap'
  const loading = !!options && timeSeriesLoading(timeSeries, options)
  // Loading means the series can't describe the grid it is about to become, so
  // the shape comes from the request instead and nothing moves when it lands.
  const shape = loading && options ? options : { resolution: timeSeries.resolution, length: timeSeries.days ?? 1 }
  const days = shape.length

  // The list is always bars, whatever style the details view is set to, and the
  // column has no axis to read a scale off — so they use the absolute ceiling
  // for the bucket rather than each device's own peak, which made a device that
  // is barely ever up draw the same as one that is always up. Event counts have
  // no ceiling and fall back to BarGraph's own per-series default.
  if (size === 'small')
    return <BarGraph {...props} data={bars} color={color} max={timeSeriesFullScale(bars.type, bars.resolution)} />

  const max = timeSeriesMax(bars.data)
  // Rows come from the request while loading, since there is no data to read
  // them off yet, and the grid is laid out at the size it is about to be. Day
  // resolution reaching the details view — a list fetch writes over a loaded
  // device's hourly series — is what timeSeriesLoading catches, so by here a
  // heat map always has its 24 rows.
  const rows = heatmapRows(shape.resolution)
  const height = heatmap ? rows * HEATMAP_CELL : 40

  // Both styles wear the same chrome — a left axis, the graph, a span caption
  // and the hover readout — so only these two pieces differ.
  const axis = heatmap
    ? [0, 6, 12, 18].map(hour => (
        <Typography
          key={hour}
          variant="caption"
          sx={{
            position: 'absolute',
            right: 0,
            // centered on the band of cells covering that hour, whatever the
            // row count works out to
            top: ((hour + 0.5) / 24) * height,
            transform: 'translateY(-50%)',
            lineHeight: 1,
          }}
        >
          {hourLabel(hour)}
        </Typography>
      ))
    : [max, 0].map((value, i) => (
        <Typography key={i} variant="caption" textAlign="right">
          {formatValue(timeSeries.type, value, true)}
        </Typography>
      ))

  const graph = heatmap ? (
    <HeatGraph
      {...props}
      data={timeSeries}
      rows={rows}
      days={days}
      color={color}
      max={timeSeriesFullScale(timeSeries.type, timeSeries.resolution)}
      loading={loading}
      width={days * HEATMAP_CELL}
      height={height}
      onHover={setDisplay}
    />
  ) : (
    <BarGraph {...props} data={bars} color={color} height={40} width={200} max={max} min={0} onHover={setDisplay} />
  )

  return (
    <Stack direction="row" flexWrap="nowrap">
      <Stack
        width={60}
        minWidth={60}
        marginRight={1}
        marginBottom={heatmap ? 0 : 3}
        height={heatmap ? height : 45}
        position={heatmap ? 'relative' : 'static'}
        justifyContent="space-between"
      >
        {axis}
      </Stack>
      <Stack direction="row" flexWrap="wrap">
        <Stack spacing={0.5} marginRight={2}>
          {graph}
          <Typography variant="caption" textAlign="center">
            Last&nbsp;{timeSeriesSpanLabel(heatmap ? timeSeries : bars, heatmap ? days : undefined)}
          </Typography>
        </Stack>
        {/* Always laid out, only hidden — appearing on hover would reflow the
            graph and everything under it as the row wraps. */}
        <Box marginBottom={3} flexGrow={1} minWidth={120} sx={{ visibility: display ? 'visible' : 'hidden' }}>
          {/* Rendered whenever the graph is a heat map, not only while hovering,
              so the readout keeps its height and nothing below it moves. */}
          {heatmap && (
            <Box
              width={50}
              height={50}
              marginBottom={1}
              borderRadius={`${radius.sm}px`}
              sx={{ backgroundColor: display?.[2] }}
            />
          )}
          <Typography variant="caption">
            {display ? (
              <Timestamp
                date={display[0]}
                variant={secondResolutions.includes(heatmap ? shape.resolution : bars.resolution) ? 'minutes' : 'short'}
              />
            ) : (
              '\u00a0'
            )}
          </Typography>
          <Typography variant="caption" color={`${color}.main`} component="div" fontWeight={500}>
            {display ? formatValue(timeSeries.type, display[1]) : '\u00a0'}
          </Typography>
        </Box>
      </Stack>
    </Stack>
  )
}

const formatValue = (type: ITimeSeriesType, value: number, isYAxis = false) => {
  const scale = TimeSeriesTypeScale[type]

  switch (scale.unit) {
    case '%':
      return Math.round(value) + '%'
    case 'time':
      return humanize(value * 1000, { largest: isYAxis ? 1 : 2, round: isYAxis })
    case 'events':
      return value === 0 ? 'No events' : value === 1 ? '1 event' : `${value} events`
  }
}
