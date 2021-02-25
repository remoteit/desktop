import React from 'react'
import { selectDevice } from '../models/devices'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Switch, Route, useParams } from 'react-router-dom'
import { NetworkPage } from '../pages/NetworkPage'
import { ServiceAddPage } from '../pages/ServiceAddPage'
import { DeviceDetailPage } from '../pages/DeviceDetailPage'
import { DeviceLogPage } from '../pages/DeviceLogPage'
import { ServiceDetailPage } from '../pages/ServiceDetailPage'
import { UsersPageService } from '../pages/UsersPageService'
import { UsersPageDevice } from '../pages/UsersPageDevice'
import { ServiceEditPage } from '../pages/ServiceEditPage'
import { DeviceEditPage } from '../pages/DeviceEditPage'
import { DevicePage } from '../pages/DevicePage'
import { SharePage } from '../pages/SharePage'
import { LogPage } from '../pages/LogPage'
import { getLinks } from '../helpers/routeHelper'
import { Panel } from '../components/Panel'

export const DeviceRouter: React.FC = () => {
  const { deviceID } = useParams<{ deviceID?: string }>()
  const { device, targetDevice, targets, links } = useSelector((state: ApplicationState) => ({
    device: selectDevice(state, deviceID),
    targetDevice: state.backend.device,
    targets: state.backend.targets,
    links: getLinks(state),
  }))

  // const { devices } = useDispatch<Dispatch>()
  // const [loaded, setLoaded] = useState<boolean>(false)

  // useEffect(() => {
  //   analyticsHelper.page('DevicePage')
  //   if (!device && !fetching) {
  //     if (loaded) {
  //       history.push('/devices')
  //     } else {
  //       await devices.fetchSingle({ deviceId: device?.id, hidden: true })
  //       setLoaded(true)
  //     }
  //   }
  // }, [device, loaded, history])

  // if (!device || fetching) return <LoadingMessage message="Fetching data..." />

  return (
    <>
      <Panel primary resize="devices">
        <DevicePage targetDevice={targetDevice} targets={targets} device={device} />
      </Panel>
      <Panel>
        <Switch>
          <Route path={links.scan}>
            <NetworkPage />
          </Route>
          <Route path={links.add}>
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
      </Panel>
    </>
  )
}
