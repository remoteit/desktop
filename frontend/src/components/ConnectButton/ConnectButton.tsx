import React from 'react'
import { IService } from 'remote.it'
import { Dispatch } from '../../store'
import { IconButton, Tooltip } from '@material-ui/core'
import { useDispatch } from 'react-redux'
import { Icon } from '../Icon'

export type ConnectButtonProps = {
  connection?: ConnectionInfo
  service?: IService
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({ connection, service }) => {
  const dispatch = useDispatch<Dispatch>()
  if (connection || !service || service.state !== 'active') return null
  return (
    <Tooltip title="Connect">
      <IconButton disabled={service.connecting} color="primary" onClick={() => dispatch.devices.connect(service)}>
        <Icon name="arrow-right" weight="regular" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
