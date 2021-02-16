import React from 'react'
import { emit } from '../../services/Controller'
import { DynamicButton } from '../DynamicButton'
import { Color } from '../../styling'
import { Fade } from '@material-ui/core'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = {
  service?: IService
  connection?: IConnection
  color?: Color
  size?: 'icon' | 'medium' | 'small'
}

export const DisconnectButton: React.FC<Props> = ({ service, size = 'medium', color = 'primary', connection }) => {
  const hidden = !connection || !connection.connected
  const disconnecting = !connection?.enabled && !!connection?.connected
  return (
    <Fade in={!hidden} timeout={600}>
      <div>
        <DynamicButton
          title={disconnecting ? 'Stopping' : 'Disconnect'}
          icon="ban"
          disabled={disconnecting}
          loading={disconnecting}
          color={disconnecting ? 'grayDark' : color}
          size={size}
          onClick={() => {
            analyticsHelper.trackConnect('connectionClosed', service)
            emit('service/disconnect', connection)
          }}
        />
      </div>
    </Fade>
  )
}
