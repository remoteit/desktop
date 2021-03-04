import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Switch, Route, Redirect, useHistory } from 'react-router-dom'
import { SettingsPage } from '../../pages/SettingsPage'
import { ConnectionsPage } from '../../pages/ConnectionsPage'
import { SetupDevice } from '../../pages/SetupDevice'
import { SetupWaiting } from '../../pages/SetupWaiting'
import { NetworkPage } from '../../pages/NetworkPage'
import { DevicesPage } from '../../pages/DevicesPage'
import { ServiceAddPage } from '../../pages/ServiceAddPage'
import { DeviceDetailPage } from '../../pages/DeviceDetailPage'
import { DeviceLogPage } from '../../pages/DeviceLogPage'
import { ServiceDetailPage } from '../../pages/ServiceDetailPage'
import { ServicesPage } from '../../pages/ServicesPage'
import { ServicePage } from '../../pages/ServicePage'
import { LanSharePage } from '../../pages/LanSharePage'
import { UsersPageService } from '../../pages/UsersPageService'
import { UsersPageDevice } from '../../pages/UsersPageDevice'
import { AccountSharePage } from '../../pages/AccountSharePage'
import { AnnouncementsPage } from '../../pages/AnnouncementsPage'
import { AccountAccessPage } from '../../pages/AccountAccessPage'
import { AccountMembershipPage } from '../../pages/AccountMembershipPage'
import { DeviceEditPage } from '../../pages/DeviceEditPage'
import { ServiceEditPage } from '../../pages/ServiceEditPage'
import { SharePage } from '../../pages/SharePage/SharePage'
import { getLinks } from '../../helpers/routeHelper'
import { LogPage } from '../../pages/LogPage'
import { ReportsPage } from '../../pages/ReportsPage'

export const Router: React.FC<{ largeWidth?: boolean }> = ({ largeWidth }) => {
  const history = useHistory()
  const { ui } = useDispatch<Dispatch>()
  const { redirect, targetDevice, targets, registered, os, links } = useSelector((state: ApplicationState) => ({
    redirect: state.ui.redirect,
    targetDevice: state.backend.device,
    targets: state.backend.targets,
    registered: !!state.backend.device.uid,
    uninstalling: state.ui.uninstalling,
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

  const routes = (
    <>
      <Route path={links.waiting}>
        <SetupWaiting os={os} targetDevice={targetDevice} />
      </Route>
      <Route path="/devices/setup">
        {registered ? <Redirect to={`/devices/${targetDevice.uid}/edit`} /> : <SetupDevice os={os} />}
      </Route>
      <Route path="/devices/membership">
        <AccountMembershipPage />
      </Route>
      <Route
        path={[
          '/connections/:serviceID/users/:email',
          '/connections/:serviceID/users/share',
          '/connections/:serviceID/share',
          '/devices/:deviceID/:serviceID/users/share',
          '/devices/:deviceID/:serviceID/users/:email',
          '/devices/:deviceID/:serviceID/share',
          '/devices/:deviceID/users/share',
          '/devices/:deviceID/users/:email',
          '/devices/:deviceID/share',
        ]}
      >
        <SharePage />
      </Route>
      <Route path={links.scan}>
        <NetworkPage />
      </Route>
      <Route path={['/devices/:deviceID/:serviceID/lan', '/connections/:serviceID/lan']}>
        <LanSharePage />
      </Route>
      <Route path={['/devices/:deviceID/:serviceID/log', '/connections/:serviceID/log']}>
        <LogPage />
      </Route>
      <Route path={['/devices/:deviceID/:serviceID/users', '/connections/:serviceID/users']}>
        <UsersPageService />
      </Route>
      <Route path={['/devices/:deviceID/:serviceID/details', '/connections/:serviceID/details']}>
        <ServiceDetailPage />
      </Route>
      <Route path={links.add}>
        <ServiceAddPage targetDevice={targetDevice} targets={targets} />
      </Route>
      <Route path={[links.service, '/devices/:deviceID/:serviceID/edit', '/connections/:serviceID/edit']}>
        <ServiceEditPage targetDevice={targetDevice} targets={targets} />
      </Route>
      <Route path="/devices/:deviceID/users">
        <UsersPageDevice />
      </Route>
      <Route path="/devices/:deviceID/details">
        <DeviceDetailPage />
      </Route>
      <Route path="/devices/:deviceID/logs">
        <DeviceLogPage />
      </Route>
      <Route path={links.edit}>
        <DeviceEditPage targetDevice={targetDevice} targets={targets} />
      </Route>
      {/* <Route path={['/devices/:deviceID/:serviceID', '/connections/:serviceID']}>
        <ServicePage />
      </Route> */}
      {/* <Route path="/devices/:deviceID">
        <ServicesPage />
      </Route> */}
    </>
  )

  return (
    <Switch>
      {/* Devices page */}
      <Route path="/devices/:deviceID">
        <ServicesPage />
        <Switch>
          <Route path="/devices/:deviceID/:serviceID">
            <ServicePage />
          </Route>
        </Switch>
      </Route>
      {/* Common Routes */}
      <Route path="/connections">
        <ConnectionsPage />
      </Route>
      <Route path="/configure">
        {registered ? <Redirect to={`/configure/${targetDevice.uid}`} /> : <SetupDevice os={os} />}
      </Route>
      <Route path="/devices">
        <DevicesPage />
      </Route>
      <Redirect
        from={'/connect/:serviceID'}
        to={{
          pathname: '/connections/:serviceID',
          state: { autoConnect: true },
        }}
      />
      <Route path={['/settings/membership/share', '/settings/access/share']}>
        <AccountSharePage />
      </Route>
      <Route path="/settings/access">
        <AccountAccessPage />
      </Route>
      <Route path="/settings/reports">
        <ReportsPage />
      </Route>
      <Route path="/settings">
        <SettingsPage />
      </Route>
      <Route path="/announcements">
        <AnnouncementsPage />
      </Route>
      <Route path="/">
        <Redirect to={links.home} />
      </Route>
    </Switch>
  )
}
