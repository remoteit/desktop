import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { isElectron } from '../../services/Browser'
import { Switch, Route, Redirect } from 'react-router-dom'
import { SettingsPage } from '../../pages/SettingsPage'
import { ConnectionsPage } from '../../pages/ConnectionsPage'
import { SetupServices } from '../../pages/SetupServices'
import { SetupDevice } from '../../pages/SetupDevice'
import { SetupWaiting } from '../../pages/SetupWaiting'
import { SetupView } from '../../pages/SetupView'
import { NetworkPage } from '../../pages/NetworkPage'
import { DevicesPage } from '../../pages/DevicesPage'
import { ServiceAddPage } from '../../pages/ServiceAddPage'
import { DeviceDetailPage } from '../../pages/DeviceDetailPage'
import { ServiceDetailPage } from '../../pages/ServiceDetailPage'
import { ServicesPage } from '../../pages/ServicesPage'
import { ServicePage } from '../../pages/ServicePage'
import { LanSharePage } from '../../pages/LanSharePage'
import { UsersPageService } from '../../pages/UsersPageService'
import { UsersPageDevice } from '../../pages/UsersPageDevice'
import { LogPage } from '../../pages/LogPage'
import { DeviceEditPage } from '../../pages/DeviceEditPage'
import { ServiceEditPage } from '../../pages/ServiceEditPage'
import { SharePage } from '../../pages/SharePage/SharePage'

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
      <Route path={['/settings/setupServices/network', '/devices/:deviceID/edit/add-service/network']}>
        <NetworkPage />
      </Route>
      <Route path="/settings/setupServices">
        <SetupServices os={os} targetDevice={targetDevice} targets={targets} />
      </Route>
      <Route path={['/settings/setupWaiting', '/devices/setupWaiting']}>
        <SetupWaiting os={os} targetDevice={targetDevice} />
      </Route>
      <Route path="/settings/setupDevice">
        {registered ? <Redirect to="./setupServices" /> : <SetupDevice os={os} />}
      </Route>
      <Route path="/devices/setupDevice">
        {registered ? <Redirect to={`/devices/${targetDevice.uid}/edit`} /> : <SetupDevice os={os} />}
      </Route>
      <Route path={['/settings/setupView', '/devices/setupView']}>
        <SetupView targetDevice={targetDevice} targets={targets} />
      </Route>
      <Route path={['/devices/setup', '/settings/setup']}>
        <Redirect to="./setupDevice" />
      </Route>
      <Route path="/settings">
        <SettingsPage />
      </Route>
      <Route
        path={[
          '/connections/:serviceID/users/:email',
          '/connections/:serviceID/users/share',
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
