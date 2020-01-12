import React from 'react'
import Controller from '../../services/Controller'
import { IService } from 'remote.it'
import { newConnection } from '../../helpers/connectionHelper'
import { DynamicButton } from '../DynamicButton'
import { Color } from '../../styling'
import { Fade } from '@material-ui/core'

export type ConnectButtonProps = {
  connection?: IConnection
  service?: IService
  size?: 'icon' | 'medium' | 'small'
  color?: Color
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({
  connection,
  service,
  size = 'medium',
  color = 'success',
}) => {
  const hidden = (connection && connection.active) || !service || service.state !== 'active'
  const disabled: boolean = !!(connection && connection.connecting)
  const connect = () => Controller.emit('service/connect', connection || newConnection(service))

  return (
    <Fade in={!hidden} timeout={600}>
      <div>
        <DynamicButton
          title="Connect"
          icon="exchange"
          color={color}
          disabled={disabled}
          size={size}
          onClick={connect}
        />
      </div>
    </Fade>
  )
}
