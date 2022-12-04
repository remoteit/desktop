import React from 'react'
import network from '../../services/Network'
import { emit } from '../../services/Controller'
import { selectDevice } from '../../models/devices'
import { Switch, Route, useParams } from 'react-router-dom'
import { getDeviceModel } from '../../selectors/devices'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { IconButton, ButtonProps } from '../IconButton'
import { attributeName } from '../../shared/nameHelper'

export const RefreshButton: React.FC<ButtonProps> = props => {
  const { deviceID } = useParams<{ deviceID?: string }>()
  const dispatch = useDispatch<Dispatch>()
  const { fetching, device } = useSelector((state: ApplicationState) => ({
    fetching: getDeviceModel(state).fetching || (device && state.logs.fetching) || state.ui.fetching,
    device: selectDevice(state, deviceID),
  }))

  let attributes = { ...props }
  attributes.title = 'Refresh application'
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

  return (
    <Switch>
      <Route path="/connections">
        <IconButton
          {...attributes}
          title="Refresh networks"
          onClick={async () =>
            await refresh(async () => {
              await dispatch.connections.fetch()
            })
          }
        />
      </Route>
      <Route path="/networks">
        <IconButton
          {...attributes}
          title="Refresh networks"
          onClick={async () =>
            await refresh(async () => {
              await dispatch.connections.fetch()
              await dispatch.networks.fetch()
            })
          }
        />
      </Route>
      <Route path={['/logs', '/devices/:deviceID/logs']}>
        <IconButton
          {...attributes}
          title={device ? `Refresh ${attributeName(device)} logs` : 'Refresh logs'}
          onClick={async () =>
            await refresh(async () => {
              if (device) dispatch.devices.fetchSingle({ id: device.id })
              await dispatch.logs.set({ from: 0, maxDate: new Date() })
              await dispatch.logs.fetch()
            })
          }
        />
      </Route>
      <Route path="/devices">
        <IconButton
          {...attributes}
          title={device ? `Refresh ${attributeName(device)}` : 'Refresh devices'}
          onClick={async () =>
            await refresh(async () => {
              if (device) {
                await dispatch.devices.fetchSingle({ id: device.id })
              } else {
                await dispatch.devices.set({ from: 0 })
                await dispatch.devices.fetchList()
              }
            })
          }
        />
      </Route>
      <Route path="*">
        <IconButton {...attributes} title="Refresh Application" onClick={async () => await refresh(() => {})} />
      </Route>
    </Switch>
  )
}
