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
  const visible = !!connection?.enabled
  const disabled = state === 'stopping' || state === 'disconnecting'

  if (connecting || disabled) color = 'grayDark'

  let title = 'Stop Connection'
  if (state === 'ready') title = 'Remove Connection'
  if (state === 'stopping') title = 'Stopping'
  if (state === 'connecting') title = 'Starting'
  if (state === 'offline') title = 'Offline'
  if (state === 'disconnecting') title = 'Disconnecting'

  return (
    <Fade in={visible} timeout={600}>
      <div>
        <DynamicButton
          title={title}
          // disabled={disabled}
          loading={disabled || connecting}
          color={color}
          size={size}
          fullWidth={fullWidth}
          onClick={() => {
            analyticsHelper.trackConnect('connectionClosed', service)
            connection?.public
              ? connections.proxyDisconnect(connection)
              : emit(
                  state === 'ready' || state === 'offline' || state === 'disconnecting'
                    ? 'service/disable'
                    : 'service/disconnect',
                  connection
                )
          }}
        />
      </div>
    </Fade>
  )
}
