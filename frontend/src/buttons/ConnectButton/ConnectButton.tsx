import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { connectionState, sanitizeName } from '../../helpers/connectionHelper'
import { newConnection } from '../../helpers/connectionHelper'
import { DynamicButton } from '../DynamicButton'
import { licenseChip } from '../../models/licensing'
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
  const { connections } = useDispatch<Dispatch>()
  const chip = service && licenseChip[service.license]
  const state = connectionState(service, connection)
  const visible = !connection?.enabled
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
      connection = connection || newConnection(service)
      connection.name = sanitizeName(connection?.name || '')
      connection.host = ''
      connection?.public ? connections.proxyConnect(connection) : emit('service/connect', connection)
    }
  }

  useEffect(() => {
    if (autoStart && service) {
      setAutoStart(false)
      clickHandler()
    }
  })

  let title = 'Add to Network'
  let disabled = false
  let variant: 'text' | 'outlined' | 'contained' | undefined

  if (chip && chip.show) {
    color = chip.colorName
    title = chip.disabled ? chip.name : title
    disabled = !!chip.disabled
    variant = 'text'
  }

  if (state === 'ready') {
    title = 'Connecting'
    color = 'grayDarker'
  }
  if (stopping) {
    title = 'Removing'
    color = 'grayDark'
  }
  if (connecting) {
    title = 'Connecting'
    color = 'grayDark'
  }
  if (state === 'offline') {
    title = 'Offline'
    disabled = true
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
