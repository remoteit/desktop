import React, { useEffect, useState } from 'react'
import { RouteArray } from '../components/RouteArray'
import { Routes, Route, useParams, useNavigate } from 'react-router-dom'
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
  const { remoteUI, device, thisId, fetching, silent } = useSelector((state: ApplicationState) => ({
    remoteUI: isRemoteUI(state),
    fetching: getDeviceModel(state).fetching,
    device: selectDevice(state, deviceID),
    thisId: state.backend.thisId,
    silent: state.ui.silent,
  }))

  const navigate = useNavigate()
  const dispatch = useDispatch<Dispatch>()
  const [loaded, setLoaded] = useState<boolean>(false)

  useEffect(() => {
    if (deviceID && !device && !fetching) {
      // check that target device is registered and don't redirect
      if (loaded && !(remoteUI && thisId)) {
        if (!silent) dispatch.ui.set({ errorMessage: 'You do not have access to that device.' })
        else dispatch.ui.set({ silent: false })
        navigate('/devices')
      } else if (!loaded) {
        dispatch.devices.fetchSingle({ id: deviceID, hidden: true })
        setLoaded(true)
      }
    }
  }, [fetching, device, thisId, navigate])

  if (fetching && !device) return <LoadingMessage message="Fetching device..." />

  return (
    <DynamicPanel
      primary={<DevicePage device={device} />}
      secondary={
        <Routes>
          <Route path="/devices/:deviceID/add/scan">
            <ScanPage />
          </Route>
          <Route path="/devices/:deviceID/add">
            <ServiceAddPage device={device} />
          </Route>
          <RouteArray paths={['/devices/:deviceID/users/:userID', '/devices/:deviceID/share']}>
            <SharePage />
          </RouteArray>
          <Route path="/devices/:deviceID/edit">
            <DeviceEditPage device={device} />
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
          <RouteArray paths={['/devices/:deviceID', '/devices/:deviceID/details']}>
            <DeviceDetailPage device={device} />
          </RouteArray>
          <RouteArray
            paths={[
              '/devices/:deviceID/:serviceID/users/share',
              '/devices/:deviceID/:serviceID/users/:userID',
              '/devices/:deviceID/:serviceID/share',
            ]}
          >
            <SharePage />
          </RouteArray>
          <Route path="/devices/:deviceID/:serviceID/users">
            <ServiceUsersPage device={device} />
          </Route>
          <Route path="/devices/:deviceID/:serviceID/edit">
            <ServiceEditPage device={device} />
          </Route>
          <Route path="/devices/:deviceID/:serviceID/details">
            <ServiceDetailPage device={device} />
          </Route>
          <RouteArray paths={['/devices/:deviceID/:serviceID/lan', '/devices/:deviceID/:serviceID/connect/lan']}>
            <LanSharePage />
          </RouteArray>
          <RouteArray paths={['/devices/:deviceID/:serviceID/connect', '/devices/:deviceID/:serviceID']}>
            <ServiceConnectPage device={device} />
          </RouteArray>
        </Routes>
      }
      layout={layout}
      root="/devices/:deviceID"
    />
  )
}
