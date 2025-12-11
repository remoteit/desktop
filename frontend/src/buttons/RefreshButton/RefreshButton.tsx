import React from 'react'
import network from '../../services/Network'
import cloudController from '../../services/cloudController'
import cloudSync from '../../services/CloudSync'
import { emit } from '../../services/Controller'
import { Dispatch, State } from '../../store'
import { VALID_JOB_ID_LENGTH } from '../../constants'
import { useParams, useRouteMatch } from 'react-router-dom'
import { selectDeviceModelAttributes, selectDevice } from '../../selectors/devices'
import { selectLimit } from '../../selectors/organizations'
import { useDispatch, useSelector } from 'react-redux'
import { IconButton, ButtonProps } from '../IconButton'
import { attributeName } from '@common/nameHelper'
import { GuideBubble } from '../../components/GuideBubble'
import { Typography } from '@mui/material'
import { limitDays } from '../../models/plans'

export const RefreshButton: React.FC<ButtonProps> = props => {
  const dispatch = useDispatch<Dispatch>()
  const { deviceID, fileID, jobID } = useParams<{ deviceID?: string; fileID?: string; jobID?: string }>()
  const device = useSelector((state: State) => selectDevice(state, undefined, deviceID))
  const logLimit = useSelector((state: State) => selectLimit(state, undefined, 'log-limit'))
  const fetching = useSelector(
    (state: State) =>
      selectDeviceModelAttributes(state).fetching || (deviceID && state.logs.fetching) || state.ui.fetching
  )
  const connectionPage = useRouteMatch('/connections')
  const networkPage = useRouteMatch('/networks')
  const logsPage = useRouteMatch(['/logs', '/devices/:deviceID/logs'])
  const devicesPage = useRouteMatch('/devices')
  const productsPage = useRouteMatch('/products')
  const scriptingPage = useRouteMatch(['/script', '/scripts', '/runs'])
  const scriptPage = useRouteMatch('/script')

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

    // scripting pages
  } else if (scriptingPage) {
    title = 'Refresh scripts'
    methods.push(dispatch.files.fetch)
    methods.push(dispatch.jobs.fetch)

    // script pages
  } else if (scriptPage) {
    title = 'Refresh script'
    if (fileID) methods.push(async () => await dispatch.files.fetchSingle({ fileId: fileID }))
    if (jobID && jobID.length >= VALID_JOB_ID_LENGTH)
      methods.push(async () => await dispatch.jobs.fetchSingle({ jobId: jobID }))
    else if (fileID) methods.push(async () => await dispatch.jobs.fetchByFileIds({ fileIds: [fileID] }))

    // log pages
  } else if (logsPage) {
    title = device ? `Refresh ${attributeName(device)} logs` : 'Refresh logs'
    methods.push(async () => {
      const allowedDays = Math.max(limitDays(logLimit?.value) || 0, 0)
      if (device) await dispatch.devices.fetchSingleFull({ id: device.id })
      await dispatch.logs.set({ after: undefined, maxDate: undefined })
      await dispatch.logs.fetch({ allowedDays, deviceId: device?.id })
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

    // products pages
  } else if (productsPage) {
    title = 'Refresh products'
    methods.push(dispatch.products.fetch)
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
