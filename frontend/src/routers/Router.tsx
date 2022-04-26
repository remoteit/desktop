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
import { OrganizationMembersPage } from '../pages/OrganizationMembersPage'
import { OrganizationSettingsPage } from '../pages/OrganizationSettingsPage'
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
import { ProfilePage } from '../pages/ProfilePage'
import { AccountPage } from '../pages/AccountPage'
import { SecurityPage } from '../pages/SecurityPage'
import { AccessKeyPage } from '../pages/AccessKeyPage'

export const Router: React.FC<{ layout: ILayout }> = ({ layout }) => {
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
      {/* Deep links */}
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
      <Route path="/devices/setup">
        {registered ? (
          <Redirect to={`/devices/${targetDevice.uid}`} />
        ) : isPortal() ? (
          <Redirect to={`/devices/add/${os}`} />
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
      <Route path="/devices/add/linux">
        <Panel layout={layout}>
          <SetupLinuxPage />
        </Panel>
      </Route>
      <Route path="/devices/add/:icon">
        <Panel layout={layout}>
          <DownloadDesktopPage />
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
      <Route path="/announcements">
        <Panel layout={layout}>
          <AnnouncementsPage />
        </Panel>
      </Route>
      <Route path="/shareFeedback">
        <Panel layout={layout}>
          <ShareFeedback />
        </Panel>
      </Route>
      <Route path="/settings">
        <DynamicPanel
          primary={<SettingsPage />}
          secondary={
            <Switch>
              <Route path="/settings/notifications">
                <NotificationsPage />
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
      s
      <Route path="/organization/empty">
        <Panel layout={layout}>
          <OrganizationEmptyPage />
        </Panel>
      </Route>
      <Route path="/organization">
        <DynamicPanel
          primary={<OrganizationPage />}
          secondary={
            <Switch>
              <Route path="/organization/share">
                <OrganizationAddPage />
              </Route>

              <Route path="/organization/saml">
                <OrganizationSettingsPage />
              </Route>

              <Route path="/organization/tags">
                <TagsPage />
              </Route>

              <Route path="/organization">
                <OrganizationMembersPage />
              </Route>
            </Switch>
          }
          layout={layout}
          root="/organization"
        />
      </Route>
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
          root={['/account']}
        />
      </Route>
      <Route path="/">
        <Redirect to="/devices" />
      </Route>
    </Switch>
  )
}
