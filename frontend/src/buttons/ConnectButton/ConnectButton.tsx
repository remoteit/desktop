import React from 'react'
import { emit } from '../../services/Controller'
import { newConnection } from '../../helpers/connectionHelper'
import { DynamicButton } from '../DynamicButton'
import { Color } from '../../styling'
import { Fade } from '@material-ui/core'
import analytics, { CONNECTION_TYPE_FAILOVER } from '../../helpers/Analytics'

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
  const hidden = connection?.active || !service || service.state !== 'active'
  const connecting = !!connection?.connecting
  const connect = () => {
    let theConnection = connection || newConnection(service)
    analytics.trackConnect('connectionInitiated', service)
    emit('service/connect', theConnection)
  }

  return (
    <Fade in={!hidden} timeout={600}>
      <div>
        <DynamicButton
          title={connecting ? 'Connecting' : 'Connect'}
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
