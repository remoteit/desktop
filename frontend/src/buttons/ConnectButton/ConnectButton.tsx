import React, { useEffect, useState } from 'react'
import { connectionState } from '../../helpers/connectionHelper'
import { newConnection } from '../../helpers/connectionHelper'
import { DynamicButton } from '../DynamicButton'
import { Color } from '../../styling'
import { Fade } from '@material-ui/core'
import { emit } from '../../services/Controller'
import heartbeat from '../../services/Heartbeat'
import analyticsHelper from '../../helpers/analyticsHelper'

export type ConnectButtonProps = {
  connection?: IConnection
  service?: IService
  size?: 'icon' | 'medium' | 'small' | 'large'
  color?: Color
  autoConnect?: boolean
  fullWidth?: boolean
  onClick?: () => void
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({
  connection,
  service,
  size = 'medium',
  color = 'grayDarker',
  autoConnect,
  fullWidth,
  onClick,
}) => {
  const [autoStart, setAutoStart] = useState<boolean>(!!autoConnect)
  const state = connectionState(service, connection)
  const visible = state === 'stopping' || state === 'disconnected'
  const connecting = state === 'connecting'
  const stopping = state === 'stopping'

  const clickHandler = () => {
    heartbeat.caffeinate()
    if (connecting) {
      analyticsHelper.trackConnect('connectionClosed', service)
      emit('service/disconnect', connection)
    } else {
      onClick && onClick()
      analyticsHelper.trackConnect('connectionInitiated', service)
      emit('service/connect', connection || newConnection(service))
    }
  }

  useEffect(() => {
    if (autoStart && service) {
      setAutoStart(false)
      clickHandler()
    }
  })

  let title = 'Create Connection'
  let disabled = false
  let variant: 'text' | 'outlined' | 'contained' | undefined

  if (service?.license === 'EVALUATION') {
    color = 'warning'
    title = 'Evaluation'
    variant = 'text'
  }
  if (service?.license === 'UNLICENSED') {
    color = 'grayLight'
    title = 'Unlicensed'
    disabled = true
    variant = 'text'
  }

  if (state === 'ready') {
    title = 'Starting'
    color = 'grayDarker'
  }
  if (stopping) {
    title = 'Stopping'
    color = 'grayDark'
  }
  if (connecting) {
    title = 'Starting'
    color = 'grayDark'
  }

  return (
    <Fade in={visible} timeout={600}>
      <div>
        <DynamicButton
          title={title}
          variant={variant}
          loading={connecting || stopping}
          color={color}
          size={size}
          onClick={clickHandler}
          disabled={disabled}
          fullWidth={fullWidth}
        />
      </div>
    </Fade>
  )
}
