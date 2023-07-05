import React, { useContext } from 'react'
import { DeviceListContext } from '../services/Context'
import { humanizeResolutionLookup, TimeSeriesTypeLookup } from '../helpers/dateHelper'
import { IconButton } from '../buttons/IconButton'
import { spacing } from '../styling'
import { Box } from '@mui/material'
import humanize from 'humanize-duration'

export const GraphColumn: React.FC = () => {
  const { device } = useContext(DeviceListContext)

  return (
    <>
      {device?.timeSeries && (
        <Box position="absolute" right={spacing.lg}>
          <IconButton
            title={
              TimeSeriesTypeLookup[device.timeSeries.type] +
              ' last ' +
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
      )}
      Graph
    </>
  )
}
