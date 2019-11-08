import React from 'react'
import BackendAdaptor from '../../services/BackendAdapter'
import { setConnection } from '../../helpers/connectionHelper'
import { IService } from 'remote.it'
import { ApplicationState } from '../../store'
import { IconButton, Tooltip } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { Icon } from '../Icon'

export type ConnectButtonProps = {
  connection?: IConnection
  service?: IService
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({ connection, service }) => {
  const devices = useSelector((state: ApplicationState) => state.devices.all)
  if ((connection && connection.pid) || !service || service.state !== 'active') return null
  const disabled: boolean = !!(connection && connection.connecting)
  return (
    <Tooltip title="Connect">
      <IconButton
        disabled={disabled}
        color="primary"
        onClick={() => {
          if (!connection) setConnection(service.id)
          BackendAdaptor.emit('service/connect', service.id)
        }}
      >
        <Icon name="arrow-right" weight="regular" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
