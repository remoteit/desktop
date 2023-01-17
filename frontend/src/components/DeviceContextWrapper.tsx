import React, { useEffect } from 'react'
import { selectById, selectDevice } from '../selectors/devices'
import { DeviceContext } from '../services/Context'
import { selectNetwork } from '../models/networks'
import { REGEX_FIRST_PATH, REGEX_SERVICE_ID } from '../shared/constants'
import { useLocation, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { selectSharedNetwork } from '../models/networks'
import { selectConnection } from '../selectors/connections'
import { getDeviceModel } from '../selectors/devices'
import { isRemoteUI } from '../helpers/uiHelper'

export const DeviceContextWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  let { deviceID, serviceID, networkID } = useParams<{ deviceID?: string; serviceID?: string; networkID?: string }>()
  if (!deviceID || !REGEX_SERVICE_ID.test(deviceID)) deviceID = undefined
  if (!serviceID || !REGEX_SERVICE_ID.test(serviceID)) serviceID = undefined
  const { user, device, network, connections, service, connection, remoteUI, thisId, waiting } = useSelector(
    (state: ApplicationState) => {
      let device: IDevice | undefined
      let service: IService | undefined
      const { fetching, initialized } = getDeviceModel(state)
      if (deviceID) {
        device = selectDevice(state, undefined, deviceID)
        if (device && serviceID) service = device.services.find(s => s.id === serviceID)
      } else if (serviceID) {
        ;[service, device] = selectById(state, undefined, serviceID)
      }
      return {
        device,
        service,
        user: state.user,
        network: networkID ? selectNetwork(state, networkID) : selectSharedNetwork(state, serviceID),
        connection: selectConnection(state, service),
        connections: state.connections.all.filter(c => c.deviceID === deviceID),
        waiting: fetching || !initialized,
        remoteUI: isRemoteUI(state),
        thisId: state.backend.thisId,
      }
    }
  )
  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const instance: IInstance | undefined = network || device

  useEffect(() => {
    if (instance?.loaded || device?.loaded || waiting) return

    if (deviceID && !(remoteUI && thisId)) {
      console.log('LOADING DEVICE DATA', deviceID)
      dispatch.devices.fetchSingle({ id: deviceID, hidden: true, redirect: '/devices' })
    } else if (serviceID) {
      const redirect = location.pathname.match(REGEX_FIRST_PATH)?.[0]
      if (network && network.cloud) {
        console.log('LOADING NETWORK DATA', network, redirect)
        dispatch.networks.fetchSingle({ network, redirect })
      } else {
        console.log('LOADING SERVICE DATA', serviceID, redirect)
        dispatch.devices.fetchSingle({ id: serviceID, hidden: true, redirect, isService: true })
      }
    }
  }, [deviceID, serviceID, waiting, thisId, instance])

  return (
    <DeviceContext.Provider value={{ user, service, connection, network, device, connections, instance, waiting }}>
      {children}
    </DeviceContext.Provider>
  )
}
