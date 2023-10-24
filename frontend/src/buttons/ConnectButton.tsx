import React, { useEffect } from 'react'
import { Stack } from '@mui/material'
import { isPortal } from '../services/Browser'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { connectionState, newConnection, launchDisabled } from '../helpers/connectionHelper'
import { DynamicButton, DynamicButtonProps } from './DynamicButton'
import { getLicenseChip } from '../components/LicenseChip'
import { useHistory } from 'react-router-dom'

export type ConnectButtonProps = Omit<DynamicButtonProps, 'title' | 'onClick'> & {
  connection?: IConnection
  service?: IService
  permissions?: IPermission[]
  preventDefault?: boolean
  all?: boolean
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({
  connection,
  service,
  permissions,
  color = 'primary',
  disabled,
  preventDefault,
  all,
  onClick,
  ...props
}) => {
  const instanceId = service?.id || connection?.id || ''
  const { autoConnect } = useSelector((state: ApplicationState) => state.ui)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const chip = getLicenseChip(service?.license)
  const state = connectionState(service, connection)

  let clickHandler = (event?: React.MouseEvent<HTMLButtonElement>, forceStop?: boolean) => {
    if (preventDefault) {
      event && onClick?.(event)
      return
    }

    if (connection?.connectLink) {
      dispatch.connections.setConnectLink({ ...connection, enabled: false })
    } else if (connection?.connecting || connection?.enabled || connection?.starting) {
      dispatch.connections.disconnect({ connection, forceStop })
    } else {
      connection = connection || newConnection(service)
      dispatch.connections.connect({ ...connection, connectOnReady: true })
      dispatch.networks.join(instanceId)
    }
    event && onClick?.(event)
  }

  useEffect(() => {
    if (autoConnect && service) {
      dispatch.ui.set({ autoConnect: false })
      clickHandler()
    }
  }, [autoConnect, service])

  let title = 'Connect'
  let variant: 'text' | 'outlined' | 'contained' | undefined = 'text'
  let loading = false
  let icon: string | undefined = 'play'

  if (connection?.autoLaunch && !launchDisabled(connection)) title += ' + Launch'

  if (!permissions?.includes('CONNECT')) {
    disabled = true
    title = 'Unauthorized'
  }

  if (chip && chip.show) {
    color = chip.colorName
    title = chip.disabled ? chip.name : title
    if (chip.disabled) clickHandler = () => history.push('/account/plans')
  }

  switch (state) {
    case 'ready':
      title = 'Stop'
      icon = 'stop'
      break
    case 'connected':
      title = 'Disconnect'
      icon = connection?.public ? 'stop' : 'pause'
      break
    case 'disconnecting':
      title = 'Disconnecting'
      loading = true
      break
    case 'starting':
      title = 'Starting'
      loading = true
      break
    case 'offline':
      title = 'Offline'
      disabled = disabled || !connection?.enabled
      color = 'grayLight'
      variant = 'contained'
      icon = 'stop'
      break
    case 'stopping':
      title = 'Removing'
      color = 'grayDark'
      loading = true
      break
    case 'connecting':
      title = 'Connecting'
      loading = true
      break
    default:
      variant = 'contained'
  }

  if (all) title += ' all'

  props.loading = props.loading || loading

  if (props.loading) icon = 'spinner-third'
  if (service?.attributes.route === 'p2p' && isPortal()) disabled = true
  if (disabled && props.size === 'icon') title = ''
  if (connection?.connectLink && state !== 'offline') {
    title = connection.enabled ? 'Disable' : 'Enable'
    icon = 'circle-medium'
  }

  const button = (
    <DynamicButton
      title={title}
      variant={variant}
      color={color}
      icon={icon}
      onClick={clickHandler}
      disabled={disabled}
      {...props}
    />
  )

  return state === 'connected' && props.size === 'large' && !isPortal() ? (
    <Stack flexDirection="row">
      {button}
      <DynamicButton
        icon="stop"
        color="primary"
        variant="text"
        size="medium"
        iconType="solid"
        onClick={event => clickHandler(event, true)}
      />
    </Stack>
  ) : (
    button
  )
}
