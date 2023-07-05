import React from 'react'
import { humanizeResolutionLookup, connectionTypes, secondResolutions, getDuration } from '../helpers/dateHelper'
import { BarGraph, BarGraphProps } from './BarGraph'
import { Typography, Stack, Box } from '@mui/material'
import { IconButton } from '../buttons/IconButton'
import { Timestamp } from './Timestamp'
import humanize from 'humanize-duration'

type Props = Omit<BarGraphProps, 'data'> & {
  timeSeries?: ITimeSeries
  online?: boolean
  variant?: 'large' | 'small'
}

export const TimeSeries: React.FC<Props> = ({ timeSeries, online, variant = 'small', ...props }) => {
  const color = connectionTypes.includes(timeSeries?.type || '') ? 'primary' : online ? 'success' : 'grayDark'
  const [display, setDisplay] = React.useState<[Date, number]>()
  const max = getDuration(timeSeries?.resolution || 'DAY').as('seconds')

  if (!timeSeries) return null

  if (variant === 'small')
    return (
      <Stack>
        <BarGraph {...props} data={timeSeries} color={color} max={max} />
      </Stack>
    )

  return (
    <Stack spacing={0.5} paddingBottom={1}>
      <Stack spacing={1} direction="row" flexWrap="wrap">
        <BarGraph
          {...props}
          data={timeSeries}
          color={color}
          height={40}
          width={200}
          max={max}
          onHover={(value?: [Date, number]) => setDisplay(value)}
        />
        <Stack spacing={2} height={40}>
          {display ? (
            <Box marginLeft={1}>
              <Timestamp
                date={display[0]}
                variant={secondResolutions.includes(timeSeries.resolution) ? 'numeric' : 'short'}
              />
              <Box>{humanize(display[1] * 1000, { largest: 2 })}</Box>
            </Box>
          ) : (
            <IconButton name="sliders" color="grayDark" title="configure" to="/settings/graphs" />
          )}
        </Stack>
      </Stack>
      <Typography variant="caption">
        Last&nbsp;
        {humanize(timeSeries.end.getTime() - timeSeries.start.getTime(), {
          largest: 1,
          round: true,
          units: [humanizeResolutionLookup[timeSeries.resolution || 'DAY']],
        })}
      </Typography>
    </Stack>
  )
}
