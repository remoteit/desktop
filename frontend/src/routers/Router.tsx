import React, { useEffect } from 'react'
import useMobileNavigation from '../hooks/useMobileNavigation'
import { emit } from '../services/Controller'
import { RolesRouter } from './RolesRouter'
import { DeviceRouter } from './DeviceRouter'
import { ServiceRouter } from './ServiceRouter'
import { NetworkRouter } from './NetworkRouter'
import { RedirectOffsite } from '../components/RedirectOffsite'
import { State, Dispatch } from '../store'
import { REGEX_FIRST_PATH } from '../constants'
import { useSelector, useDispatch } from 'react-redux'
import { Switch, Route, Redirect, useHistory, useLocation } from 'react-router-dom'
import { OnboardRouter } from './OnboardRouter'
import { DeviceContextWrapper } from '../components/DeviceContextWrapper'
import { ConnectionOtherPage } from '../pages/ConnectionOtherPage'
import { ConnectionsPage } from '../pages/ConnectionsPage'
import { SettingsPage } from '../pages/SettingsPage'
import { ClaimPage } from '../pages/ClaimPage'
import { TestPage } from '../pages/TestPage'
import { AddPage } from '../pages/AddPage'
import { DevicesPage } from '../pages/DevicesPage'
import { SetupDevice } from '../pages/SetupDevice'
import { SetupWaiting } from '../pages/SetupWaiting'
import { ResellerPage } from '../pages/ResellerPage'
import { CustomerPage } from '../pages/CustomerPage'
import { PlatformAddPage } from '../pages/PlatformAddPage'
import { CustomerAddPage } from '../pages/CustomerAddPage'
import { OrganizationPage } from '../pages/OrganizationPage'
import { CustomerPlansPage } from '../pages/CustomerPlansPage'
import { AnnouncementsPage } from '../pages/AnnouncementsPage'
import { OrganizationAddPage } from '../pages/OrganizationAddPage'
import { OrganizationUserPage } from '../pages/OrganizationUserPage'
import { OrganizationEmptyPage } from '../pages/OrganizationEmptyPage'
import { OrganizationGuestsPage } from '../pages/OrganizationGuestsPage'
import { RaspberrypiOptionsPage } from '../pages/RaspberrypiOptionsPage'
import { OrganizationMembersPage } from '../pages/OrganizationMembersPage'
import { OrganizationSettingsPage } from '../pages/OrganizationSettingsPage'
import { OrganizationLicensingPage } from '../pages/OrganizationLicensingPage'
import { OrganizationMembershipPage } from '../pages/OrganizationMembershipPage'
import { ConnectionDefaultsPage } from '../pages/ConnectionDefaultsPage'
import { LicensingPage } from '../pages/LicensingPage'
import { DynamicPanel } from '../components/DynamicPanel'
import { OptionsPage } from '../pages/OptionsPage'
import { BillingPage } from '../pages/BillingPage'
import { PlansPage } from '../pages/PlansPage'
import { SharePage } from '../pages/SharePage'
import { TagsPage } from '../pages/TagsPage'
import { Panel } from '../components/Panel'
import { LogsPage } from '../pages/LogsPage'
import { isRemoteUI } from '../helpers/uiHelper'
import { GraphsPage } from '../pages/GraphsPage'
import { ProfilePage } from '../pages/ProfilePage'
import { AccountPage } from '../pages/AccountPage'
import { SecurityPage } from '../pages/SecurityPage'
import { FeedbackPage } from '../pages/FeedbackPage'
import { AccessKeyPage } from '../pages/AccessKeyPage'
import { NotificationsPage } from '../pages/NotificationsPage'
import browser, { getOs } from '../services/browser'

export const Router: React.FC<{ layout: ILayout }> = ({ layout }) => {
  useMobileNavigation()
  const history = useHistory()
  const location = useLocation()
  const { ui } = useDispatch<Dispatch>()

  const remoteUI = useSelector(isRemoteUI)
  const redirect = useSelector((state: State) => state.ui.redirect)
  const thisId = useSelector((state: State) => state.backend.thisId)
  const registered = useSelector((state: State) => !!state.backend.thisId)
  const os = useSelector((state: State) => state.backend.environment.os) || getOs()

  useEffect(() => {
    const initialRoute = window.localStorage.getItem('initialRoute')
    if (initialRoute) {
      if (initialRoute !== location.pathname) history.push(initialRoute)
      console.log('UI REDIRECT INIT', initialRoute)
      window.localStorage.removeItem('initialRoute')
    }
  }, [])

  useEffect(() => {
    if (redirect) {
      console.log('UI REDIRECT', redirect)
      history.push(redirect)
      ui.set({ redirect: undefined })
    }
    // track what page is viewed
    if (window.clarity) window.clarity('set', 'page', location.pathname.match(REGEX_FIRST_PATH)?.[0])
    // update navigation state
    emit('navigate', 'STATUS')
  }, [history.location, ui, redirect])

  return (
    <Switch>
      {/* Deep links */}
      <Redirect
        from="/connect/:serviceID"
        to={{
          pathname: '/connections/:serviceID',
          state: { autoConnect: true, isRedirect: true },
        }}
      />
      <Redirect
        from="/launch/:serviceID"
        to={{
          pathname: '/connections/:serviceID',
          state: { autoLaunch: true, isRedirect: true },
        }}
      />
      <Redirect
        from="/copy/:serviceID"
        to={{
          pathname: '/connections/:serviceID',
          state: { autoCopy: true, isRedirect: true },
        }}
      />
      <Redirect
        from="/feedback/:deviceID/:serviceID"
        to={{
          pathname: '/devices/:deviceID/:serviceID',
          state: { autoFeedback: true, isRedirect: true },
        }}
      />
      <Route path="/claim/:claimID">
        <ClaimPage />
      </Route>
      {/* Connections */}
      <Route path="/connections/:serviceID?">
        <DeviceContextWrapper>
          <DynamicPanel
            primary={<ConnectionsPage />}
            secondary={
              <Switch>
                <Route path="/connections/:serviceID/:sessionID/other">
                  <ConnectionOtherPage />
                </Route>

                <Route path="/connections/:serviceID?/:sessionID?">
                  <ServiceRouter basename="/connections/:serviceID?/:sessionID?" />
                </Route>
              </Switch>
            }
            layout={layout}
            root="/connections"
          />
        </DeviceContextWrapper>
      </Route>
      {/* Networks */}
      <Route path="/networks/:networkID?/:serviceID?">
        <DeviceContextWrapper>
          <NetworkRouter layout={layout} />
        </DeviceContextWrapper>
      </Route>
      {/* Add */}
      <Route path="/add/raspberrypi-options">
        <Panel layout={layout}>
          <RaspberrypiOptionsPage />
        </Panel>
      </Route>
      <Route path="/add/:platform/:redirect?">
        <Panel layout={layout}>
          <PlatformAddPage />
        </Panel>
      </Route>
      <Route path="/add">
        <Panel layout={layout}>
          <AddPage />
        </Panel>
      </Route>
      {/* Onboard */}
      <Route path="/onboard/:platform?">
        <Panel layout={layout}>
          <OnboardRouter />
        </Panel>
      </Route>
      {/* Devices */}
      <Route path="/devices/setup">
        {registered ? (
          <Redirect to={{ pathname: `/devices/${thisId}`, state: { isRedirect: true } }} />
        ) : browser.hasBackend ? (
          <Panel layout={layout}>
            <SetupDevice os={os} />
          </Panel>
        ) : (
          <Redirect to={{ pathname: `/add/${os}`, state: { isRedirect: true } }} />
        )}
      </Route>
      <Route path="/devices/setupWaiting">
        <Panel layout={layout}>
          <SetupWaiting os={os} />
        </Panel>
      </Route>
      <Route path="/devices/restore/:platform?">
        <Panel layout={layout}>
          <DevicesPage restore />
        </Panel>
      </Route>
      <Route path="/devices/select">
        <Panel layout={layout}>
          <DevicesPage select />
        </Panel>
      </Route>
      <Route path="/devices" exact>
        {remoteUI ? (
          registered ? (
            <Redirect to={{ pathname: `/devices/${thisId}`, state: { isRedirect: true } }} />
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
        <DeviceContextWrapper>
          <DeviceRouter layout={layout} />
        </DeviceContextWrapper>
      </Route>
      {/* Logs */}
      <Route path="/logs">
        <Panel layout={layout}>
          <LogsPage />
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

              <Route path="/settings/graphs">
                <GraphsPage />
              </Route>

              <Route path="/settings/defaults/:applicationID?">
                <ConnectionDefaultsPage />
              </Route>

              <Route path="/settings/tags">
                <TagsPage />
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
      <Route path="/organization/memberships">
        <Panel layout={layout}>
          <OrganizationMembershipPage />
        </Panel>
      </Route>
      <Route path={['/organization/roles', '/organization/roles/:roleID']}>
        <RolesRouter layout={layout} />
      </Route>
      <Route path="/organization-empty">
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
              <Route path="/organization/customer/add">
                <CustomerAddPage />
              </Route>
              <Route path="/organization/customer/:userID/plans">
                <CustomerPlansPage />
              </Route>
              <Route path="/organization/customer/:userID">
                <CustomerPage />
              </Route>
              <Route path="/organization/customer">
                <ResellerPage />
              </Route>
              <Route path="/organization/add">
                <OrganizationAddPage />
              </Route>
              <Route path="/organization/settings">
                <OrganizationSettingsPage />
              </Route>
              <Route path="/organization/licensing">
                <OrganizationLicensingPage />
              </Route>
              <Route path="/organization/tags">
                <TagsPage />
              </Route>
              <Route path={['/organization/guests/:userID/:deviceID', '/organization/members/:userID/:deviceID']}>
                <SharePage />
              </Route>
              <Route
                path={[
                  '/organization/guests/:userID',
                  '/organization/members/:userID',
                  '/organization/account/:userID',
                ]}
              >
                <OrganizationUserPage />
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
                <RedirectOffsite to={browser.hasBilling ? undefined : 'https://link.remote.it/account/subscriptions'}>
                  <PlansPage />
                </RedirectOffsite>
              </Route>
              <Route path="/account/billing">
                <RedirectOffsite to={browser.hasBilling ? undefined : 'https://link.remote.it/account/billing'}>
                  <BillingPage />
                </RedirectOffsite>
              </Route>
              <Route path="/account/license">
                <LicensingPage />
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
      {/* Not found */}
      <Redirect from="*" to={{ pathname: '/devices', state: { isRedirect: true } }} exact />
    </Switch>
  )
}
