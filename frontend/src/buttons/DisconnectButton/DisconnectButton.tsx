import React from 'react'
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

  if (!visible) return null

  if (connecting || disabled) color = 'grayDark'

  let title = 'Stop '
  if (state === 'ready') title = 'Stop'
  if (state === 'starting') title = 'Starting...'
  if (state === 'stopping') title = 'Removing...'
  if (state === 'connecting') title = 'Connecting...'
  if (state === 'offline') title = 'Offline'
  if (state === 'disconnecting') title = 'Disconnecting...'

  return (
    <DynamicButton
      title={title}
      variant="text"
      loading={disabled || connecting}
      color={color}
      size={size}
      fullWidth={fullWidth}
      onClick={() => {
        analyticsHelper.trackConnect('connectionClosed', service)
        connections.disconnect(connection)
      }}
    />
  )
}
