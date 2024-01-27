import React from 'react'
import { Container } from '../components/Container'
import { selectLimit, humanizeDays } from '../models/plans'
import { Dispatch, State } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import { TimeSeriesSelect } from '../components/TimeSeriesSelect'
import { PlanActionChip } from '../components/PlanActionChip'
import { Typography } from '@mui/material'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

const defaultDeviceTimeSeries: ITimeSeriesOptions = {
  type: 'ONLINE_DURATION',
  resolution: 'DAY',
  length: 7,
}
const defaultServiceTimeSeries: ITimeSeriesOptions = {
  type: 'CONNECT_DURATION',
  resolution: 'DAY',
  length: 7,
}

export const GraphsPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { timeSeries, logLimit } = useSelector((state: State) => ({
    timeSeries: state.ui,
    logLimit: selectLimit('log-limit', state) || 'P1W',
  }))

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1" gutterBottom>
          <Title>Graphs</Title>
        </Typography>
      }
    >
      <Notice severity="info" button={<PlanActionChip />} gutterTop>
        {humanizeDays(logLimit)} of logs are available with your plan. <em>Update to see more.</em>
      </Notice>
      <Typography variant="subtitle1">Device list and details</Typography>
      <TimeSeriesSelect
        timeSeriesOptions={timeSeries.deviceTimeSeries}
        logLimit={logLimit}
        defaults={defaultDeviceTimeSeries}
        onChange={async value => {
          await dispatch.ui.setPersistent({ deviceTimeSeries: value })
          await dispatch.devices.fetchList()
        }}
      />
      <Typography variant="subtitle1">Service details</Typography>
      <TimeSeriesSelect
        timeSeriesOptions={timeSeries.serviceTimeSeries}
        logLimit={logLimit}
        defaults={defaultServiceTimeSeries}
        onChange={async value => {
          await dispatch.ui.setPersistent({ serviceTimeSeries: value })
          await dispatch.devices.clearLoaded()
        }}
      />
    </Container>
  )
}
