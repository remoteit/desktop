import React from 'react'
import BackendAdaptor from '../../services/BackendAdapter'
import { newConnection } from '../../helpers/connectionHelper'
import { IService } from 'remote.it'
import { ApplicationState } from '../../store'
import { IconButton, Tooltip } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { Icon } from '../Icon'

export type ConnectButtonProps = {
  connection?: IConnection
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({ connection }) => {
  if (connection && connection.active) return null
  const disabled: boolean = !!(connection && connection.connecting)
  return (
    <Tooltip title="Connect">
      <IconButton
        disabled={disabled}
        color="primary"
        onClick={() => BackendAdaptor.emit('service/connect', connection)}
      >
        <Icon name="arrow-right" weight="regular" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
