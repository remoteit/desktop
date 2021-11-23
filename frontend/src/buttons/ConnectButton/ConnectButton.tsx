import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { connectionState, sanitizeName } from '../../helpers/connectionHelper'
import { getLicenseChip } from '../../components/LicenseChip'
import { newConnection } from '../../helpers/connectionHelper'
import { DynamicButton } from '../DynamicButton'
import { useHistory } from 'react-router-dom'
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
  const { connections, ui } = useDispatch<Dispatch>()
  const history = useHistory()
  const chip = getLicenseChip(service?.license)
  const state = connectionState(service, connection)
  const visible = !connection?.enabled
  const connecting = state === 'connecting'
  const stopping = state === 'stopping'

  let clickHandler = () => {
    heartbeat.caffeinate()
    if (connecting) {
      analyticsHelper.trackConnect('connectionClosed', service)
      emit('service/disconnect', connection)
    } else {
      onClick && onClick()
      analyticsHelper.trackConnect('connectionInitiated', service)
      connection = connection || newConnection(service)
      if (connection.autoLaunch) ui.set({ autoLaunch: true })
      connection.name = sanitizeName(connection?.name || '')
      connection.host = ''
      connection.public ? connections.proxyConnect(connection) : emit('service/connect', connection)
    }
  }

  useEffect(() => {
    if (autoStart && service) {
      setAutoStart(false)
      clickHandler()
    }
  })

  let title = connection?.public ? 'Create Connection' : 'Add to Network'
  let disabled = false
  let variant: 'text' | 'outlined' | 'contained' | undefined

  if (chip && chip.show) {
    color = chip.colorName
    title = chip.disabled ? chip.name : title
    if (chip.disabled) clickHandler = () => history.push('/settings/plans')
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
  if (service?.attributes.route === 'p2p' && connection?.public) {
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
