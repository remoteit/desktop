import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { isElectron } from '../../services/Browser'
import { Switch, Route, Redirect, useHistory } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import { SettingsPage } from '../../pages/SettingsPage'
import { ConnectionsPage } from '../../pages/ConnectionsPage'
import { SetupServices } from '../../pages/SetupServices'
import { SetupDevice } from '../../pages/SetupDevice'
import { SetupWaiting } from '../../pages/SetupWaiting'
import { SetupSuccess } from '../../pages/SetupSuccess'
import { SetupView } from '../../pages/SetupView'
import { NetworkPage } from '../../pages/NetworkPage'
import { DevicesPage } from '../../pages/DevicesPage'
import { ServicesPage } from '../../pages/ServicesPage'
import { ServicePage } from '../../pages/ServicePage'
import { LanSharePage } from '../../pages/LanSharePage'
import { UsersPage } from '../../pages/UsersPage'
import { LogPage } from '../../pages/LogPage'

export const Router: React.FC = () => {
  const { device, targets, dataReady, os } = useSelector((state: ApplicationState) => ({
    device: state.backend.device,
    targets: state.backend.targets,
    dataReady: state.backend.dataReady,
    uninstalling: state.ui.uninstalling,
    os: state.backend.environment.os,
  }))
  const { guest, notElevated } = usePermissions()
  const history = useHistory()
  const registered = !!device.uid

  let setupLocation = 'setupDevice'
  if (registered) setupLocation = 'setupServices'
  if (guest || notElevated) setupLocation = 'setupView'

  useEffect(() => {
    if (dataReady) {
      if (!device.name && !isElectron()) history.push('/settings/setupDevice')
      else history.push('/')
    }
  }, [dataReady])

  return (
    <Switch>
      <Route path="/connections/:serviceID/lan">
        <LanSharePage />
      </Route>
      <Route path="/connections/:serviceID/log">
        <LogPage />
      </Route>
      <Route path="/connections/:serviceID/users">
        <UsersPage />
      </Route>
      <Route path="/connections/:serviceID">
        <ServicePage />
      </Route>
      <Route path="/connections">
        <ConnectionsPage />
      </Route>
      <Route path={['/settings/setupServices/network', '/devices/setupServices/network']}>
        <NetworkPage />
      </Route>
      <Route path={['/settings/setupServices', '/devices/setupServices']}>
        <SetupServices os={os} device={device} targets={targets} />
      </Route>
      <Route path={['/settings/setupSuccess', '/devices/setupSuccess']}>
        <SetupSuccess os={os} device={device} />
      </Route>
      <Route path={['/settings/setupWaiting', '/devices/setupWaiting']}>
        <SetupWaiting os={os} device={device} />
      </Route>
      <Route path={['/settings/setupDevice', '/devices/setupDevice']}>
        <SetupDevice os={os} device={device} />
      </Route>
      <Route path={['/settings/setupView', '/devices/setupView']}>
        <SetupView device={device} targets={targets} />
      </Route>
      <Route path="/devices/setup">
        <Redirect to={`/devices/${setupLocation}`} />
      </Route>
      <Route path="/settings/setup">
        <Redirect to={`/settings/${setupLocation}`} />
      </Route>
      <Route path="/devices/:deviceID/:serviceID/lan">
        <LanSharePage />
      </Route>
      <Route path="/devices/:deviceID/:serviceID/log">
        <LogPage />
      </Route>
      <Route path="/devices/:deviceID/:serviceID/users">
        <UsersPage />
      </Route>
      <Route path="/devices/:deviceID/:serviceID">
        <ServicePage />
      </Route>
      <Route path="/devices/:deviceID">
        <ServicesPage />
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
