import React from 'react'
import { State } from '../store'
import { ScanPage } from '../pages/ScanPage'
import { DeviceContext } from '../services/Context'
import { ServiceRouter } from './ServiceRouter'
import { Switch, Route, Redirect } from 'react-router-dom'
import { selectDeviceModelAttributes } from '../selectors/devices'
import { ServiceAddPage } from '../pages/ServiceAddPage'
import { DeviceLogPage } from '../pages/DeviceLogPage'
import { DeviceDetailPage } from '../pages/DeviceDetailPage'
import { DeviceUsersPage } from '../pages/DeviceUsersPage'
import { LoadingMessage } from '../components/LoadingMessage'
import { DeviceEditPage } from '../pages/DeviceEditPage'
import { DynamicPanel } from '../components/DynamicPanel'
import { DevicePage } from '../pages/DevicePage'
import { SharePage } from '../pages/SharePage'
import { Panel } from '../components/Panel'
import { useSelector } from 'react-redux'
import { DeviceTransferPage } from '../pages/DeviceTransferPage'

export const DeviceRouter: React.FC<{ layout: ILayout }> = ({ layout }) => {
  const { device } = React.useContext(DeviceContext)
  const { fetching, initialized } = useSelector(selectDeviceModelAttributes)
  const defaultServiceLookup = useSelector((state: State) => state.ui.defaultService)
  const waiting = fetching || !initialized

  const defaultService = () => {
    const lookupResult = defaultServiceLookup[device?.id || '']
    const validLookup = lookupResult === null || device?.services.find(s => s.id === lookupResult)
    const serviceId = validLookup ? lookupResult : device?.services?.[0]?.id
    const redirect = device?.state === 'active' && serviceId ? `${serviceId}/connect` : 'details'
    return { pathname: `/devices/${device?.id}/${redirect}`, state: { isRedirect: true } }
  }

  if (waiting && !device)
    return (
      <Panel layout={layout}>
        <LoadingMessage message="Loading device..." />
      </Panel>
    )

  return (
    <DynamicPanel
      primary={<DevicePage />}
      secondary={
        <Switch>
          <Route path="/devices/:deviceID/add/scan">
            <ScanPage />
          </Route>
          <Route path="/devices/:deviceID/add">
            <ServiceAddPage device={device} />
          </Route>
          <Route path={['/devices/:deviceID/users/:userID', '/devices/:deviceID/share']}>
            <SharePage />
          </Route>
          <Route path="/devices/:deviceID/edit">
            <DeviceEditPage />
          </Route>
          <Route path="/devices/:deviceID/transfer">
            <DeviceTransferPage device={device} />
          </Route>
          <Route path="/devices/:deviceID/users">
            <DeviceUsersPage device={device} />
          </Route>
          <Route path="/devices/:deviceID/logs">
            <DeviceLogPage device={device} />
          </Route>
          <Route path="/devices/:deviceID/details">
            <DeviceDetailPage />
          </Route>
          <Route path="/devices/:deviceID/:serviceID">
            <ServiceRouter basename="/devices/:deviceID/:serviceID" />
          </Route>
          <Route path="/devices/:deviceID">
            <Redirect to={defaultService()} />
          </Route>
        </Switch>
      }
      layout={layout}
      root="/devices/:deviceID"
    />
  )
}
