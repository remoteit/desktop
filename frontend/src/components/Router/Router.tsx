import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { isElectron } from '../../services/Browser'
import { Switch, Route, Redirect } from 'react-router-dom'
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
import { AccountAccessPage } from '../../pages/AccountAccessPage'
import { AccountMembershipPage } from '../../pages/AccountMembershipPage'
import { DeviceEditPage } from '../../pages/DeviceEditPage'
import { ServiceEditPage } from '../../pages/ServiceEditPage'
import { SharePage } from '../../pages/SharePage/SharePage'
import { LogPage } from '../../pages/LogPage'

export const Router: React.FC = () => {
  const { targetDevice, targets, registered, os } = useSelector((state: ApplicationState) => ({
    targetDevice: state.backend.device,
    targets: state.backend.targets,
    registered: !!state.backend.device.uid,
    uninstalling: state.ui.uninstalling,
    os: state.backend.environment.os,
  }))

  return (
    <Switch>
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
      <Route path="/settings/membership">
        <AccountMembershipPage />
      </Route>
      <Route path="/devices/setupWaiting">
        <SetupWaiting os={os} targetDevice={targetDevice} />
      </Route>
      <Route path="/devices/setupDevice">
        {registered ? <Redirect to={`/devices/${targetDevice.uid}/edit`} /> : <SetupDevice os={os} />}
      </Route>
      <Route path="/devices/setup">
        <Redirect to="/devices/setupDevice" />
      </Route>
      <Route path="/settings">
        <SettingsPage />
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
      <Route path="/devices/:deviceID/edit/add-service/network">
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
      <Route path="/devices/:deviceID/edit/add-service">
        <ServiceAddPage targets={targets} />
      </Route>
      <Route
        path={[
          '/devices/:deviceID/:serviceID/edit',
          '/devices/:deviceID/edit/:serviceID',
          '/connections/:serviceID/edit',
        ]}
      >
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
      <Route path="/devices/:deviceID/edit">
        <DeviceEditPage targetDevice={targetDevice} targets={targets} />
      </Route>
      <Route path={['/devices/:deviceID/:serviceID', '/connections/:serviceID']}>
        <ServicePage />
      </Route>
      <Route path="/devices/:deviceID">
        <ServicesPage />
      </Route>
      <Route path="/connections">
        <ConnectionsPage />
      </Route>
      <Route path="/devices">
        <DevicesPage />
      </Route>
      <Route path="/">{isElectron() ? <Redirect to="/devices" /> : <Redirect to="/devices/setup" />}</Route>
    </Switch>
  )
}
