import React, { useEffect } from 'react'
import { DeviceRouter } from './DeviceRouter'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { Switch, Route, Redirect, useHistory } from 'react-router-dom'
import { ConnectionOtherPage } from '../pages/ConnectionOtherPage'
import { ConnectionsPage } from '../pages/ConnectionsPage'
import { ConnectionPage } from '../pages/ConnectionPage'
import { SettingsPage } from '../pages/SettingsPage'
import { TestPage } from '../pages/TestPage'
import { SetupDevice } from '../pages/SetupDevice'
import { SetupWaiting } from '../pages/SetupWaiting'
import { SetupLinuxPage } from '../pages/SetupLinuxPage'
import { DownloadDesktopPage } from '../pages/DownloadDesktopPage'
import { DevicesPage } from '../pages/DevicesPage'
import { LanSharePage } from '../pages/LanSharePage'
import { LicensingPage } from '../pages/LicensingPage'
import { OrganizationPage } from '../pages/OrganizationPage'
import { AccountSharePage } from '../pages/AccountSharePage'
import { AnnouncementsPage } from '../pages/AnnouncementsPage'
import { AccountAccessPage } from '../pages/AccountAccessPage'
import { OrganizationAddPage } from '../pages/OrganizationAddPage'
import { OrganizationMembershipPage } from '../pages/OrganizationMembershipPage'
import { DynamicPanel } from '../components/DynamicPanel'
import { OptionsPage } from '../pages/OptionsPage'
import { ReportsPage } from '../pages/ReportsPage'
import { BillingPage } from '../pages/BillingPage'
import { PlansPage } from '../pages/PlansPage'
import { TagsPage } from '../pages/TagsPage'
import { isRemoteUI } from '../helpers/uiHelper'
import { UserLogPage } from '../pages/UserLogPage'
import { NotificationsPage } from '../pages/NotificationsPage'
import { isPortal, getOs } from '../services/Browser'
import { ShareFeedback } from '../pages/ShareFeedback'
import { Panel } from '../components/Panel'

export const Router: React.FC<{ singlePanel?: boolean }> = ({ singlePanel }) => {
  const history = useHistory()
  const { ui } = useDispatch<Dispatch>()
  const { remoteUI, redirect, targetDevice, registered, os } = useSelector((state: ApplicationState) => ({
    remoteUI: isRemoteUI(state),
    redirect: state.ui.redirect,
    targetDevice: state.backend.device,
    registered: !!state.backend.device.uid,
    os: state.backend.environment.os || getOs(),
  }))

  useEffect(() => {
    if (redirect) {
      console.log('UI REDIRECT', redirect)
      history.push(redirect)
      ui.set({ redirect: undefined })
    }
  }, [history, ui, redirect])

  return (
    <Switch>
      <Redirect
        from={'/connect/:serviceID'}
        to={{
          pathname: '/connections/:serviceID',
          state: { autoConnect: true },
        }}
      />
      <Redirect
        from={'/launch/:serviceID'}
        to={{
          pathname: '/connections/:serviceID',
          state: { autoLaunch: true },
        }}
      />
      <Redirect
        from={'/copy/:serviceID'}
        to={{
          pathname: '/connections/:serviceID',
          state: { autoCopy: true },
        }}
      />

      {/* Connections */}
      <Route path={['/connections/new/:deviceID/:serviceID', '/connections']}>
        <DynamicPanel
          primary={<ConnectionsPage singlePanel={singlePanel} />}
          secondary={
            <Switch>
              <Route path={['/connections/:serviceID/lan', '/connections/new/:deviceID/:serviceID/lan']}>
                <LanSharePage />
              </Route>
              <Route path="/connections/:serviceID/:sessionID/other">
                <ConnectionOtherPage />
              </Route>
              <Route
                path={[
                  '/connections/new/:deviceID?/:serviceID?',
                  '/connections/:serviceID/:sessionID',
                  '/connections/:serviceID?',
                ]}
              >
                <ConnectionPage />
              </Route>
            </Switch>
          }
          singlePanel={singlePanel}
          root={['/connections', '/connections/new']}
        />
      </Route>

      <Route path="/devices/setup">
        {registered ? (
          <Redirect to={`/devices/${targetDevice.uid}`} />
        ) : isPortal() ? (
          <Redirect to={`/devices/add/${os}`} />
        ) : (
          <Panel>
            {' '}
            <SetupDevice os={os} />
          </Panel>
        )}
      </Route>

      <Route path="/devices/membership">
        <Panel>
          <OrganizationMembershipPage />
        </Panel>
      </Route>

      <Route path="/devices/add/linux">
        <Panel>
          <SetupLinuxPage />
        </Panel>
      </Route>

      <Route path="/devices/add/:icon">
        <Panel>
          <DownloadDesktopPage />
        </Panel>
      </Route>

      <Route path="/devices/setupWaiting">
        <Panel>
          <SetupWaiting os={os} targetDevice={targetDevice} />
        </Panel>
      </Route>

      <Route path="/devices/restore">
        <Panel singlePanel={singlePanel}>
          <DevicesPage restore />
        </Panel>
      </Route>

      <Route path="/devices/select">
        <Panel singlePanel={singlePanel}>
          <DevicesPage select />
        </Panel>
      </Route>

      <Route path={['/devices', '/devices/welcome']} exact>
        {remoteUI ? (
          registered ? (
            <Redirect to={`/devices/${targetDevice.uid}`} />
          ) : (
            <Panel>
              <SetupDevice os={os} />
            </Panel>
          )
        ) : (
          <Panel singlePanel={singlePanel}>
            <DevicesPage />
          </Panel>
        )}
      </Route>

      <Route path="/devices/:deviceID/:serviceID?">
        <DeviceRouter singlePanel={singlePanel} />
      </Route>

      <Route path="/announcements">
        <Panel>
          <AnnouncementsPage />
        </Panel>
      </Route>

      <Route path="/shareFeedback">
        <Panel>
          <ShareFeedback />
        </Panel>
      </Route>

      <Route path="/settings">
        <DynamicPanel
          primary={<SettingsPage singlePanel={singlePanel} />}
          secondary={
            <Switch>
              <Route path={['/settings/membership/share', '/settings/access/share']}>
                <AccountSharePage />
              </Route>

              <Route path="/settings/organization/share">
                <OrganizationAddPage />
              </Route>

              <Route path="/settings/organization">
                <OrganizationPage />
              </Route>

              <Route path="/settings/access">
                <AccountAccessPage />
              </Route>

              <Route path="/settings/logs">
                <UserLogPage />
              </Route>

              <Route path="/settings/tags">
                <TagsPage />
              </Route>

              <Route path="/settings/plans">
                <PlansPage />
              </Route>

              <Route path="/settings/reports">
                <ReportsPage />
              </Route>

              <Route path="/settings/notifications">
                <NotificationsPage />
              </Route>

              <Route path="/settings/licensing">
                <LicensingPage />
              </Route>

              <Route path="/settings/billing">
                <BillingPage />
              </Route>

              <Route path="/settings/test">
                <TestPage />
              </Route>

              <Route path={['/settings/options', '/settings']}>
                <OptionsPage />
              </Route>
            </Switch>
          }
          singlePanel={singlePanel}
          root={['/settings']}
        />
      </Route>

      <Route path="/">
        <Redirect to="/devices" />
      </Route>
    </Switch>
  )
}
