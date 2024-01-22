import React from 'react'
import { humanizeResolutionLookup, TimeSeriesTypeLookup } from '../helpers/dateHelper'
import { IconButton } from '../buttons/IconButton'
import { Box } from '@mui/material'
import humanize from 'humanize-duration'

export const GraphColumn: React.FC<{ title: string; timeSeries?: ITimeSeries }> = ({ title, timeSeries }) => {
  if (!timeSeries) return <>{title}</>
  return (
    <>
      {TimeSeriesTypeLookup[timeSeries.type]}
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
