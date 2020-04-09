import React from 'react'
import { emit } from '../../services/Controller'
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
  const connecting = !!(connection && connection.pid && !connection.active)
  const connect = () => emit('service/connect', connection || newConnection(service))

  return (
    <Fade in={!hidden} timeout={600}>
      <div>
        <DynamicButton
          title={connecting ? 'Connecting ...' : 'Connect'}
          icon="exchange"
          loading={connecting}
          color={color}
          disabled={connecting}
          size={size}
          onClick={connect}
        />
      </div>
    </Fade>
  )
}
