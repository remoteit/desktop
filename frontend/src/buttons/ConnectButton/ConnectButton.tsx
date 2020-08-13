import React from 'react'
import { emit } from '../../services/Controller'
import { newConnection } from '../../helpers/connectionHelper'
import { DynamicButton } from '../DynamicButton'
import { Color } from '../../styling'
import { Fade } from '@material-ui/core'
import heartbeat from '../../services/Heartbeat'
import analytics from '../../helpers/Analytics'

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
  color = 'secondary',
}) => {
  const hidden = connection?.active || !service || service.state !== 'active'
  const connecting = !!connection?.connecting
  const clickHandler = () => {
    heartbeat.caffeinate()

    if (connecting) {
      analytics.trackConnect('connectionClosed', service)
      emit('service/disconnect', connection)
    } else {
      analytics.trackConnect('connectionInitiated', service)
      emit('service/connect', connection || newConnection(service))
    }
  }

  return (
    <Fade in={!hidden} timeout={600}>
      <div>
        <DynamicButton
          title={connecting ? 'Connecting' : 'Connect'}
          icon="exchange"
          loading={connecting}
          color={connecting ? undefined : color}
          size={size}
          onClick={clickHandler}
        />
      </div>
    </Fade>
  )
}
