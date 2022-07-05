import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { connectionState, sanitizeName } from '../../helpers/connectionHelper'
import { newConnection, launchDisabled } from '../../helpers/connectionHelper'
import { getLicenseChip } from '../../components/LicenseChip'
import { DynamicButton } from '../DynamicButton'
import { useHistory } from 'react-router-dom'
import { Color } from '../../styling'
import analyticsHelper from '../../helpers/analyticsHelper'

export type ConnectButtonProps = {
  connection?: IConnection
  service?: IService
  permissions?: IPermission[]
  size?: 'icon' | 'medium' | 'small' | 'large'
  color?: Color
  fullWidth?: boolean
  onClick?: () => void
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({
  connection,
  service,
  permissions,
  size = 'medium',
  color = 'primary',
  fullWidth,
  onClick,
}) => {
  const autoConnect = useSelector((state: ApplicationState) => state.ui.autoConnect)
  const { connections, ui } = useDispatch<Dispatch>()
  const history = useHistory()
  const chip = getLicenseChip(service?.license)
  const state = connectionState(service, connection)
  const visible = !connection?.enabled
  const connecting = state === 'connecting'
  const stopping = state === 'stopping'

  let clickHandler = () => {
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
    if (autoConnect && service) {
      ui.set({ autoConnect: false })
      clickHandler()
    }
  }, [autoConnect, service])

  if (!visible) return null

  let title = connection?.public ? 'Connect' : 'Add to Network'
  let disabled = !permissions?.includes('CONNECT')
  let variant: 'text' | 'outlined' | 'contained' | undefined

  if (connection?.autoLaunch && !launchDisabled(connection)) title += ' + Launch'
  if (disabled) title = 'Unauthorized'

  if (chip && chip.show) {
    color = chip.colorName
    title = chip.disabled ? chip.name : title
    if (chip.disabled) clickHandler = () => history.push('/account/plans')
    variant = 'text'
  }

  if (stopping) {
    title = 'Removing...'
    color = 'grayDark'
  }
  if (connecting) {
    title = 'Connecting...'
    color = 'grayDark'
  }
  if (state === 'starting') {
    title = 'Starting'
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
  )
}
