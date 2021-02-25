import React, { useEffect } from 'react'
import { DeviceRouter } from './DeviceRouter'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { Switch, Route, Redirect, useHistory } from 'react-router-dom'
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
import { ReportsPage } from '../pages/ReportsPage'
import { getLinks } from '../helpers/routeHelper'
import { Panel } from '../components/Panel'

export const Router: React.FC = () => {
  const history = useHistory()
  const { ui } = useDispatch<Dispatch>()
  const { redirect, targetDevice, registered, os, links } = useSelector((state: ApplicationState) => ({
    redirect: state.ui.redirect,
    targetDevice: state.backend.device,
    registered: !!state.backend.device.uid,
    os: state.backend.environment.os,
    links: getLinks(state),
  }))

  useEffect(() => {
    if (redirect) {
      console.log('UI REDIRECT', redirect)
      history.push(redirect)
      ui.set({ redirect: undefined })
    }
  }, [redirect])

  console.log('URL', window.location.href)

  return (
    <Switch>
      <Redirect
        from={'/connect/:serviceID'}
        to={{
          pathname: '/connections/:serviceID',
          state: { autoConnect: true },
        }}
      />

      {/* Device */}
      <Route path="/devices/:deviceID/:serviceID?">
        <DeviceRouter />
      </Route>

      {/* Connections */}
      <Route path="/connections">
        <Panel primary resize="connections">
          <ConnectionsPage />
        </Panel>
        <Panel>
          <Switch>
            <Route path="/connections/:serviceID/lan">
              <LanSharePage />
            </Route>
            <Route path="/connections/:serviceID">
              <ConnectionPage />
            </Route>
          </Switch>
        </Panel>
      </Route>

      {/* Configure */}
      <Route path="/configure">
        {registered ? (
          <Redirect to={`/configure/${targetDevice.uid}`} />
        ) : (
          <Panel primary>
            <SetupDevice os={os} />
          </Panel>
        )}
      </Route>

      {/* Devices */}
      <Route path="/devices/setup">
        <Panel primary>
          {registered ? <Redirect to={`/devices/${targetDevice.uid}/edit`} /> : <SetupDevice os={os} />}
        </Panel>
      </Route>

      <Route path="/devices/membership">
        <Panel primary>
          <AccountMembershipPage />
        </Panel>
      </Route>

      <Route path={links.waiting}>
        <Panel primary>
          <SetupWaiting os={os} targetDevice={targetDevice} />
        </Panel>
      </Route>

      <Route path="/devices">
        <Panel primary>
          <DevicesPage />
        </Panel>
      </Route>

      <Route path={['/settings/membership/share', '/settings/access/share']}>
        <Panel primary>
          <AccountSharePage />
        </Panel>
      </Route>

      <Route path="/settings/access">
        <Panel primary>
          <AccountAccessPage />
        </Panel>
      </Route>

      <Route path="/settings/reports">
        <Panel primary>
          <ReportsPage />
        </Panel>
      </Route>

      <Route path="/settings">
        <Panel primary>
          <SettingsPage />
        </Panel>
      </Route>

      <Route path="/announcements">
        <Panel primary>
          <AnnouncementsPage />
        </Panel>
      </Route>

      <Route path="/">
        <Redirect to={links.home} />
      </Route>
    </Switch>
  )
}
