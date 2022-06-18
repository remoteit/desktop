import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { connectionState, newConnection, launchDisabled } from '../../helpers/connectionHelper'
import { DynamicButton } from '../DynamicButton'
import { DEFAULT_ID } from '../../models/networks'
import { getLicenseChip } from '../../components/LicenseChip'
import { useHistory } from 'react-router-dom'
import { Color } from '../../styling'
import { Fade } from '@material-ui/core'
import analyticsHelper from '../../helpers/analyticsHelper'

export type ConnectButtonProps = {
  connection?: IConnection
  service?: IService
  permissions?: IPermission[]
  size?: 'icon' | 'medium' | 'small' | 'large'
  icon?: string
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
  icon,
}) => {
  const { autoConnect } = useSelector((state: ApplicationState) => state.ui)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const chip = getLicenseChip(service?.license)
  const state = connectionState(service, connection)
  const visible = !connection?.enabled
  const connecting = state === 'connecting'
  const stopping = state === 'stopping'

  let clickHandler = () => {
    if (service) dispatch.networks.add({ serviceId: service.id, networkId: DEFAULT_ID })
    if (connecting) {
      analyticsHelper.trackConnect('connectionClosed', service)
      dispatch.connections.disconnect(connection)
    } else {
      onClick && onClick()
      analyticsHelper.trackConnect('connectionInitiated', service)
      connection = connection || newConnection(service)
      dispatch.connections.connect(connection)
    }
  }

  useEffect(() => {
    if (autoConnect && service) {
      dispatch.ui.set({ autoConnect: false })
      clickHandler()
    }
  }, [autoConnect, service])

  let title = connection?.public ? 'Connect' : 'Add to Network'
  let disabled = !permissions?.includes('CONNECT')
  let variant: 'text' | 'outlined' | 'contained' | undefined

  if (connection?.autoLaunch && !launchDisabled(connection)) title += ' + Launch'
  if (disabled) title = 'Unauthorized'

  // if (!connection?.enabled && /* connection in an active network? */ ) {
  //   title = 'Resume Connection'
  // }

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
    <Fade in={visible} timeout={600}>
      <div>
        <DynamicButton
          title={title}
          variant={variant}
          loading={connecting || stopping}
          color={color}
          size={size}
          icon={icon}
          onClick={clickHandler}
          disabled={disabled}
          fullWidth={fullWidth}
        />
      </div>
    </Fade>
  )
}
