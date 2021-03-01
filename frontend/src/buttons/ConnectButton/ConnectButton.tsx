import React, { useEffect, useState } from 'react'
import { newConnection } from '../../helpers/connectionHelper'
import { DynamicButton } from '../DynamicButton'
import { Color } from '../../styling'
import { Fade } from '@material-ui/core'
import { emit } from '../../services/Controller'
import analyticsHelper from '../../helpers/analyticsHelper'

export type ConnectButtonProps = {
  connection?: IConnection
  service?: IService
  size?: 'icon' | 'medium' | 'small' | 'large'
  color?: Color
  autoConnect?: boolean
  fullWidth?: boolean
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({
  connection,
  service,
  size = 'medium',
  color = 'primary',
  autoConnect,
  fullWidth,
}) => {
  const [autoStart, setAutoStart] = useState<boolean>(!!autoConnect)
  const hidden = connection?.connected || service?.state !== 'active'
  const connecting = !!connection?.connecting
  const listening = connection?.enabled && !connection.connected

  const clickHandler = () => {
    if (connecting) {
      analyticsHelper.trackConnect('connectionClosed', service)
      emit('service/disconnect', connection)
    } else {
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

  let title = 'Connect'
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

  if (listening) {
    title = 'Waiting'
    color = 'primary'
  }

  return (
    <Fade in={!hidden} timeout={600}>
      <div>
        <DynamicButton
          title={connecting ? 'Connecting' : title}
          icon="arrow-right"
          variant={variant}
          loading={connecting}
          color={connecting ? 'grayDark' : color}
          size={size}
          onClick={clickHandler}
          disabled={disabled}
          fullWidth={fullWidth}
        />
      </div>
    </Fade>
  )
}
