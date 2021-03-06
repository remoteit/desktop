import React from 'react'
import { emit } from '../../services/Controller'
import { Fade } from '@material-ui/core'
import { Color } from '../../styling'
import { DynamicButton } from '../DynamicButton'
import { connectionState } from '../../helpers/connectionHelper'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = {
  service?: IService
  connection?: IConnection
  color?: Color
  size?: 'icon' | 'medium' | 'small'
}

export const DisconnectButton: React.FC<Props> = ({ service, size = 'medium', color = 'primary', connection }) => {
  const state = connectionState(service, connection)
  const visible = state === 'connecting' || state === 'connected'
  const disabled = state === 'stopping' || state === 'connecting'
  return (
    <Fade in={visible} timeout={600}>
      <div>
        <DynamicButton
          title={state === 'stopping' || state === 'connecting' ? state : 'Disconnect'}
          icon="ban"
          disabled={disabled}
          loading={disabled}
          color={disabled ? 'grayDark' : color}
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
