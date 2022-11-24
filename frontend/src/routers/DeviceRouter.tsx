import React from 'react'
import { DeviceContext } from '../services/Context'
import { Switch, Route, Redirect } from 'react-router-dom'
import { ApplicationState } from '../store'
import { getDeviceModel } from '../models/accounts'
import { ScanPage } from '../pages/ScanPage'
import { ServiceAddPage } from '../pages/ServiceAddPage'
import { DeviceLogPage } from '../pages/DeviceLogPage'
import { DeviceDetailPage } from '../pages/DeviceDetailPage'
import { ServiceDefaultsPage } from '../pages/ServiceDefaultsPage'
import { ServiceConnectPage } from '../pages/ServiceConnectPage'
import { ServiceUsersPage } from '../pages/ServiceUsersPage'
import { DeviceUsersPage } from '../pages/DeviceUsersPage'
import { ServiceEditPage } from '../pages/ServiceEditPage'
import { LoadingMessage } from '../components/LoadingMessage'
import { DeviceEditPage } from '../pages/DeviceEditPage'
import { LanSharePage } from '../pages/LanSharePage'
import { DynamicPanel } from '../components/DynamicPanel'
import { DevicePage } from '../pages/DevicePage'
import { SharePage } from '../pages/SharePage'
import { useSelector } from 'react-redux'
import { DeviceTransferPage } from '../pages/DeviceTransferPage'

export const DeviceRouter: React.FC<{ layout: ILayout }> = ({ layout }) => {
  const { device } = React.useContext(DeviceContext)

  const { defaultServiceLookup, waiting } = useSelector((state: ApplicationState) => {
    const { fetching, initialized } = getDeviceModel(state)
    return {
      waiting: fetching || !initialized,
      defaultServiceLookup: state.ui.defaultService,
    }
  })

  const defaultService = () => {
    const lookupResult = defaultServiceLookup[device?.id || '']
    const validLookup = lookupResult === null || device?.services.find(s => s.id === lookupResult)
    const serviceId = validLookup ? lookupResult : device?.services?.[0]?.id
    const redirect = serviceId ? `${serviceId}/connect` : 'details'
    return `/devices/${device?.id}/${redirect}`
  }

  if (waiting && !device) return <LoadingMessage message="Fetching device" />

  return (
    <DynamicPanel
      primary={<DevicePage />}
      secondary={
        <Switch>
          <Route path="/devices/:deviceID/add/scan">
            <ScanPage />
          </Route>
          <Route path="/devices/:deviceID/add">
            <ServiceAddPage device={device} />
          </Route>
          <Route path="/devices/:deviceID/addForm">
            <ServiceAddPage device={device} form />
          </Route>
          <Route path={['/devices/:deviceID/users/:userID', '/devices/:deviceID/share']}>
            <SharePage />
          </Route>
          <Route path="/devices/:deviceID/edit">
            <DeviceEditPage />
          </Route>
          <Route path="/devices/:deviceID/transfer">
            <DeviceTransferPage device={device} />
          </Route>
          <Route path="/devices/:deviceID/users">
            <DeviceUsersPage device={device} />
          </Route>
          <Route path="/devices/:deviceID/logs">
            <DeviceLogPage device={device} />
          </Route>
          <Route path="/devices/:deviceID/details">
            <DeviceDetailPage />
          </Route>
          <Route
            path={[
              '/devices/:deviceID/:serviceID/users/share',
              '/devices/:deviceID/:serviceID/users/:userID',
              '/devices/:deviceID/:serviceID/share',
            ]}
          >
            <SharePage />
          </Route>
          <Route path="/devices/:deviceID/:serviceID/users">
            <ServiceUsersPage device={device} />
          </Route>
          <Route path="/devices/:deviceID/:serviceID/edit">
            <ServiceEditPage device={device} />
          </Route>
          <Route path="/devices/:deviceID/:serviceID/defaults">
            <ServiceDefaultsPage />
          </Route>
          <Route path={['/devices/:deviceID/:serviceID/lan', '/devices/:deviceID/:serviceID/connect/lan']}>
            <LanSharePage />
          </Route>
          <Route path={['/devices/:deviceID/:serviceID/connect', '/devices/:deviceID/:serviceID']}>
            <ServiceConnectPage />
          </Route>
          <Route path="*">
            <Redirect to={defaultService()} />
          </Route>
        </Switch>
      }
      layout={layout}
      root="/devices/:deviceID"
    />
  )
}
