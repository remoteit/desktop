import React from 'react'
import { Typography, Divider, Tooltip } from '@mui/material'
import { selectNetworkByService } from '../models/networks'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { Icon } from './Icon'

type Props = {
  instance?: IInstance
  service: IService
}

export const NetworksIndicator: React.FC<Props> = ({ instance, service }) => {
  const joinedNetworks = useSelector((state: ApplicationState) => selectNetworkByService(state, service.id))

  if (!joinedNetworks.length || !instance?.permissions.includes('MANAGE') || instance.shared) return null

  return (
    <Tooltip
      arrow
      placement="left"
      title={
        <>
          Networks
          <Divider />
          {joinedNetworks.map((n, i) => (
            <div key={i}>{n.name}</div>
          ))}
        </>
      }
    >
      <Typography variant="caption" color="grayDarker.main">
        <Icon name="chart-network" size="xxs" inlineLeft />
        {joinedNetworks.length > 1 ? joinedNetworks.length.toLocaleString() : undefined}
      </Typography>
    </Tooltip>
  )
}
