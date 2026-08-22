import React from 'react'
import { useTranslation } from 'react-i18next'
import { Container } from '../components/Container'
import { humanizeDays } from '../models/plans'
import { Dispatch, State } from '../store'
import { selectLimit } from '../selectors/organizations'
import { selectTimeSeries, selectTimeSeriesDefaults } from '../selectors/ui'
import { useDispatch, useSelector } from 'react-redux'
import { TimeSeriesSelect } from '../components/TimeSeriesSelect'
import { PlanActionChip } from '../components/PlanActionChip'
import { Typography } from '@mui/material'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

export const GraphsPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { t } = useTranslation()
  const logLimit = useSelector((state: State) => selectLimit(state, undefined, 'log-limit'))
  const timeSeriesDefaults = useSelector((state: State) => selectTimeSeriesDefaults(state))
  const { deviceTimeSeries, serviceTimeSeries } = useSelector((state: State) => selectTimeSeries(state))

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1" gutterBottom>
          <Title>{t('graphsPage.title', 'Graphs')}</Title>
        </Typography>
      }
    >
      <Notice severity="info" button={<PlanActionChip />} gutterTop>
        {humanizeDays(logLimit?.value)} {t('graphsPage.logsAvailable', 'of logs are available with your plan.')}{' '}
        <em>{t('graphsPage.updateToSeeMore', 'Update to see more.')}</em>
      </Notice>
      <Typography variant="subtitle1">{t('graphsPage.deviceListAndDetails', 'Device list and details')}</Typography>
      <TimeSeriesSelect
        timeSeriesOptions={deviceTimeSeries}
        logLimit={logLimit?.value}
        defaults={timeSeriesDefaults.deviceTimeSeries}
        onChange={value => dispatch.devices.setTimeSeries({ variant: 'device', options: value })}
      />
      <Typography variant="subtitle1">{t('graphsPage.serviceDetails', 'Service details')}</Typography>
      <TimeSeriesSelect
        timeSeriesOptions={serviceTimeSeries}
        logLimit={logLimit?.value}
        defaults={timeSeriesDefaults.serviceTimeSeries}
        onChange={value => dispatch.devices.setTimeSeries({ variant: 'service', options: value })}
      />
    </Container>
  )
}
