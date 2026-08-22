import React from 'react'
import {
  TimeSeriesTypeScale,
  connectionTypes,
  heatmapRows,
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

// 7px per hour row over 24 rows, wide enough for a month of day columns.
const HEATMAP_HEIGHT = 168
const HEATMAP_WIDTH = 240

type Props = Omit<BarGraphProps, 'data' | 'min'> & {
  timeSeries?: ITimeSeries
  online?: boolean
  size?: 'large' | 'small'
  // The options being asked for, which lead the ones the series was fetched
  // with: hourly buckets can always be folded into daily ones, so switching to
  // bars needs no new data. `loading` covers the other direction, where they
  // can't, and the grid then takes its shape from these rather than from a
  // series that cannot describe it.
  options?: ITimeSeriesOptions
  loading?: boolean
}

export const TimeSeries: React.FC<Props> = ({ timeSeries, online, size = 'small', options, loading, ...props }) => {
  const [display, setDisplay] = React.useState<[Date, number, string?]>()

  if (!timeSeries) return null

  const color: HeatColor = connectionTypes.includes(timeSeries.type) ? 'primary' : online ? 'success' : 'gray'
  const fetchedAsHeatmap = timeSeries.style === 'heatmap'
  const heatmap = (options?.style ?? timeSeries.style) === 'heatmap'
  // Loading means the series can't describe the grid it is about to become, so
  // the shape comes from the request instead and nothing moves when it lands.
  const shape = loading && options ? options : { resolution: timeSeries.resolution, length: timeSeries.days ?? 1 }
  const days = shape.length

  // Hourly buckets only exist because a heat map asked for them, so those are
  // the ones safe to fold — a bar graph set to Hour wants its hours kept.
  const daily = () =>
    fetchedAsHeatmap && heatmapRows(timeSeries.resolution) > 1 ? toDailySeries(timeSeries, days) : timeSeries

  // The list is always bars, whatever style the details view is set to, and they
  // are scaled to the absolute ceiling for the bucket — a full day of uptime, or
  // 100% — rather than to each device's own peak. The column has no axis to read
  // a scale off, so auto-scaling made a device that is barely ever up draw the
  // same as one that is always up. Event counts have no ceiling and still scale
  // to themselves.
  if (size === 'small') {
    // A heat map's details view leaves hourly buckets on the device; the column
    // only ever asked for one per day, so fold them back down rather than
    // drawing a bar per hour.
    const bars = daily()
    return (
      <BarGraph
        {...props}
        data={bars}
        color={color}
        max={timeSeriesFullScale(bars.type, bars.resolution) ?? timeSeriesMax(bars.data)}
      />
    )
  }

  const bars = daily()
  const max = timeSeriesMax(bars.data)
  // A heat map needs sub-day buckets to have a grid to draw. Day resolution can
  // reach the details view — a list fetch writes over a loaded device's hourly
  // series — and one row is a strip, so it gets a strip's height and no hour
  // axis rather than a single 168px band. While loading there is no data to go
  // on, so the grid is laid out at the size it is about to be.
  const rows = heatmapRows(shape.resolution)
  const grid = heatmap && (loading || rows > 1)
  const height = grid ? HEATMAP_HEIGHT : 40

  // Both styles wear the same chrome — a left axis, the graph, a span caption
  // and the hover readout — so only these two pieces differ.
  const axis = grid
    ? [0, 6, 12, 18].map(hour => (
        <Typography
          key={hour}
          variant="caption"
          sx={{
            position: 'absolute',
            right: 0,
            // centered on the band of cells covering that hour, whatever the
            // row count works out to
            top: ((hour + 0.5) / 24) * HEATMAP_HEIGHT,
            transform: 'translateY(-50%)',
            lineHeight: 1,
          }}
        >
          {hourLabel(hour)}
        </Typography>
      ))
    : heatmap
    ? null
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
      width={HEATMAP_WIDTH}
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
        marginBottom={grid ? 0 : 3}
        height={grid ? HEATMAP_HEIGHT : 45}
        position={grid ? 'relative' : 'static'}
        justifyContent="space-between"
      >
        {axis}
      </Stack>
      <Stack direction="row" flexWrap="wrap">
        <Stack spacing={0.5} marginRight={2}>
          {graph}
          <Typography variant="caption" textAlign="center">
            Last&nbsp;{timeSeriesSpanLabel(heatmap ? timeSeries : bars)}
          </Typography>
        </Stack>
        {/* Always laid out, only hidden — appearing on hover would reflow the
            graph and everything under it as the row wraps. */}
        <Box marginBottom={3} flexGrow={1} minWidth={150} sx={{ visibility: display ? 'visible' : 'hidden' }}>
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
                variant={secondResolutions.includes(bars.resolution) ? 'minutes' : 'short'}
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
