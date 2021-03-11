import React from 'react'
import { selectDevice } from '../models/devices'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Switch, Route, useParams } from 'react-router-dom'
import { NetworkPage } from '../pages/NetworkPage'
import { ServiceAddPage } from '../pages/ServiceAddPage'
import { DeviceLogPage } from '../pages/DeviceLogPage'
import { DeviceDetailPage } from '../pages/DeviceDetailPage'
import { ServiceDetailPage } from '../pages/ServiceDetailPage'
import { UsersPageService } from '../pages/UsersPageService'
import { UsersPageDevice } from '../pages/UsersPageDevice'
import { ServiceEditPage } from '../pages/ServiceEditPage'
import { DeviceEditPage } from '../pages/DeviceEditPage'
import { DynamicPanel } from '../components/DynamicPanel'
import { DevicePage } from '../pages/DevicePage'
import { SharePage } from '../pages/SharePage'
import { LogPage } from '../pages/LogPage'

export const DeviceRouter: React.FC<{ singlePanel?: boolean }> = ({ singlePanel }) => {
  const { deviceID } = useParams<{ deviceID?: string }>()
  const { device, targetDevice, targets } = useSelector((state: ApplicationState) => ({
    device: selectDevice(state, deviceID),
    targetDevice: state.backend.device,
    targets: state.backend.targets,
  }))

  // const { devices } = useDispatch<Dispatch>()
  // const [loaded, setLoaded] = useState<boolean>(false)

  // useEffect(() => {
  //   analyticsHelper.page('DevicePage')
  //   if (!device && !fetching) {
  //     if (loaded) {
  //       history.push('/devices')
  //     } else {
  //       await devices.fetchSingle({ id: device?.id, hidden: true })
  //       setLoaded(true)
  //     }
  //   }
  // }, [device, loaded, history])

  // if (!device || fetching) return <LoadingMessage message="Fetching data..." />

  return (
    <DynamicPanel
      primary={<DevicePage targetDevice={targetDevice} targets={targets} device={device} />}
      secondary={
        <Switch>
          <Route path="/devices/:deviceID/add/scan">
            <NetworkPage />
          </Route>
          <Route path="/devices/:deviceID/add">
            <ServiceAddPage targetDevice={targetDevice} targets={targets} device={device} />
          </Route>
          <Route
            path={['/devices/:deviceID/users/share', '/devices/:deviceID/users/:email', '/devices/:deviceID/share']}
          >
            <SharePage />
          </Route>
          <Route path="/devices/:deviceID/edit">
            <DeviceEditPage targetDevice={targetDevice} targets={targets} device={device} />
          </Route>
          <Route path="/devices/:deviceID/users">
            <UsersPageDevice device={device} />
          </Route>
          <Route path="/devices/:deviceID/logs">
            <DeviceLogPage device={device} />
          </Route>
          <Route path="/devices/:deviceID/details">
            <DeviceDetailPage device={device} />
          </Route>
          <Route
            path={[
              '/devices/:deviceID/:serviceID/users/share',
              '/devices/:deviceID/:serviceID/users/:email',
              '/devices/:deviceID/:serviceID/share',
            ]}
          >
            <SharePage />
          </Route>
          <Route path="/devices/:deviceID/:serviceID/users">
            <UsersPageService device={device} />
          </Route>
          <Route path="/devices/:deviceID/:serviceID/log">
            <LogPage />
          </Route>
          <Route path="/devices/:deviceID/:serviceID/edit">
            <ServiceEditPage targetDevice={targetDevice} targets={targets} device={device} />
          </Route>
          <Route path="/devices/:deviceID/:serviceID">
            <ServiceDetailPage targets={targets} device={device} />
          </Route>
          <Route path="/devices/:deviceID">
            <DeviceDetailPage device={device} />
          </Route>
        </Switch>
      }
      resize="devices"
      single={singlePanel}
      root="/devices/:deviceID"
    />
  )
}
