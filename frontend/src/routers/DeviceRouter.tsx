import React, { useEffect, useState } from 'react'
import { DeviceContext } from '../services/Context'
import { Switch, Route, useParams, useHistory } from 'react-router-dom'
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
  const { remoteUI, device, connections, thisId, waiting, silent } = useSelector((state: ApplicationState) => {
    const { fetching, initialized } = getDeviceModel(state)
    return {
      waiting: fetching || !initialized,
      remoteUI: isRemoteUI(state),
      connections: state.connections.all.filter(c => c.deviceID === deviceID),
      device: selectDevice(state, deviceID),
      thisId: state.backend.thisId,
      silent: state.ui.silent,
    }
  })

  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const [loaded, setLoaded] = useState<string | undefined>()

  useEffect(() => {
    if (deviceID && !device?.loaded && !waiting) {
      // check that target device is registered and don't redirect
      if (loaded === deviceID && !(remoteUI && thisId)) {
        if (!silent) dispatch.ui.set({ errorMessage: 'You do not have access to that device.' })
        else dispatch.ui.set({ silent: false })
        history.push('/devices')
      } else if (loaded !== deviceID) {
        dispatch.devices.fetchSingle({ id: deviceID, hidden: true })
        setLoaded(deviceID)
      }
    }
  }, [waiting, device, thisId, loaded])

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
            <Route path={['/devices/:deviceID', '/devices/:deviceID/details']} exact>
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
          </Switch>
        }
        layout={layout}
        root="/devices/:deviceID"
      />
    </DeviceContext.Provider>
  )
}
