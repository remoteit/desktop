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
  size?: 'icon' | 'medium' | 'small' | 'large'
  fullWidth?: boolean
}

export const DisconnectButton: React.FC<Props> = ({
  service,
  size = 'medium',
  color = 'grayDarker',
  connection,
  fullWidth,
}) => {
  const state = connectionState(service, connection)
  const visible = state === 'connecting' || state === 'connected' || state === 'ready'
  const disabled = state === 'stopping' || state === 'connecting'
  return (
    <Fade in={visible} timeout={600}>
      <div>
        <DynamicButton
          title={state === 'stopping' || state === 'connecting' ? state : 'Remove Connection'}
          // icon="ban"
          disabled={disabled}
          loading={disabled}
          color={disabled ? 'grayDark' : color}
          size={size}
          fullWidth={fullWidth}
          onClick={() => {
            analyticsHelper.trackConnect('connectionClosed', service)
            emit('service/disconnect', connection)
          }}
        />
      </div>
    </Fade>
  )
}
