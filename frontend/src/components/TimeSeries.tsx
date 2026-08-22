import React from 'react'
import {
  TimeSeriesTypeScale,
  connectionTypes,
  heatmapRows,
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

type Props = Omit<BarGraphProps, 'data'> & {
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

  if (size === 'small')
    return heatmap ? (
      // The list strip is always one row per day — a device whose details page
      // has been opened holds hourly buckets, and they would be unreadable
      // squeezed into the column's height.
      <HeatGraph
        {...props}
        data={timeSeries}
        rows={1}
        days={days}
        color={color}
        max={timeSeriesFullScale(timeSeries.type, 'DAY')}
      />
    ) : (
      <BarGraph {...props} data={timeSeries} color={color} max={timeSeriesMax(timeSeries.data)} />
    )

  const max = timeSeriesMax(timeSeries.data)

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
            top: ((hour + 0.5) / 24) * HEATMAP_HEIGHT,
            transform: 'translateY(-50%)',
            lineHeight: 1,
          }}
        >
          {hour.toString().padStart(2, '0')}:00
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
      rows={heatmapRows(timeSeries.resolution)}
      days={days}
      color={color}
      max={timeSeriesFullScale(timeSeries.type, timeSeries.resolution)}
      width={HEATMAP_WIDTH}
      height={HEATMAP_HEIGHT}
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
        marginBottom={heatmap ? 0 : 3}
        height={heatmap ? HEATMAP_HEIGHT : 45}
        position={heatmap ? 'relative' : 'static'}
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
