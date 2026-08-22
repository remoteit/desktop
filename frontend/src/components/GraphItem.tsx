import React from 'react'
import { Typography, Collapse } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { timeSeriesStyleLabel, timeSeriesTypeLabel } from '../helpers/dateHelper'
import { selectTimeSeries } from '../selectors/ui'
import { Dispatch, State } from '../store'
import { TimeSeriesDetail } from './TimeSeries'
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
  const next: ITimeSeriesStyle = options.style === 'heatmap' ? 'bar' : 'heatmap'

  if (!instance) return null

  return (
    <Collapse in={!!instance.timeSeries}>
      <Gutters bottom={null}>
        <Typography variant="subtitle2" marginRight={-2} gutterBottom>
          <Title>{timeSeriesTypeLabel(options.type)}</Title>
          {/* Sets the same preference the graph settings page does rather than a
              temporary override, so the choice sticks and the style has only one
              source. */}
          <IconButton
            name={next === 'heatmap' ? 'table-cells' : 'chart-column'}
            color="grayDarker"
            title={timeSeriesStyleLabel(next)}
            onClick={() => dispatch.devices.setTimeSeriesStyle({ variant, style: next })}
          />
          <IconButton name="sliders" color="grayDarker" title="configure" to="/settings/graphs" />
        </Typography>
        <TimeSeriesDetail timeSeries={instance.timeSeries} online={instance.state === 'active'} options={options} />
      </Gutters>
    </Collapse>
  )
}
