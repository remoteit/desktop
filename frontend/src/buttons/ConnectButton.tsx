import React, { useEffect } from 'react'
import browser from '../services/browser'
import { Stack } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { connectionState, newConnection, launchDisabled } from '../helpers/connectionHelper'
import { DynamicButton, DynamicButtonProps } from './DynamicButton'
import { getLicenseChip } from '../components/LicenseChip'
import { useHistory } from 'react-router-dom'
import { useOpenWebService, useWebAddress, useWebTarget } from '../hooks/useWebAddress'

export type ConnectButtonProps = Omit<DynamicButtonProps, 'title' | 'onClick'> & {
  connection?: IConnection
  service?: IService
  permissions?: IPermission[]
  preventDefault?: boolean
  all?: boolean
  hold?: boolean // not to start a connection yet: how the service is opened is not known
  onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => void
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({
  connection,
  service,
  permissions,
  color = 'primary',
  disabled,
  preventDefault,
  all,
  hold,
  onClick,
  ...props
}) => {
  const instanceId = service?.id || connection?.id || ''
  const { autoConnect } = useSelector((state: State) => state.ui)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const chip = getLicenseChip(service?.license)
  const state = connectionState(service, connection)
  // A web service is opened at its web address where the new proxies are enabled (services/webAddress), with no connection
  // started; nor is one before that is known.
  const starts = !connection?.connectLink && !connection?.connecting && !connection?.enabled && !connection?.starting
  const target = useWebTarget(service, connection)
  const webAddress = useWebAddress(starts && !preventDefault ? target : undefined)
  const web = useOpenWebService(target)
  const held = starts && !preventDefault && (!!hold || webAddress === undefined)

  useEffect(() => {
    if (!connection?.id) return
    console.log('CONNECT BUTTON STATE', {
      id: connection.id,
      state,
      connected: connection.connected,
      disconnecting: connection.disconnecting,
      connecting: connection.connecting,
      starting: connection.starting,
      stopping: connection.stopping,
      enabled: connection.enabled,
    })
  }, [
    connection?.id,
    state,
    connection?.connected,
    connection?.disconnecting,
    connection?.connecting,
    connection?.starting,
    connection?.stopping,
    connection?.enabled,
  ])

  let clickHandler = async (event?: React.MouseEvent<HTMLButtonElement | HTMLDivElement>, forceStop?: boolean) => {
    event?.stopPropagation()
    event?.preventDefault()

    if (preventDefault) {
      event && onClick?.(event)
      return
    }

    if (connection?.connectLink) {
      await dispatch.connections.setConnectLink({ ...connection, enabled: false })
    } else if (connection?.connecting || connection?.enabled || connection?.starting) {
      if (connection.connected) dispatch.connections.onClose(connection)
      await dispatch.connections.disconnect({ connection, forceStop })
    } else if (held) {
      return
    } else if (webAddress && event) {
      await web.open()
    } else {
      connection = connection || newConnection(service)
      // Not connected where it is opened another way, from its page: nothing to list among the connections.
      if ((await dispatch.connections.connect({ ...connection, connectOnReady: true })) !== false)
        await dispatch.networks.join(instanceId)
    }
    event && onClick?.(event)
  }

  useEffect(() => {
    if (autoConnect && autoConnect === service?.id && !held) {
      dispatch.ui.set({ autoConnect: undefined })
      clickHandler()
    }
  }, [autoConnect, service, held])

  let title = 'Connect'
  let variant: 'text' | 'outlined' | 'contained' | undefined = 'text'
  let loading = false
  let icon: string | undefined = 'play'

  if (connection?.autoLaunch && !launchDisabled(connection) && !webAddress) title += ' + Launch'

  if (!permissions?.includes('CONNECT')) {
    disabled = true
    title = 'Unauthorized'
  }

  if (chip && chip.show) {
    color = chip.colorName
    title = chip.disabled ? chip.name : title
    if (chip.disabled) clickHandler = async () => history.push('/account/plans')
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

  props.loading = props.loading || loading || web.opening || (held && state !== 'offline')
  disabled = disabled || held || web.opening

  if (props.loading) icon = 'spinner-third'
  if (service?.attributes.route === 'p2p' && !browser.hasBackend) disabled = true
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

  return state === 'connected' && props.size === 'large' && browser.hasBackend ? (
    <Stack flexDirection="row">
      {button}
      <DynamicButton
        icon="stop"
        color="primary"
        variant="text"
        size="large"
        iconType="solid"
        onClick={event => clickHandler(event, true)}
        sx={{ marginLeft: 2 }}
      />
    </Stack>
  ) : (
    button
  )
}
