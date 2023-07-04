import React from 'react'
import { humanizeResolutionLookup, limitTimeSeries, TimeSeriesTypeLookup } from '../helpers/dateHelper'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { spacing } from '../styling'
import { Box } from '@mui/material'
import humanize from 'humanize-duration'

export const GraphColumn: React.FC = () => {
  const limit = useSelector((state: ApplicationState) => limitTimeSeries(state, state.ui.deviceTimeSeries))

  return (
    <>
      <Box position="absolute" right={spacing.lg}>
        <IconButton
          title={
            TimeSeriesTypeLookup[limit.type] +
            ' last ' +
            (limit.start &&
              humanize(Date.now() - limit.start.getTime(), {
                largest: 1,
                round: true,
                units: [humanizeResolutionLookup[limit.resolution || 'DAY']],
              }))
          }
          name="sliders"
          color="grayDark"
          to="/settings/graphs"
          buttonBaseSize="small"
          size="sm"
        />
      </Box>
      Graph
    </>
  )
}
