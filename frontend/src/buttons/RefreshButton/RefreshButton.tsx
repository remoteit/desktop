import React from 'react'
import network from '../../services/Network'
import { emit } from '../../services/Controller'
import { Switch, Route, matchPath, useParams, useRouteMatch } from 'react-router-dom'
import { getDeviceModel, selectDevice } from '../../selectors/devices'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { IconButton, ButtonProps } from '../IconButton'
import { attributeName } from '@common/nameHelper'

export const RefreshButton: React.FC<ButtonProps> = props => {
  const { deviceID } = useParams<{ deviceID?: string }>()
  const dispatch = useDispatch<Dispatch>()
  const { fetching, device } = useSelector((state: ApplicationState) => ({
    fetching: getDeviceModel(state).fetching || (deviceID && state.logs.fetching) || state.ui.fetching,
    device: selectDevice(state, undefined, deviceID),
  }))

  const connectionPage = useRouteMatch('/connections')
  const networkPage = useRouteMatch('/networks')
  const logsPage = useRouteMatch(['/logs', '/devices/:deviceID/logs'])
  const devicesPage = useRouteMatch('/devices')

  let title = 'Refresh application'
  let callback = () => {}

  // connection pages
  if (connectionPage) {
    title = 'Refresh connections'
    callback = async () => {
      await dispatch.connections.fetch()
    }

    // network pages
  } else if (networkPage) {
    title = 'Refresh networks'
    callback = async () => {
      await dispatch.connections.fetch()
      await dispatch.networks.fetch()
    }

    // log pages
  } else if (logsPage) {
    title = device ? `Refresh ${attributeName(device)} logs` : 'Refresh logs'
    callback = async () => {
      if (device) dispatch.devices.fetchSingleFull({ id: device.id })
      await dispatch.logs.set({ after: undefined, maxDate: undefined })
      await dispatch.logs.fetch()
    }

    // device pages
  } else if (devicesPage) {
    title = device ? `Refresh ${attributeName(device)}` : 'Refresh devices'
    callback = async () => {
      if (device) {
        await dispatch.devices.fetchSingleFull({ id: device.id })
      } else {
        await dispatch.devices.set({ from: 0 })
        await dispatch.devices.fetchList()
      }
    }
  }

  let attributes = { ...props }
  attributes.title = 'Refresh application'
  attributes.placement = 'bottom'
  attributes.disabled = fetching
  attributes.icon = 'sync'
  attributes.spin = fetching
  attributes.fixedWidth = true

  const refresh = async callback => {
    network.connect()
    dispatch.ui.set({ fetching: true })
    await callback()
    await Promise.all([
      dispatch.networks.fetch(),
      dispatch.sessions.fetch(),
      dispatch.accounts.fetch(),
      dispatch.user.fetch(),
      dispatch.tags.fetch(),
      dispatch.plans.fetch(),
      dispatch.organization.fetch(),
      dispatch.announcements.fetch(),
    ])
    emit('refresh')
    dispatch.ui.set({ fetching: false })
  }

  React.useEffect(() => {
    network.on('connect', () => refresh(callback))
    return () => {
      network.off('connect', refresh)
    }
  }, [])

  return <IconButton {...attributes} title={title} onClick={async () => await refresh(callback)} />
}
