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
import { DevicesPage } from '../pages/DevicesPage'
import { LanSharePage } from '../pages/LanSharePage'
import { LicensingPage } from '../pages/LicensingPage'
import { AccountSharePage } from '../pages/AccountSharePage'
import { AnnouncementsPage } from '../pages/AnnouncementsPage'
import { AccountAccessPage } from '../pages/AccountAccessPage'
import { AccountMembershipPage } from '../pages/AccountMembershipPage'
import { DynamicPanel } from '../components/DynamicPanel'
import { OptionsPage } from '../pages/OptionsPage'
import { ReportsPage } from '../pages/ReportsPage'
import { TagsPage } from '../pages/TagsPage'
import { isRemoteUI } from '../helpers/uiHelper'
import { Panel } from '../components/Panel'
import { UserLogPage } from '../pages/UserLogPage'
import { NotificationsPage } from '../pages/NotificationsPage'
import { ShareFeedback } from '../pages/ShareFeedback'

export const Router: React.FC<{ singlePanel?: boolean }> = ({ singlePanel }) => {
  const history = useHistory()
  const { ui } = useDispatch<Dispatch>()
  const { remoteUI, redirect, targetDevice, registered, os } = useSelector((state: ApplicationState) => ({
    remoteUI: isRemoteUI(state),
    redirect: state.ui.redirect,
    targetDevice: state.backend.device,
    registered: !!state.backend.device.uid,
    os: state.backend.environment.os,
  }))

  useEffect(() => {
    if (redirect) {
      console.log('UI REDIRECT', redirect)
      history.push(redirect)
      ui.set({ redirect: undefined })
    }
  }, [redirect])

  return (
    <Switch>
      <Redirect
        from={'/connect/:serviceID'}
        to={{
          pathname: '/connections/:serviceID',
          state: { autoConnect: true },
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
          resize="connections"
          single={singlePanel}
          root={['/connections', '/connections/new']}
        />
      </Route>

      <Route path="/devices/setup">
        {registered ? (
          <Redirect to={`/devices/${targetDevice.uid}`} />
        ) : (
          <Panel>
            <SetupDevice os={os} />
          </Panel>
        )}
      </Route>

      <Route path="/devices/membership">
        <Panel>
          <AccountMembershipPage />
        </Panel>
      </Route>

      <Route path="/devices/setupWaiting">
        <Panel>
          <SetupWaiting os={os} targetDevice={targetDevice} />
        </Panel>
      </Route>

      <Route path="/devices/restore">
        <Panel>
          <DevicesPage singlePanel={singlePanel} restore />
        </Panel>
      </Route>

      <Route path="/devices/select">
        <Panel>
          <DevicesPage singlePanel={singlePanel} select />
        </Panel>
      </Route>

      <Route path="/devices/:deviceID">
        <DeviceRouter singlePanel={singlePanel} />
      </Route>

      <Route path="/devices">
        {remoteUI ? (
          registered ? (
            <Redirect to={`/devices/${targetDevice.uid}`} />
          ) : (
            <Panel>
              <SetupDevice os={os} />
            </Panel>
          )
        ) : (
          <Panel>
            <DevicesPage singlePanel={singlePanel} />
          </Panel>
        )}
      </Route>

      <Route path="/announcements">
        <Panel>
          <AnnouncementsPage />
        </Panel>
      </Route>

      <Route path="/shareFeedback">
        <Panel>
          <ShareFeedback dialogOpen={true} />
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

              <Route path="/settings/access">
                <AccountAccessPage />
              </Route>

              <Route path="/settings/logs">
                <UserLogPage />
              </Route>

              <Route path="/settings/tags">
                <TagsPage />
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

              <Route path="/settings/test">
                <TestPage />
              </Route>

              <Route path={['/settings/options', '/settings']}>
                <OptionsPage />
              </Route>
            </Switch>
          }
          resize="settings"
          single={singlePanel}
          root={['/settings', '/settings/options']}
        />
      </Route>

      <Route path="/">
        <Redirect to="/devices" />
      </Route>
    </Switch>
  )
}
