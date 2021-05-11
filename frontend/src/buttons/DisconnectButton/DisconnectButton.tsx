import React from 'react'
import { emit } from '../../services/Controller'
import { Fade } from '@material-ui/core'
import { Color } from '../../styling'
import { DynamicButton } from '../DynamicButton'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
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
  color = 'primary',
  connection,
  fullWidth,
}) => {
  const { connections } = useDispatch<Dispatch>()
  const state = connectionState(service, connection)
  const connecting = state === 'connecting'
  const visible = state === 'connecting' || state === 'connected' || state === 'ready'
  const disabled = state === 'stopping'

  if (connecting) color = 'grayDark'

  let title = 'Stop Connection'
  if (state === 'ready') title = 'Remove Connection'
  if (state === 'stopping') title = 'Stopping'
  if (state === 'connecting') title = 'Starting'

  return (
    <Fade in={visible} timeout={600}>
      <div>
        <DynamicButton
          title={title}
          disabled={disabled}
          loading={disabled || connecting}
          color={color}
          size={size}
          fullWidth={fullWidth}
          onClick={() => {
            analyticsHelper.trackConnect('connectionClosed', service)
            connection?.public
              ? connections.proxyDisconnect(connection)
              : emit(state === 'ready' ? 'service/disable' : 'service/disconnect', connection)
          }}
        />
      </div>
    </Fade>
  )
}
