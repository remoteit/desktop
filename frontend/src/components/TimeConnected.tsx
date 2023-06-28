import React from 'react'
import { Timestamp } from './Timestamp'
import { Typography, Stack, Box } from '@mui/material'
// import { SparkLine, SparkLineProps } from './SparkLine'
import { BarChart, BarChartProps } from './BarChart'
import humanize from 'humanize-duration'

type Props = Omit<BarChartProps, 'data'> & {
  timeSeries?: ITimeSeries
}

export const TimeConnected: React.FC<Props> = ({ timeSeries, ...props }) => {
  const [display, setDisplay] = React.useState<[Date, number]>()
  if (!timeSeries) return null

  const handleHover = (value?: [Date, number]) => setDisplay(value)

  return (
    <Stack spacing={1} paddingBottom={1}>
      <Typography variant="caption">Last 30 days</Typography>
      <Stack direction="row">
        <BarChart {...props} data={timeSeries} color="primary" onHover={handleHover} width={200} height={40} />
        {display && (
          <Stack marginLeft={2} spacing={1}>
            <Timestamp date={display[0]} variant="short" />
            <Box>{humanize(display[1] * 1000, { largest: 2 })}</Box>
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}
