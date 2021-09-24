import React, { useEffect, useState } from 'react'
import { Switch, Route, useParams, useHistory } from 'react-router-dom'
import { ApplicationState, Dispatch } from '../store'
import { selectDevice } from '../models/devices'
import { isRemoteUI } from '../helpers/uiHelper'
import { NetworkPage } from '../pages/NetworkPage'
import { ServiceAddPage } from '../pages/ServiceAddPage'
import { DeviceLogPage } from '../pages/DeviceLogPage'
import { DeviceDetailPage } from '../pages/DeviceDetailPage'
import { ServiceDetailPage } from '../pages/ServiceDetailPage'
import { UsersPageService } from '../pages/UsersPageService'
import { UsersPageDevice } from '../pages/UsersPageDevice'
import { ServiceEditPage } from '../pages/ServiceEditPage'
import { LoadingMessage } from '../components/LoadingMessage'
import { DeviceEditPage } from '../pages/DeviceEditPage'
import { DynamicPanel } from '../components/DynamicPanel'
import { DevicePage } from '../pages/DevicePage'
import { SharePage } from '../pages/SharePage'
import { useDispatch, useSelector } from 'react-redux'

export const DeviceRouter: React.FC<{ singlePanel?: boolean }> = ({ singlePanel }) => {
  const { deviceID } = useParams<{ deviceID?: string }>()
  const { remoteUI, device, targetDevice, targets, fetching } = useSelector((state: ApplicationState) => ({
    remoteUI: isRemoteUI(state),
    fetching: state.devices.fetching,
    device: selectDevice(state, deviceID),
    targetDevice: state.backend.device,
    targets: state.backend.targets,
  }))

  const history = useHistory()
  const { devices } = useDispatch<Dispatch>()
  const [loaded, setLoaded] = useState<boolean>(false)

  useEffect(() => {
    if (deviceID && !device && !fetching) {
      // check that target device is registered and don't redirect
      if (loaded && !(remoteUI && targetDevice.uid)) {
        history.push('/devices')
      } else if (!loaded) {
        devices.fetchSingle({ id: deviceID, hidden: true })
        setLoaded(true)
      }
    }
  }, [fetching, device, targetDevice, history])

  if (fetching && !device) return <LoadingMessage message="Fetching device..." />

  return (
    <DynamicPanel
      primary={<DevicePage device={device} />}
      secondary={
        <Switch>
          <Route path="/devices/:deviceID/add/scan">
            <NetworkPage />
          </Route>
          <Route path="/devices/:deviceID/add">
            <ServiceAddPage targetDevice={targetDevice} device={device} />
          </Route>
          <Route
            path={['/devices/:deviceID/users/share', '/devices/:deviceID/users/:email', '/devices/:deviceID/share']}
          >
            <SharePage device={device} />
          </Route>
          <Route path="/devices/:deviceID/edit">
            <DeviceEditPage targetDevice={targetDevice} device={device} />
          </Route>
          <Route path="/devices/:deviceID/users">
            <UsersPageDevice device={device} />
          </Route>
          <Route path="/devices/:deviceID/logs">
            <DeviceLogPage device={device} />
          </Route>
          <Route path={['/devices/:deviceID', '/devices/:deviceID/details']} exact>
            <DeviceDetailPage device={device} />
          </Route>
          <Route
            path={[
              '/devices/:deviceID/:serviceID/users/share',
              '/devices/:deviceID/:serviceID/users/:email',
              '/devices/:deviceID/:serviceID/share',
            ]}
          >
            <SharePage device={device} />
          </Route>
          <Route path="/devices/:deviceID/:serviceID/users">
            <UsersPageService device={device} />
          </Route>
          <Route path="/devices/:deviceID/:serviceID/edit">
            <ServiceEditPage targetDevice={targetDevice} targets={targets} device={device} />
          </Route>
          <Route path="/devices/:deviceID/:serviceID">
            <ServiceDetailPage targets={targets} device={device} />
          </Route>
        </Switch>
      }
      singlePanel={singlePanel}
      root="/devices/:deviceID"
    />
  )
}
