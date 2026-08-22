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
} from '../helpers/dateHelper'
import { BarGraph, BarGraphProps } from './BarGraph'
import { HeatGraph, HeatColor } from './HeatGraph'
import { Typography, Stack, Box } from '@mui/material'
import { Timestamp } from './Timestamp'

// 7px per hour row over 24 rows, wide enough for a month of day columns.
const HEATMAP_HEIGHT = 168
const HEATMAP_WIDTH = 240

type Props = Omit<BarGraphProps, 'data' | 'min'> & {
  timeSeries?: ITimeSeries
  online?: boolean
  size?: 'large' | 'small'
}

export const TimeSeries: React.FC<Props> = ({ timeSeries, online, size = 'small', ...props }) => {
  const [display, setDisplay] = React.useState<[Date, number]>()

  if (!timeSeries) return null

  const color: HeatColor = connectionTypes.includes(timeSeries.type) ? 'primary' : online ? 'success' : 'gray'
  const heatmap = timeSeries.style === 'heatmap'
  const days = timeSeries.days ?? 1

  // The list is always bars, whatever style the details view is set to, and they
  // are scaled to the absolute ceiling for the bucket — a full day of uptime, or
  // 100% — rather than to each device's own peak. The column has no axis to read
  // a scale off, so auto-scaling made a device that is barely ever up draw the
  // same as one that is always up. Event counts have no ceiling and still scale
  // to themselves.
  if (size === 'small')
    return (
      <BarGraph
        {...props}
        data={timeSeries}
        color={color}
        max={timeSeriesFullScale(timeSeries.type, timeSeries.resolution) ?? timeSeriesMax(timeSeries.data)}
      />
    )

  const max = timeSeriesMax(timeSeries.data)
  // A heat map needs sub-day buckets to have a grid to draw. Day resolution can
  // reach the details view — a list fetch writes over a loaded device's hourly
  // series — and one row is a strip, so it gets a strip's height and no hour
  // axis rather than a single 168px band.
  const rows = heatmapRows(timeSeries.resolution)
  const grid = heatmap && rows > 1
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
      width={HEATMAP_WIDTH}
      height={height}
      onHover={setDisplay}
    />
  ) : (
    <BarGraph
      {...props}
      data={timeSeries}
      color={color}
      height={40}
      width={200}
      max={max}
      min={0}
      onHover={setDisplay}
    />
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
            Last&nbsp;{timeSeriesSpanLabel(timeSeries)}
          </Typography>
        </Stack>
        {display && (
          <Box marginBottom={3} flexGrow={1} minWidth={150}>
            <Typography variant="caption">
              <Timestamp
                date={display[0]}
                variant={secondResolutions.includes(timeSeries.resolution) ? 'minutes' : 'short'}
              />
            </Typography>
            <Typography variant="caption" color={`${color}.main`} component="div" fontWeight={500}>
              {formatValue(timeSeries.type, display[1])}
            </Typography>
          </Box>
        )}
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
