import React from 'react'
import { State } from '../store'
import { ScanPage } from '../pages/ScanPage'
import { DeviceDiscoverPage } from '../pages/DeviceDiscoverPage'
import { DeviceContext } from '../services/Context'
import { ServiceRouter } from './ServiceRouter'
import { selectDeviceModelAttributes } from '../selectors/devices'
import { Switch, Route, Redirect, useParams } from 'react-router-dom'
import { ServiceAddPage } from '../pages/ServiceAddPage'
import { DeviceDetailPage } from '../pages/DeviceDetailPage'
import { DeviceUsersPage } from '../pages/DeviceUsersPage'
import { LoadingMessage } from '../components/LoadingMessage'
import { DeviceEditPage } from '../pages/DeviceEditPage'
import { DeviceRunsPage } from '../pages/DeviceRunsPage'
import { DeviceServicesPage } from '../pages/DeviceServicesPage'
import { DeviceActivityPage } from '../pages/DeviceActivityPage'
import { useDeviceCarries } from '../hooks/useDeviceCarries'
import { LEGACY_PAGES, LegacyPage, legacyTarget } from '../helpers/deviceTabs'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { DynamicPanel } from '../components/DynamicPanel'
import { DevicePage } from '../pages/DevicePage'
import { SharePage } from '../pages/SharePage'
import { Panel } from '../components/Panel'
import { useSelector } from 'react-redux'
import { DeviceTransferPage } from '../pages/DeviceTransferPage'
import { DeviceAppCatalogPage } from '../pages/DeviceAppCatalogPage'
import { DeviceAppPage } from '../pages/DeviceAppPage'

export const DeviceRouter: React.FC<{ layout: ILayout }> = ({ layout }) => {
  const { deviceID } = useParams<{ deviceID?: string; serviceID?: string; networkID?: string }>()
  const { device } = React.useContext(DeviceContext)
  const { fetching, initialized } = useSelector(selectDeviceModelAttributes)
  const defaultServiceLookup = useSelector((state: State) => state.ui.defaultService)
  const waiting = fetching || !initialized
  const deviceSessions = useDeviceSessions()

  const defaultService = () => {
    const lookupResult = defaultServiceLookup[deviceID || '']
    const validLookup = lookupResult === null || device?.services.find(s => s.id === lookupResult)
    const serviceId = validLookup ? lookupResult : device?.services?.[0]?.id
    const redirect = device?.state === 'active' && serviceId ? `${serviceId}/connect` : 'overview'
    return { pathname: `/devices/${deviceID}/${redirect}`, state: { isRedirect: true } }
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
      root="/devices/:deviceID"
      secondary={
        <Switch>
          <Route path="/devices/:deviceID/add/scan">
            <ScanPage />
          </Route>
          {deviceSessions && (
            <Route path="/devices/:deviceID/add/discover">
              <DeviceDiscoverPage />
            </Route>
          )}
          <Route path="/devices/:deviceID/add">
            <ServiceAddPage device={device} />
          </Route>
          <Route path={['/devices/:deviceID/users/:userID', '/devices/:deviceID/share']}>
            <SharePage />
          </Route>
          <Route path="/devices/:deviceID/transfer">
            <DeviceTransferPage device={device} />
          </Route>
          <Route path="/devices/:deviceID/overview">
            <DeviceDetailPage />
          </Route>
          <Route path="/devices/:deviceID/services">
            <DeviceServicesPage />
          </Route>
          <Route path="/devices/:deviceID/sharing">
            <DeviceUsersPage device={device} />
          </Route>
          <Route path="/devices/:deviceID/settings/:section?">
            <DeviceEditPage />
          </Route>
          <Route path="/devices/:deviceID/activity/:section?">
            <DeviceActivityPage />
          </Route>
          {deviceSessions && !device?.virtual ? (
            <Route path="/devices/:deviceID/exit/:section?">
              <DeviceRunsPage />
            </Route>
          ) : (
            <Route path="/devices/:deviceID/exit">
              <Redirect to={`/devices/${deviceID}/overview`} />
            </Route>
          )}
          <Route path={`/devices/:deviceID/:page(${LEGACY_PAGES.join('|')})`}>
            <LegacyRedirect />
          </Route>
          {/* An app id always holds a dot, so add never reads as one; both before a service's routes. */}
          <Route path="/devices/:deviceID/apps/add">
            <DeviceAppCatalogPage />
          </Route>
          <Route path="/devices/:deviceID/apps/:appID">
            <DeviceAppPage />
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
    />
  )
}

// An address from before the tabs, sent to its tab and section.
export const LegacyRedirect: React.FC = () => {
  const { deviceID, page } = useParams<{ deviceID: string; page: LegacyPage }>()
  const { device } = React.useContext(DeviceContext)
  const target = legacyTarget(page, useDeviceCarries(device))
  if (!target) return <LoadingMessage />
  return <Redirect to={{ pathname: `/devices/${deviceID}/${target}`, state: { isRedirect: true } }} />
}
