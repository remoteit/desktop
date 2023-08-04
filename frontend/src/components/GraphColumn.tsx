import React, { useContext } from 'react'
import { DeviceListContext } from '../services/Context'
import { humanizeResolutionLookup, TimeSeriesTypeLookup } from '../helpers/dateHelper'
import { IconButton } from '../buttons/IconButton'
import { spacing } from '../styling'
import { Box } from '@mui/material'
import humanize from 'humanize-duration'

export const GraphColumn: React.FC = () => {
  const { device } = useContext(DeviceListContext)
  if (!device?.timeSeries) return <>Graph</>
  return (
    <>
      {TimeSeriesTypeLookup[device.timeSeries.type]}
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
            humanize(device.timeSeries.end.getTime() - device.timeSeries.start.getTime(), {
              largest: 1,
              round: true,
              units: [humanizeResolutionLookup[device.timeSeries.resolution || 'DAY']],
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
