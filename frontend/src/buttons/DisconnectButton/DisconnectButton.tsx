import React from 'react'
import { emit } from '../../services/Controller'
import { DynamicButton } from '../DynamicButton'
import { Color } from '../../styling'
import { Fade } from '@material-ui/core'
import analytics from '../../helpers/Analytics'

type Props = {
  service?: IService
  connection?: IConnection
  color?: Color
  size?: 'icon' | 'medium' | 'small'
}

export const DisconnectButton: React.FC<Props> = ({ service, size = 'medium', color = 'primary', connection }) => {
  const hidden = !connection || !connection.active
  const connecting = !!connection?.connecting
  return (
    <Fade in={!hidden} timeout={600}>
      <div>
        <DynamicButton
          title={connecting ? 'Connecting' : 'Disconnect'}
          icon="ban"
          loading={connecting}
          color={connecting ? 'grayDark' : color}
          size={size}
          onClick={() => {
            analytics.trackConnect('connectionClosed', service)
            emit('service/disconnect', connection)
          }}
        />
      </div>
    </Fade>
  )
}
