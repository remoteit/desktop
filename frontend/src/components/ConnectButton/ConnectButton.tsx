import React from 'react'
import BackendAdaptor from '../../services/BackendAdapter'
import { newConnection } from '../../helpers/connectionHelper'
import { IService } from 'remote.it'
import { IconButton, Tooltip } from '@material-ui/core'
import { Icon } from '../Icon'

export type ConnectButtonProps = {
  connection?: IConnection
  service?: IService
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({ connection, service }) => {
  if ((connection && connection.active) || !service || service.state !== 'active') return null
  const disabled: boolean = !!(connection && connection.connecting)
  return (
    <Tooltip title="Connect">
      <span>
        <IconButton
          disabled={disabled}
          color="primary"
          onClick={() => BackendAdaptor.emit('service/connect', connection || newConnection(service))}
        >
          <Icon name="arrow-right" weight="regular" size="md" fixedWidth />
        </IconButton>
      </span>
    </Tooltip>
  )
}
