import React, { useEffect } from 'react'
import { RouteArray } from '../components/RouteArray'
import { DeviceRouter } from './DeviceRouter'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { ConnectionOtherPage } from '../pages/ConnectionOtherPage'
import { ConnectionsPage } from '../pages/ConnectionsPage'
import { ConnectionPage } from '../pages/ConnectionPage'
import { NetworkUsersPage } from '../pages/NetworkUsersPage'
import { NetworkSharePage } from '../pages/NetworkSharePage'
import { NetworkEditPage } from '../pages/NetworkEditPage'
import { SettingsPage } from '../pages/SettingsPage'
import { TestPage } from '../pages/TestPage'
import { AddPage } from '../pages/AddPage'
import { DevicesPage } from '../pages/DevicesPage'
import { SetupDevice } from '../pages/SetupDevice'
import { SetupWaiting } from '../pages/SetupWaiting'
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
  const navigate = useNavigate()
  const { ui } = useDispatch<Dispatch>()
  const { remoteUI, redirect, thisId, registered, os, layout } = useSelector((state: ApplicationState) => ({
    remoteUI: isRemoteUI(state),
    redirect: state.ui.redirect,
    thisId: state.backend.thisId,
    registered: !!state.backend.thisId,
    os: state.backend.environment.os || getOs(),
    layout: state.ui.layout,
  }))

  useEffect(() => {
    if (redirect) {
      console.log('UI REDIRECT', redirect)
      navigate(redirect)
      ui.set({ redirect: undefined })
    }
  }, [navigate, ui, redirect])

  return (
    <Routes>
      {/* Start */}
      <Route path="/">
        <Navigate to="/devices" />
      </Route>

      {/* Deep links */}
      <Route path="/connect/:serviceID">
        <Navigate to="/networks/:serviceID" state={{ autoConnect: true }} />
      </Route>

      <Route path="/launch/:serviceID">
        <Navigate to="/networks/:serviceID" state={{ autoLaunch: true }} />
      </Route>

      <Route path="/copy/:serviceID">
        <Navigate to="/networks/:serviceID" state={{ autoCopy: true }} />
      </Route>

      <Route path="/connections">
        <Navigate to="/networks" />
      </Route>

      {/* Connections */}
      <Route path="/networks">
        <DynamicPanel
          primary={<ConnectionsPage />}
          secondary={
            <Routes>
              <Route path="/networks/view/:networkID/share">
                <NetworkSharePage />
              </Route>

              <Route path="/networks/view/:networkID/users">
                <NetworkUsersPage />
              </Route>

              <Route path="/networks/view/:networkID">
                <NetworkEditPage />
              </Route>

              <Route path="/networks/:serviceID/lan">
                <LanSharePage />
              </Route>

              <Route path="/networks/:serviceID/:sessionID/other">
                <ConnectionOtherPage />
              </Route>

              <RouteArray paths={['/networks/:serviceID/:sessionID', '/networks/:serviceID?']}>
                <ConnectionPage />
              </RouteArray>
            </Routes>
          }
          layout={layout}
          root="/networks"
        />
      </Route>

      {/* Add */}
      <Route path="/add/:platform">
        <Panel layout={layout}>
          <AddPage />
        </Panel>
      </Route>

      {/* Devices */}
      <Route path="/devices/setup">
        {registered ? (
          <Navigate to={`/devices/${thisId}`} />
        ) : isPortal() ? (
          <Navigate to={`/add/${os}`} />
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
          <SetupWaiting os={os} />
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

      <RouteArray paths={['/devices', '/devices/welcome']}>
        {remoteUI ? (
          registered ? (
            <Navigate to={`/devices/${thisId}`} />
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
      </RouteArray>

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
            <Routes>
              <Route path="/settings/notifications">
                <NotificationsPage />
              </Route>

              <Route path="/settings/defaults/:applicationID?">
                <ConnectionDefaultsPage />
              </Route>

              <Route path="/settings/reports">
                <ReportsPage />
              </Route>

              <Route path="/settings/test">
                <TestPage />
              </Route>

              <RouteArray paths={['/settings/options', '/settings']}>
                <OptionsPage />
              </RouteArray>
            </Routes>
          }
          layout={layout}
          root="/settings"
        />
      </Route>

      {/* Organization */}
      <Route path="/organization/memberships">
        <Panel layout={layout}>
          <OrganizationMembershipPage />
        </Panel>
      </Route>
      <RouteArray paths={['/organization/roles', '/organization/roles/:roleID']}>
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
      </RouteArray>

      <Route path="/organization/empty">
        <Panel layout={layout}>
          <OrganizationEmptyPage />
        </Panel>
      </Route>

      <Route path="/organization">
        <DynamicPanel
          primary={
            <RouteArray paths={['/organization/members/:userID?/:deviceID?', '/organization']}>
              <OrganizationPage />
            </RouteArray>
          }
          secondary={
            <Routes>
              <Route path="/organization/share">
                <OrganizationAddPage />
              </Route>

              <Route path="/organization/settings">
                <OrganizationSettingsPage />
              </Route>

              <Route path="/organization/tags">
                <TagsPage />
              </Route>

              <RouteArray paths={['/organization/guests/:userID/:deviceID', '/organization/members/:userID/:deviceID']}>
                <SharePage />
              </RouteArray>

              <RouteArray paths={['/organization/guests/:userID', '/organization/members/:userID']}>
                <OrganizationGuestPage />
              </RouteArray>

              <Route path="/organization/guests">
                <OrganizationGuestsPage />
              </Route>

              <RouteArray paths={['/organization', '/organization/members']}>
                <OrganizationMembersPage />
              </RouteArray>
            </Routes>
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
            <Routes>
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

              <RouteArray paths={['/account', '/account/overview']}>
                <ProfilePage />
              </RouteArray>
            </Routes>
          }
          layout={layout}
          root="/account"
        />
      </Route>

      {/* Not found */}
      <Route path="*">
        <Navigate to="/devices" />
      </Route>
    </Routes>
  )
}
