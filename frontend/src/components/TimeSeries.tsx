import React from 'react'
import {
  TimeSeriesTypeScale,
  humanizeResolutionLookup,
  connectionTypes,
  heatmapRows,
  secondResolutions,
  timeSeriesFullScale,
} from '../helpers/dateHelper'
import { BarGraph, BarGraphProps } from './BarGraph'
import { HeatGraph } from './HeatGraph'
import { Typography, Stack, Box } from '@mui/material'
import { Timestamp } from './Timestamp'
import { humanizeDuration as humanize } from '../helpers/dateHelper'
import { selectTimeSeries } from '../selectors/ui'
import { useSelector } from 'react-redux'
import { State } from '../store'
import * as d3 from 'd3'

// 7px per hour row over 24 rows, wide enough for a month of day columns.
const HEATMAP_HEIGHT = 168
const HEATMAP_WIDTH = 240

type Props = Omit<BarGraphProps, 'data'> & {
  timeSeries?: ITimeSeries
  online?: boolean
  size?: 'large' | 'small'
  variant?: 'device' | 'service'
}

export const TimeSeries: React.FC<Props> = ({ timeSeries, online, size = 'small', variant = 'device', ...props }) => {
  const [display, setDisplay] = React.useState<[Date, number]>()
  const style = useSelector((state: State) => selectTimeSeries(state)[`${variant}TimeSeries`].style)

  if (!timeSeries) return null

  const color = connectionTypes.includes(timeSeries.type) ? 'primary' : online ? 'success' : 'gray'
  const max = Math.max(d3.max(timeSeries.data) ?? 0, 0.1)
  const min = 0

  if (style === 'heatmap') {
    // The list strip is always one row per day — the details page may have left
    // hourly buckets in the store for this device, and they would be unreadable
    // squeezed into the column's height.
    const rows = size === 'small' ? 1 : heatmapRows(timeSeries.resolution)
    const scale = timeSeriesFullScale(timeSeries.type, rows === 1 ? 'DAY' : timeSeries.resolution)

    if (size === 'small') return <HeatGraph {...props} data={timeSeries} rows={1} color={color} max={scale} />

    return (
      <Stack direction="row" flexWrap="nowrap">
        <Box width={60} minWidth={60} marginRight={1} height={HEATMAP_HEIGHT} position="relative">
          {[0, 6, 12, 18].map(hour => (
            <Typography
              key={hour}
              variant="caption"
              sx={{
                position: 'absolute',
                right: 0,
                // centered on the band of cells covering that hour, whatever
                // the row count works out to
                top: ((hour + 0.5) / 24) * HEATMAP_HEIGHT,
                transform: 'translateY(-50%)',
                lineHeight: 1,
              }}
            >
              {hour.toString().padStart(2, '0')}:00
            </Typography>
          ))}
        </Box>
        <Stack direction="row" flexWrap="wrap">
          <Stack spacing={0.5} marginRight={2}>
            <HeatGraph
              {...props}
              data={timeSeries}
              rows={rows}
              color={color}
              max={scale}
              width={HEATMAP_WIDTH}
              height={HEATMAP_HEIGHT}
              onHover={setDisplay}
            />
            <Typography variant="caption" textAlign="center">
              Last&nbsp;
              {humanize(timeSeries.end.getTime() - timeSeries.start.getTime(), {
                largest: 1,
                round: true,
                units: ['d'],
              })}
            </Typography>
          </Stack>
          {display && (
            <Box marginBottom={3} flexGrow={1} minWidth={150}>
              <Typography variant="caption">
                <Timestamp date={display[0]} variant="minutes" />
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

  if (size === 'small') return <BarGraph {...props} data={timeSeries} color={color} max={max} />

  return (
    <Stack direction="row" flexWrap="nowrap">
      <Stack width={60} minWidth={60} marginBottom={3} marginRight={1} height={45} justifyContent="space-between">
        {[max, min].map((value, i) => (
          <Typography key={i} variant="caption" textAlign="right">
            {formatValue(timeSeries.type, value, true)}
          </Typography>
        ))}
      </Stack>
      <Stack direction="row" flexWrap="wrap">
        <Stack spacing={0.5} marginRight={2}>
          <BarGraph
            {...props}
            data={timeSeries}
            color={color}
            height={40}
            width={200}
            max={max}
            min={min}
            onHover={setDisplay}
          />
          <Typography variant="caption" textAlign="center">
            Last&nbsp;
            {humanize(timeSeries.end.getTime() - timeSeries.start.getTime(), {
              largest: 1,
              round: true,
              units: [humanizeResolutionLookup[timeSeries.resolution || 'DAY']],
            })}
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
