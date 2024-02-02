import React from 'react'
import { Divider, Tooltip } from '@mui/material'
import { selectNetworkByService } from '../selectors/networks'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { Icon } from './Icon'

type Props = {
  instance?: IInstance
  service: IService
}

export const NetworksIndicator: React.FC<Props> = ({ instance, service }) => {
  const joinedNetworks = useSelector((state: State) => selectNetworkByService(state, service.id))

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
      <Icon name="chart-network" size="xxs" color="grayDark" inlineLeft />
    </Tooltip>
  )
}
