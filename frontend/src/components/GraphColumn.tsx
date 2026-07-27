import React from 'react'
import { humanizeResolutionLookup, timeSeriesTypeLabel } from '../helpers/dateHelper'
import { IconButton } from '../buttons/IconButton'
import { Box } from '@mui/material'
import { humanizeDuration as humanize } from '../helpers/dateHelper'

export const GraphColumn: React.FC<{ title: string; timeSeries?: ITimeSeries }> = ({ title, timeSeries }) => {
  if (!timeSeries) return <>{title}</>
  return (
    <>
      {timeSeriesTypeLabel(timeSeries.type)}
      <Box
        className="hoverHide"
        sx={{
          top: -2,
          right: 26,
          bgcolor: 'white.main',
          position: 'absolute',
          paddingLeft: 1,
        }}
      >
        <IconButton
          title={
            'Last ' +
            humanize(timeSeries.end.getTime() - timeSeries.start.getTime(), {
              largest: 1,
              round: true,
              units: [humanizeResolutionLookup[timeSeries.resolution || 'DAY']],
            })
          }
          name="sliders"
          color="grayDark"
          to="/settings/graphs"
          buttonBaseSize="small"
          size="sm"
        />
      </Box>
    </>
  )
}
