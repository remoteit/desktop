import React from 'react'
import network from '../../services/Network'
import cloudController from '../../services/cloudController'
import cloudSync from '../../services/CloudSync'
import { emit } from '../../services/Controller'
import { Dispatch, State } from '../../store'
import { useParams, useRouteMatch } from 'react-router-dom'
import { selectDeviceModelAttributes, selectDevice } from '../../selectors/devices'
import { useDispatch, useSelector } from 'react-redux'
import { IconButton, ButtonProps } from '../IconButton'
import { attributeName } from '@common/nameHelper'
import { GuideBubble } from '../../components/GuideBubble'
import { Typography } from '@mui/material'
import { Icon } from '../../components/Icon'

export const RefreshButton: React.FC<ButtonProps> = props => {
  const dispatch = useDispatch<Dispatch>()
  const { deviceID } = useParams<{ deviceID?: string }>()
  const device = useSelector((state: State) => selectDevice(state, undefined, deviceID))
  const fetching = useSelector(
    (state: State) =>
      selectDeviceModelAttributes(state).fetching || (deviceID && state.logs.fetching) || state.ui.fetching
  )
  const connectionPage = useRouteMatch('/connections')
  const networkPage = useRouteMatch('/networks')
  const logsPage = useRouteMatch(['/logs', '/devices/:deviceID/logs'])
  const devicesPage = useRouteMatch('/devices')

  let title = 'Refresh application'
  let methods: Methods = []

  // connection pages
  if (connectionPage) {
    title = 'Refresh connections'
    methods.push(dispatch.connections.fetch)

    // network pages
  } else if (networkPage) {
    title = 'Refresh networks'
    methods.push(dispatch.networks.fetchAll)

    // log pages
  } else if (logsPage) {
    title = device ? `Refresh ${attributeName(device)} logs` : 'Refresh logs'
    methods.push(async () => {
      if (device) await dispatch.devices.fetchSingleFull({ id: device.id })
      await dispatch.logs.set({ after: undefined, maxDate: undefined })
      await dispatch.logs.fetch()
    })

    // device pages
  } else if (devicesPage) {
    title = device ? `Refresh ${attributeName(device)}` : 'Refresh devices'
    methods.push(async () => {
      if (device) {
        await dispatch.devices.fetchSingleFull({ id: device.id })
      } else {
        await dispatch.devices.set({ from: 0 })
        await dispatch.devices.fetchList()
      }
    })
  }

  const refresh = async () => {
    if (fetching) {
      await cloudSync.cancel()
      await dispatch.devices.set({ fetching: false })
      return
    }
    await cloudSync.call(methods)
    await cloudSync.core(!methods.length)
    dispatch.devices.expire()
    cloudController.ping()
    network.connect()
    emit('refresh')
  }

  return (
    <GuideBubble
      highlight
      queueAfter="addDevice"
      guide="refresh"
      placement="bottom"
      instructions={
        <>
          <Typography variant="h3" gutterBottom>
            <b>Refresh the application</b>
          </Typography>
          <Typography variant="body2" gutterBottom>
            Device state will update automatically while your system is on and the app is running.
          </Typography>
        </>
      }
    >
      <IconButton
        {...props}
        fixedWidth
        icon="sync"
        placement="bottom"
        color={fetching ? 'gray' : props.color}
        title={title}
        spin={fetching}
        onClick={refresh}
      />
    </GuideBubble>
  )
}
