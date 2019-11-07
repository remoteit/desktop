import React from 'react'
import BackendAdaptor from '../../services/BackendAdapter'
import { IService } from 'remote.it'
import { Dispatch } from '../../store'
import { IconButton, Tooltip } from '@material-ui/core'
import { useDispatch } from 'react-redux'
import { Icon } from '../Icon'

export type ConnectButtonProps = {
  connection?: IConnection
  service?: IService
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({ connection, service }) => {
  const dispatch = useDispatch<Dispatch>()
  if ((connection && connection.pid) || !service || service.state !== 'active') return null
  const disabled: boolean = !!(connection && connection.connecting)
  return (
    <Tooltip title="Connect">
      <IconButton
        disabled={disabled}
        color="primary"
        onClick={() => BackendAdaptor.emit('service/connect', service.id)}
      >
        <Icon name="arrow-right" weight="regular" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
