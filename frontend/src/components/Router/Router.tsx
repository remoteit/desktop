import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { isElectron, isDev } from '../../services/Browser'
import { Switch, Route, Redirect, useHistory } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import { SettingsPage } from '../../pages/SettingsPage'
import { ConnectionsPage } from '../../pages/ConnectionsPage'
import { SetupServices } from '../../pages/SetupServices'
import { SetupDevice } from '../../pages/SetupDevice'
import { SetupWaiting } from '../../pages/SetupWaiting'
import { SetupView } from '../../pages/SetupView'
import { NetworkPage } from '../../pages/NetworkPage'
import { DevicesPage } from '../../pages/DevicesPage'
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
  const { targetDevice, targets, dataReady, os } = useSelector((state: ApplicationState) => ({
    targetDevice: state.backend.device,
    targets: state.backend.targets,
    dataReady: state.backend.dataReady,
    uninstalling: state.ui.uninstalling,
    os: state.backend.environment.os,
  }))
  const { guest } = usePermissions()
  const history = useHistory()
  const registered = !!targetDevice.uid

  let setupLocation = 'setupDevice'
  if (registered) setupLocation = 'setupServices'
  if (guest) setupLocation = 'setupView'

  useEffect(() => {
    if (dataReady && !isDev()) {
      if (isElectron()) history.push('/')
      else history.push('/devices/setup')
    }
  }, [dataReady])

  console.log('ROUTER', history.location.pathname)

  return (
    <Switch>
      <Route path={['/settings/setupServices/network', '/devices/setupServices/network']}>
        <NetworkPage />
      </Route>
      <Route path={['/settings/setupServices', '/devices/setupServices']}>
        <SetupServices os={os} targetDevice={targetDevice} targets={targets} />
      </Route>
      <Route path={['/settings/setupWaiting', '/devices/setupWaiting']}>
        <SetupWaiting os={os} targetDevice={targetDevice} />
      </Route>
      <Route path={['/settings/setupDevice', '/devices/setupDevice']}>
        <SetupDevice os={os} targetDevice={targetDevice} />
      </Route>
      <Route path={['/settings/setupView', '/devices/setupView']}>
        <SetupView targetDevice={targetDevice} targets={targets} />
      </Route>
      <Route path="/devices/setup">
        <Redirect to={`/devices/${setupLocation}`} />
      </Route>
      <Route path="/settings/setup">
        <Redirect to={`/settings/${setupLocation}`} />
      </Route>
      <Route
        path={[
          '/connections/:serviceID/users/:email',
          '/connections/:serviceID/users/share',
          '/devices/:deviceID/:serviceID/users/share',
          '/devices/:deviceID/:serviceID/users/:email',
          '/devices/:deviceID/users/share',
          '/devices/:deviceID/users/:email',
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
      <Route path={['/devices/:deviceID/:serviceID/edit', '/connections/:serviceID/edit']}>
        <ServiceEditPage targets={targets} />
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
      <Route path="/settings">
        <SettingsPage />
      </Route>
      <Route exact path="/">
        <Redirect to="/devices" />
      </Route>
    </Switch>
  )
}
