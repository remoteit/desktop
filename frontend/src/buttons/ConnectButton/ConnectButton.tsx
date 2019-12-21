import React from 'react'
import Controller from '../../services/Controller'
import { newConnection } from '../../helpers/connectionHelper'
import { IService } from 'remote.it'
import { IconButton, Tooltip, Button } from '@material-ui/core'
import { Icon } from '../../components/Icon'

export type ConnectButtonProps = {
  connection?: IConnection
  service?: IService
  fullSize?: boolean
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({ connection, service, fullSize }) => {
  if ((connection && connection.active) || !service || service.state !== 'active') return null
  const disabled: boolean = !!(connection && connection.connecting)
  const ConnectIcon = <Icon name="arrow-right" weight="regular" size="md" fixedWidth inline={fullSize} />
  const connect = () => Controller.emit('service/connect', connection || newConnection(service))

  if (fullSize)
    return (
      <Button variant="contained" onClick={connect} color="primary" disabled={disabled} size="medium">
        Connect
        {ConnectIcon}
      </Button>
    )

  return (
    <Tooltip title="Connect">
      <span>
        <IconButton disabled={disabled} color="primary" onClick={connect}>
          {ConnectIcon}
        </IconButton>
      </span>
    </Tooltip>
  )
}
