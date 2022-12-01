import React, { useEffect } from 'react'
import { selectById } from '../models/devices'
import { DeviceContext } from '../services/Context'
import { selectNetwork } from '../models/networks'
import { REGEX_FIRST_PATH } from '../shared/constants'
import { useLocation, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { selectSharedNetwork } from '../models/networks'
import { selectConnection } from '../helpers/connectionHelper'
import { getDeviceModel } from '../models/accounts'
import { isRemoteUI } from '../helpers/uiHelper'

export const DeviceContextWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  let { deviceID, serviceID, networkID } = useParams<{ deviceID?: string; serviceID?: string; networkID?: string }>()
  if (!deviceID?.includes(':')) deviceID = undefined
  if (!serviceID?.includes(':')) serviceID = undefined
  const { device, network, connections, service, connection, remoteUI, thisId, waiting } = useSelector(
    (state: ApplicationState) => {
      const { fetching, initialized } = getDeviceModel(state)
      const [service, device] = selectById(state, serviceID || deviceID)
      return {
        device,
        service,
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
    if (instance?.loaded || waiting) return

    if (deviceID && !(remoteUI && thisId)) {
      console.log('LOADING DEVICE DATA', deviceID)
      dispatch.devices.fetchSingle({ id: deviceID, hidden: true, redirect: '/devices' })
    } else if (serviceID) {
      const redirect = location.pathname.match(REGEX_FIRST_PATH)?.[0]
      if (network) {
        console.log('LOADING NETWORK DATA', network, redirect)
        dispatch.networks.fetchSingle({ network, redirect })
      } else {
        console.log('LOADING SERVICE DATA', serviceID, redirect)
        dispatch.devices.fetchSingle({ id: serviceID, hidden: true, redirect, isService: true })
      }
    }
  }, [deviceID, serviceID, waiting, thisId, instance])

  return (
    <DeviceContext.Provider value={{ service, connection, network, device, connections, instance, waiting }}>
      {children}
    </DeviceContext.Provider>
  )
}
