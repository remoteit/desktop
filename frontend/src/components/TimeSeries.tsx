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
import { BarGraph } from './BarGraph'
import { HeatGraph, HeatColor, HEATMAP_CELL, useHeatCells } from './HeatGraph'
import { Typography, Stack, Box } from '@mui/material'
import { Timestamp } from './Timestamp'
import { radius } from '../styling'

const heatColor = (type?: ITimeSeriesType, online?: boolean): HeatColor =>
  type && connectionTypes.includes(type) ? 'primary' : online ? 'success' : 'gray'

// Only fold hourly buckets a heat map asked for — a bar graph set to Hour wants
// its hours kept. Memoized so BarGraph's own memo survives a hover.
const useDailyBars = (timeSeries?: ITimeSeries) =>
  React.useMemo(
    () => (isHeatmapSeries(timeSeries) ? toDailySeries(timeSeries!, timeSeries!.days ?? 1) : timeSeries),
    [timeSeries]
  )

// The list column: a bare strip of bars whatever style the details view uses.
// It has no axis to read a scale off, so it uses the bucket's absolute ceiling
// — a device barely ever up otherwise draws the same as one always up.
export const TimeSeries: React.FC<{ timeSeries?: ITimeSeries; online?: boolean }> = ({ timeSeries, online }) => {
  const bars = useDailyBars(timeSeries)
  if (!bars) return null
  return (
    <BarGraph data={bars} color={heatColor(bars.type, online)} max={timeSeriesFullScale(bars.type, bars.resolution)} />
  )
}

const HOUR_LABELS = [0, 6, 12, 18]

type DetailProps = {
  timeSeries?: ITimeSeries
  online?: boolean
  // The options being asked for, which lead the ones the series was fetched
  // with — see timeSeriesLoading.
  options: ITimeSeriesOptions
}

export const TimeSeriesDetail: React.FC<DetailProps> = ({ timeSeries, online, options }) => {
  // A heat map reports position and the value is read back out of `cells`, so
  // the readout stays current. Bars have no such array and report the value.
  const [hoveredCell, setHoveredCell] = React.useState<[number, number]>()
  const [hoveredBar, setHoveredBar] = React.useState<[Date, number]>()
  const bars = useDailyBars(timeSeries)

  const heatmap = options.style === 'heatmap'
  const loading = timeSeriesLoading(timeSeries, options)
  // While loading the series can't describe the grid it is about to become, so
  // the shape comes from the request and nothing moves when it lands.
  const shape = loading ? options : { resolution: timeSeries?.resolution ?? 'DAY', length: timeSeries?.days ?? 1 }
  const days = shape.length
  const rows = heatmapRows(shape.resolution)
  const color = heatColor(timeSeries?.type, online)

  const cells = useHeatCells(timeSeries, rows, days, color, !heatmap || loading)

  if (!timeSeries || !bars) return null

  const max = timeSeriesMax(bars.data)
  const height = rows * HEATMAP_CELL
  const cell = heatmap ? hoveredCell && cells[hoveredCell[0]]?.[hoveredCell[1]] : undefined
  const readout = heatmap
    ? cell && { date: cell.date, value: cell.value, fill: cell.fill }
    : hoveredBar && { date: hoveredBar[0], value: hoveredBar[1], fill: undefined }

  const axis = heatmap
    ? HOUR_LABELS.map(hour => (
        <Typography
          key={hour}
          variant="caption"
          sx={{
            position: 'absolute',
            right: 0,
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
          {heatmap ? (
            <HeatGraph cells={cells} rows={rows} days={days} loading={loading} onHover={setHoveredCell} />
          ) : (
            <BarGraph data={bars} color={color} height={40} width={200} max={max} onHover={setHoveredBar} />
          )}
          <Typography variant="caption" textAlign="center">
            Last&nbsp;{timeSeriesSpanLabel(heatmap ? timeSeries : bars, heatmap ? days : undefined)}
          </Typography>
        </Stack>
        {/* Always laid out, only hidden — appearing on hover would reflow the
            graph and everything under it as the row wraps. */}
        <Box marginBottom={3} flexGrow={1} minWidth={120} sx={{ visibility: readout ? 'visible' : 'hidden' }}>
          {/* Rendered whenever the graph is a heat map, not only while hovering,
              so the readout keeps its height and nothing below it moves. */}
          {heatmap && (
            <Box
              width={50}
              height={50}
              marginBottom={1}
              borderRadius={`${radius.sm}px`}
              sx={{ backgroundColor: readout?.fill }}
            />
          )}
          <Typography variant="caption">
            {readout ? (
              <Timestamp
                date={readout.date}
                variant={secondResolutions.includes(heatmap ? shape.resolution : bars.resolution) ? 'minutes' : 'short'}
              />
            ) : (
              ' '
            )}
          </Typography>
          <Typography variant="caption" color={`${color}.main`} component="div" fontWeight={500}>
            {readout ? formatValue(timeSeries.type, readout.value) : ' '}
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
