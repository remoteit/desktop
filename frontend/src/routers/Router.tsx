import React, { useEffect } from 'react'
import { DeviceRouter } from './DeviceRouter'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { Switch, Route, Redirect, useHistory } from 'react-router-dom'
import { ConnectionOtherPage } from '../pages/ConnectionOtherPage'
import { ConnectionsPage } from '../pages/ConnectionsPage'
import { ConnectionPage } from '../pages/ConnectionPage'
import { SettingsPage } from '../pages/SettingsPage'
import { SetupDevice } from '../pages/SetupDevice'
import { SetupWaiting } from '../pages/SetupWaiting'
import { DevicesPage } from '../pages/DevicesPage'
import { LanSharePage } from '../pages/LanSharePage'
import { AccountSharePage } from '../pages/AccountSharePage'
import { AnnouncementsPage } from '../pages/AnnouncementsPage'
import { AccountAccessPage } from '../pages/AccountAccessPage'
import { AccountMembershipPage } from '../pages/AccountMembershipPage'
import { DynamicPanel } from '../components/DynamicPanel'
import { ReportsPage } from '../pages/ReportsPage'
import { isRemoteUI } from '../helpers/uiHelper'
import { Panel } from '../components/Panel'
import { UserLogPage } from '../pages/UserLogPage'

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

      {/* Devices */}
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

      <Route path={['/settings/membership/share', '/settings/access/share']}>
        <Panel>
          <AccountSharePage />
        </Panel>
      </Route>

      <Route path="/settings/access">
        <Panel>
          <AccountAccessPage />
        </Panel>
      </Route>

      <Route path="/settings/reports">
        <Panel>
          <ReportsPage />
        </Panel>
      </Route>

      <Route path="/settings/logs">
        <Panel>
          <UserLogPage />
        </Panel>
      </Route>

      <Route path="/settings">
        <Panel>
          <SettingsPage singlePanel={singlePanel} />
        </Panel>
      </Route>

      <Route path="/announcements">
        <Panel>
          <AnnouncementsPage />
        </Panel>
      </Route>

      <Route path="/">
        <Redirect to="/devices" />
      </Route>
    </Switch>
  )
}
