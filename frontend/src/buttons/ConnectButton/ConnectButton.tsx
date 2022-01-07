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
  permissions?: IPermission[]
  size?: 'icon' | 'medium' | 'small' | 'large'
  color?: Color
  autoConnect?: boolean
  fullWidth?: boolean
  onClick?: () => void
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({
  connection,
  service,
  permissions,
  size = 'medium',
  color = 'grayDarkest',
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
      connections.disconnect(connection)
    } else {
      onClick && onClick()
      analyticsHelper.trackConnect('connectionInitiated', service)
      connection = connection || newConnection(service)
      if (connection.autoLaunch) ui.set({ autoLaunch: true })
      connection.name = sanitizeName(connection?.name || '')
      connection.host = ''
      connections.connect(connection)
    }
  }

  useEffect(() => {
    if (autoStart && service) {
      setAutoStart(false)
      clickHandler()
    }
  }, [autoStart, service])

  let title = connection?.autoLaunch ? 'Connect and Launch' : connection?.public ? 'Connect' : 'Add to Network'
  let disabled = !permissions?.includes('CONNECT')
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
