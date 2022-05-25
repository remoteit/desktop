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
import { AnnouncementsPage } from '../pages/AnnouncementsPage'
import { OrganizationPage } from '../pages/OrganizationPage'
import { OrganizationAddPage } from '../pages/OrganizationAddPage'
import { OrganizationRolePage } from '../pages/OrganizationRolePage'
import { OrganizationEmptyPage } from '../pages/OrganizationEmptyPage'
import { OrganizationRolesPage } from '../pages/OrganizationRolesPage'
import { OrganizationGuestPage } from '../pages/OrganizationGuestPage'
import { OrganizationGuestsPage } from '../pages/OrganizationGuestsPage'
import { OrganizationMembersPage } from '../pages/OrganizationMembersPage'
import { OrganizationSettingsPage } from '../pages/OrganizationSettingsPage'
import { OrganizationMembershipPage } from '../pages/OrganizationMembershipPage'
import { ConnectionDefaultsPage } from '../pages/ConnectionDefaultsPage'
import { DynamicPanel } from '../components/DynamicPanel'
import { OptionsPage } from '../pages/OptionsPage'
import { ReportsPage } from '../pages/ReportsPage'
import { BillingPage } from '../pages/BillingPage'
import { PlansPage } from '../pages/PlansPage'
import { SharePage } from '../pages/SharePage'
import { TagsPage } from '../pages/TagsPage'
import { isRemoteUI } from '../helpers/uiHelper'
import { UserLogPage } from '../pages/UserLogPage'
import { NotificationsPage } from '../pages/NotificationsPage'
import { isPortal, getOs } from '../services/Browser'
import { Panel } from '../components/Panel'
import { ProfilePage } from '../pages/ProfilePage'
import { AccountPage } from '../pages/AccountPage'
import { SecurityPage } from '../pages/SecurityPage'
import { FeedbackPage } from '../pages/FeedbackPage'
import { AccessKeyPage } from '../pages/AccessKeyPage'

export const Router: React.FC = () => {
  const history = useHistory()
  const { ui } = useDispatch<Dispatch>()
  const { remoteUI, redirect, targetDevice, registered, os, layout } = useSelector((state: ApplicationState) => ({
    remoteUI: isRemoteUI(state),
    redirect: state.ui.redirect,
    targetDevice: state.backend.device,
    registered: !!state.backend.device.uid,
    os: state.backend.environment.os || getOs(),
    layout: state.ui.layout,
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
      {/* Start */}
      <Redirect from="/" to="/devices" exact />
      {/* Deep links */}
      <Redirect
        from="/connect/:serviceID"
        to={{
          pathname: '/connections/:serviceID',
          state: { autoConnect: true },
        }}
      />
      <Redirect
        from="/launch/:serviceID"
        to={{
          pathname: '/connections/:serviceID',
          state: { autoLaunch: true },
        }}
      />
      <Redirect
        from="/copy/:serviceID"
        to={{
          pathname: '/connections/:serviceID',
          state: { autoCopy: true },
        }}
      />
      {/* Connections */}
      <Route path={['/connections/new/:deviceID/:serviceID', '/connections']}>
        <DynamicPanel
          primary={<ConnectionsPage />}
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
          layout={layout}
          root={['/connections', '/connections/new']}
        />
      </Route>
      {/* Add */}
      <Route path="/add/linux">
        <Panel layout={layout}>
          <SetupLinuxPage />
        </Panel>
      </Route>
      <Route path="/add/:icon">
        <Panel layout={layout}>
          <DownloadDesktopPage />
        </Panel>
      </Route>
      {/* Devices */}
      <Route path="/devices/setup">
        {registered ? (
          <Redirect to={`/devices/${targetDevice.uid}`} />
        ) : isPortal() ? (
          <Redirect to={`/add/${os}`} />
        ) : (
          <Panel layout={layout}>
            <SetupDevice os={os} />
          </Panel>
        )}
      </Route>
      <Route path="/devices/membership">
        <Panel layout={layout}>
          <OrganizationMembershipPage />
        </Panel>
      </Route>
      <Route path="/devices/setupWaiting">
        <Panel layout={layout}>
          <SetupWaiting os={os} targetDevice={targetDevice} />
        </Panel>
      </Route>
      <Route path="/devices/restore">
        <Panel layout={layout}>
          <DevicesPage restore />
        </Panel>
      </Route>
      <Route path="/devices/select">
        <Panel layout={layout}>
          <DevicesPage select />
        </Panel>
      </Route>
      <Route path={['/devices', '/devices/welcome']} exact>
        {remoteUI ? (
          registered ? (
            <Redirect to={`/devices/${targetDevice.uid}`} />
          ) : (
            <Panel layout={layout}>
              <SetupDevice os={os} />
            </Panel>
          )
        ) : (
          <Panel layout={layout}>
            <DevicesPage />
          </Panel>
        )}
      </Route>
      <Route path="/devices/:deviceID/:serviceID?">
        <DeviceRouter layout={layout} />
      </Route>
      <Route path="/logs">
        <Panel layout={layout}>
          <UserLogPage />
        </Panel>
      </Route>
      {/* Announcements */}
      <Route path="/announcements">
        <Panel layout={layout}>
          <AnnouncementsPage />
        </Panel>
      </Route>
      {/* Feedback */}
      <Route path="/feedback">
        <Panel layout={layout}>
          <FeedbackPage />
        </Panel>
      </Route>
      {/* Settings */}
      <Route path="/settings">
        <DynamicPanel
          primary={<SettingsPage />}
          secondary={
            <Switch>
              <Route path="/settings/notifications">
                <NotificationsPage />
              </Route>

              <Route path="/settings/defaults">
                <ConnectionDefaultsPage />
              </Route>

              <Route path="/settings/reports">
                <ReportsPage />
              </Route>

              <Route path="/settings/test">
                <TestPage />
              </Route>

              <Route path={['/settings/options', '/settings']}>
                <OptionsPage />
              </Route>
            </Switch>
          }
          layout={layout}
          root="/settings"
        />
      </Route>
      {/* Organization */}
      <Route path={['/organization/roles', '/organization/roles/:roleID']}>
        <DynamicPanel
          primary={<OrganizationRolesPage />}
          secondary={
            <Route path="/organization/roles/:roleID">
              <OrganizationRolePage />
            </Route>
          }
          layout={layout}
          root="/organization"
        />
      </Route>
      <Route path="/organization/empty">
        <Panel layout={layout}>
          <OrganizationEmptyPage />
        </Panel>
      </Route>
      <Route path="/organization">
        <DynamicPanel
          primary={
            <Route path={['/organization/members/:userID?/:deviceID?', '/organization']}>
              <OrganizationPage />
            </Route>
          }
          secondary={
            <Switch>
              <Route path="/organization/share">
                <OrganizationAddPage />
              </Route>

              <Route path="/organization/settings">
                <OrganizationSettingsPage />
              </Route>

              <Route path="/organization/tags">
                <TagsPage />
              </Route>

              <Route path={['/organization/guests/:userID/:deviceID', '/organization/members/:userID/:deviceID']}>
                <SharePage />
              </Route>

              <Route path={['/organization/guests/:userID', '/organization/members/:userID']}>
                <OrganizationGuestPage />
              </Route>

              <Route path="/organization/guests">
                <OrganizationGuestsPage />
              </Route>

              <Route path={['/organization', '/organization/members']}>
                <OrganizationMembersPage />
              </Route>
            </Switch>
          }
          layout={layout}
          root={['/organization']}
        />
      </Route>
      {/* Account */}
      <Route path="/account">
        <DynamicPanel
          primary={<AccountPage />}
          secondary={
            <Switch>
              <Route path="/account/security">
                <SecurityPage />
              </Route>

              <Route path="/account/plans">
                <PlansPage />
              </Route>

              <Route path="/account/licensing">
                <LicensingPage />
              </Route>

              <Route path="/account/billing">
                <BillingPage />
              </Route>

              <Route path="/account/accessKey">
                <AccessKeyPage />
              </Route>

              <Route path={['/account', '/account/overview']}>
                <ProfilePage />
              </Route>
            </Switch>
          }
          layout={layout}
          root="/account"
        />
      </Route>
    </Switch>
  )
}
