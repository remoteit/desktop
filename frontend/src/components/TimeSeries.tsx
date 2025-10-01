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
  const [display, setDisplay] = React.useState<[Date, number]>()

  if (!timeSeries) return null

  const color = connectionTypes.includes(timeSeries.type) ? 'primary' : online ? 'success' : 'gray'
  const max = Math.max(d3.max(timeSeries.data) ?? 0, 0.1)
  const min = 0

  if (variant === 'small') return <BarGraph {...props} data={timeSeries} color={color} max={max} />

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
