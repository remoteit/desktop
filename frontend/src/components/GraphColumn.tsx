import React from 'react'
import { timeSeriesSpanLabel, timeSeriesTypeLabel } from '../helpers/dateHelper'
import { IconButton } from '../buttons/IconButton'
import { Box } from '@mui/material'

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
          title={'Last ' + timeSeriesSpanLabel(timeSeries)}
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
