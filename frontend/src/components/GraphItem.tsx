import React from 'react'
import { Duration } from 'luxon'
import { Typography, Collapse } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { timeSeriesStyleLabel, timeSeriesWithStyle } from '../helpers/dateHelper'
import { selectTimeSeries } from '../selectors/ui'
import { selectLimit } from '../selectors/organizations'
import { Dispatch, State } from '../store'
import { TimeSeries } from './TimeSeries'
import { GraphTitle } from './GraphTitle'
import { IconButton } from '../buttons/IconButton'
import { Gutters } from './Gutters'
import { Title } from './Title'

interface Props {
  service?: IService
  device?: IDevice
}

export const GraphItem: React.FC<Props> = ({ service, device }) => {
  const dispatch = useDispatch<Dispatch>()
  const variant = service ? 'service' : 'device'
  const instance = service || device
  const options = useSelector((state: State) => selectTimeSeries(state)[`${variant}TimeSeries`])
  const logLimit = useSelector((state: State) => selectLimit(state, undefined, 'log-limit'))
  const next: ITimeSeriesStyle = options.style === 'heatmap' ? 'bar' : 'heatmap'

  if (!instance) return null

  // Sets the same preference the graph settings page does rather than a
  // temporary override, so the choice sticks and there is only one place the
  // style can come from. The series carries the options it was fetched with, so
  // the loaded devices have to go back for data at the new resolution.
  const onToggle = async () => {
    await dispatch.ui.setPersistent({
      [`${variant}TimeSeries`]: timeSeriesWithStyle(options, next, Duration.fromISO(logLimit?.value)),
    })
    await dispatch.devices.clearLoaded()
    if (variant === 'device') await dispatch.devices.fetchList()
  }

  return (
    <Collapse in={!!instance.timeSeries}>
      <Gutters bottom={null}>
        <Typography variant="subtitle2" marginRight={-2} gutterBottom>
          <Title>
            <GraphTitle variant={variant} />
          </Title>
          <IconButton
            name={next === 'heatmap' ? 'grid-2' : 'chart-column'}
            color="grayDarker"
            title={timeSeriesStyleLabel(next)}
            onClick={onToggle}
          />
          <IconButton name="sliders" color="grayDarker" title="configure" to="/settings/graphs" />
        </Typography>
        <TimeSeries timeSeries={instance.timeSeries} online={instance.state === 'active'} size="large" />
      </Gutters>
    </Collapse>
  )
}
