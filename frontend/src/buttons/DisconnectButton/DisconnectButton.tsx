import React from 'react'
import { emit } from '../../services/Controller'
import { DynamicButton } from '../DynamicButton'
import { Color } from '../../styling'
import { Fade } from '@material-ui/core'
import analytics from '../../helpers/Analytics'
import { IService } from 'remote.it'

type Props = {
  disabled?: boolean
  service?: IService
  connection?: IConnection
  color?: Color
  size?: 'icon' | 'medium' | 'small'
}

export const DisconnectButton: React.FC<Props> = ({
  disabled = false,
  service,
  size = 'icon',
  color = 'primary',
  connection,
}) => {
  const hidden = !connection || connection.connecting || !connection.active
  return (
    <Fade in={!hidden} timeout={600}>
      <div>
        <DynamicButton
          title="Disconnect"
          icon="ban"
          color={color}
          disabled={disabled}
          size={size}
          onClick={() => {
            let context = {
              connectionType: 'peer',
              serviceId: service?.id,
              serviceName: service?.name,
              serviceType: service?.typeID,
            }
            analytics.track('connectionClosed', context)
            emit('service/disconnect', connection)
          }}
        />
      </div>
    </Fade>
  )
}
