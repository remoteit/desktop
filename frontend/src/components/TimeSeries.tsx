import React from 'react'
import {
  TimeSeriesTypeScale,
  humanizeResolutionLookup,
  connectionTypes,
  secondResolutions,
} from '../helpers/dateHelper'
import { BarGraph, BarGraphProps } from './BarGraph'
import { Typography, Stack, Box } from '@mui/material'
import { Timestamp } from './Timestamp'
import humanize from 'humanize-duration'
import * as d3 from 'd3'

type Props = Omit<BarGraphProps, 'data'> & {
  timeSeries?: ITimeSeries
  online?: boolean
  variant?: 'large' | 'small'
}

export const TimeSeries: React.FC<Props> = ({ timeSeries, online, variant = 'small', ...props }) => {
  const color = connectionTypes.includes(timeSeries?.type || '') ? 'primary' : online ? 'success' : 'grayDark'
  const [display, setDisplay] = React.useState<[Date, number]>()

  if (!timeSeries) return null

  const max = Math.max(d3.max(timeSeries?.data), 0.1)
  const min = 0 // Math.max(d3.min(timeSeries?.data), 0)

  if (variant === 'small') return <BarGraph {...props} data={timeSeries} color={color} max={max} />

  return (
    <Stack direction="row">
      <Stack maxWidth={60} minWidth={20} marginBottom={3} marginRight={1} height={45} justifyContent="space-between">
        <Typography variant="caption" textAlign="right">
          {yAxisDisplay(timeSeries, max)}
        </Typography>
        <Typography variant="caption" textAlign="right">
          {yAxisDisplay(timeSeries, min)}
        </Typography>
      </Stack>
      <Stack spacing={0.5} marginRight={2}>
        <BarGraph
          {...props}
          data={timeSeries}
          color={color}
          height={40}
          width={200}
          max={max}
          min={min}
          onHover={(value?: [Date, number]) => setDisplay(value)}
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
        <Box marginBottom={3}>
          <Typography variant="caption">
            <Timestamp
              date={display[0]}
              variant={secondResolutions.includes(timeSeries.resolution) ? 'minutes' : 'short'}
            />
          </Typography>
          <Typography variant="caption" color={`${color}.main`} component="div" fontWeight={500}>
            {barDisplay(timeSeries.type, display[1])}
          </Typography>
        </Box>
      )}
    </Stack>
  )
}

function barDisplay(type: ITimeSeriesType, value: number) {
  const scale = TimeSeriesTypeScale[type]
  switch (scale.unit) {
    case '%':
      return Math.round(value) + '%'
    case 'time':
      return humanize(value * 1000, { largest: 2 })
    case 'events':
      return value === 0 ? 'No events' : value === 1 ? '1 event' : value + ' events'
  }
}

function yAxisDisplay(timeSeries: ITimeSeries, max: number) {
  const scale = TimeSeriesTypeScale[timeSeries.type]
  switch (scale.unit) {
    case '%':
      return Math.round(max) + '%'
    case 'time':
      return humanize(max * 1000, { largest: 1, round: true })
    case 'events':
      return max === 0 ? 'No Events' : max === 1 ? '1 Event' : max + ' Events'
  }
}
