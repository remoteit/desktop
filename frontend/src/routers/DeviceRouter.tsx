import React, { useEffect } from 'react'
import { DeviceContext } from '../services/Context'
import { Switch, Route, Redirect, useParams } from 'react-router-dom'
import { ApplicationState, Dispatch } from '../store'
import { getDeviceModel } from '../models/accounts'
import { selectDevice } from '../models/devices'
import { isRemoteUI } from '../helpers/uiHelper'
import { ScanPage } from '../pages/ScanPage'
import { ServiceAddPage } from '../pages/ServiceAddPage'
import { DeviceLogPage } from '../pages/DeviceLogPage'
import { DeviceDetailPage } from '../pages/DeviceDetailPage'
import { ServiceDetailPage } from '../pages/ServiceDetailPage'
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
import { useDispatch, useSelector } from 'react-redux'
import { DeviceTransferPage } from '../pages/DeviceTransferPage'

export const DeviceRouter: React.FC<{ layout: ILayout }> = ({ layout }) => {
  const { deviceID } = useParams<{ deviceID?: string }>()
  const { remoteUI, device, connections, defaultServiceLookup, thisId, waiting } = useSelector(
    (state: ApplicationState) => {
      const { fetching, initialized } = getDeviceModel(state)
      return {
        waiting: fetching || !initialized,
        remoteUI: isRemoteUI(state),
        connections: state.connections.all.filter(c => c.deviceID === deviceID),
        defaultServiceLookup: state.ui.defaultService,
        device: selectDevice(state, deviceID),
        thisId: state.backend.thisId,
      }
    }
  )
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    if (deviceID && !device?.loaded && !waiting && !(remoteUI && thisId)) {
      dispatch.devices.fetchSingle({ id: deviceID, hidden: true, redirect: '/devices' })
    }
  }, [deviceID, waiting, device, thisId])

  const defaultService = () => {
    const lookupResult = defaultServiceLookup[deviceID || '']
    const serviceId = lookupResult === undefined ? device?.services?.[0]?.id : lookupResult
    const redirect = serviceId ? `${serviceId}/connect` : 'details'
    return `/devices/${deviceID}/${redirect}`
  }

  if (waiting && !device) return <LoadingMessage message="Fetching device" />

  return (
    <DeviceContext.Provider value={{ device, connections }}>
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
            <Route path="/devices/:deviceID/:serviceID/details">
              <ServiceDetailPage device={device} />
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
    </DeviceContext.Provider>
  )
}
