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
import { DynamicPanel } from '../components/DynamicPanel'
import { ReportsPage } from '../pages/ReportsPage'
import { getLinks } from '../helpers/routeHelper'
import { Panel } from '../components/Panel'

export const Router: React.FC<{ singlePanel?: boolean }> = ({ singlePanel }) => {
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
      <Route path="/devices/:deviceID">
        <DeviceRouter singlePanel={singlePanel} />
      </Route>

      {/* Connections */}
      <Route path={['/connections', '/connections/new']} exact>
        <Panel>
          <ConnectionsPage />
        </Panel>
      </Route>
      <Route path={['/connections/new/:serviceID', '/connections/:serviceID']}>
        <DynamicPanel
          primary={<ConnectionsPage />}
          secondary={
            <Switch>
              <Route path="/connections/:serviceID/lan">
                <LanSharePage />
              </Route>
              <Route path={['/connections/new/:serviceID', '/connections/:serviceID']}>
                <ConnectionPage />
              </Route>
            </Switch>
          }
          resize="connections"
          single={singlePanel}
          root="/connections"
        />
      </Route>

      {/* Configure */}
      <Route path="/configure">
        {registered ? (
          <Redirect to={`/configure/${targetDevice.uid}`} />
        ) : (
          <Panel>
            <SetupDevice os={os} />
          </Panel>
        )}
      </Route>

      {/* Devices */}
      <Route path="/devices/setup">
        <Panel>{registered ? <Redirect to={`/devices/${targetDevice.uid}/edit`} /> : <SetupDevice os={os} />}</Panel>
      </Route>

      <Route path="/devices/membership">
        <Panel>
          <AccountMembershipPage />
        </Panel>
      </Route>

      <Route path={links.waiting}>
        <Panel>
          <SetupWaiting os={os} targetDevice={targetDevice} />
        </Panel>
      </Route>

      <Route path="/devices">
        <Panel>
          <DevicesPage />
        </Panel>
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

      <Route path="/settings">
        <Panel>
          <SettingsPage />
        </Panel>
      </Route>

      <Route path="/announcements">
        <Panel>
          <AnnouncementsPage />
        </Panel>
      </Route>

      <Route path="/">
        <Redirect to={links.home} />
      </Route>
    </Switch>
  )
}
