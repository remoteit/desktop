import React from 'react'
import { Typography, Collapse } from '@mui/material'
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
  const variant = service ? 'service' : 'device'
  const instance = service || device

  if (!instance) return null

  return (
    <Collapse in={!!instance.timeSeries}>
      <Gutters bottom={null}>
        <Typography variant="subtitle2" marginRight={-2} gutterBottom>
          <Title>
            <GraphTitle variant={variant} />
          </Title>
          <IconButton name="sliders" color="grayDarker" title="configure" to="/settings/graphs" />
        </Typography>
        <TimeSeries timeSeries={instance.timeSeries} online={instance.state === 'active'} variant="large" />
      </Gutters>
    </Collapse>
  )
}
