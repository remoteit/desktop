import React, { useEffect } from 'react'
import { selectById } from '../models/devices'
import { DeviceContext } from '../services/Context'
import { REGEX_FIRST_PATH } from '../shared/constants'
import { useLocation, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { selectSharedNetwork } from '../models/networks'
import { selectConnection } from '../helpers/connectionHelper'
import { getDeviceModel } from '../models/accounts'
import { isRemoteUI } from '../helpers/uiHelper'

export const DeviceContextWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  let { deviceID, serviceID } = useParams<{ deviceID?: string; serviceID?: string }>()
  if (!deviceID?.includes(':')) deviceID = undefined
  if (!serviceID?.includes(':')) serviceID = undefined
  const { device, network, connections, service, connection, remoteUI, thisId, waiting } = useSelector(
    (state: ApplicationState) => {
      const { fetching, initialized } = getDeviceModel(state)
      const [service, device] = selectById(state, serviceID || deviceID)
      return {
        device,
        service,
        network: selectSharedNetwork(state, serviceID),
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
    if (serviceID && !instance?.loaded && !waiting) {
      const redirect = location.pathname.match(REGEX_FIRST_PATH)?.[0]
      if (network) {
        dispatch.networks.fetchSingle({ network, redirect })
        console.log('LOADING NETWORK DATA', network, redirect)
      } else {
        dispatch.devices.fetchSingle({ id: serviceID, hidden: true, redirect, isService: true })
        console.log('LOADING SERVICE DATA', serviceID, redirect)
      }
    } else if (deviceID && !device?.loaded && !waiting && !(remoteUI && thisId)) {
      dispatch.devices.fetchSingle({ id: deviceID, hidden: true, redirect: '/devices' })
      console.log('LOADING DEVICE DATA', deviceID)
    }
  }, [deviceID, serviceID, waiting, device, thisId, instance])

  return (
    <DeviceContext.Provider value={{ service, connection, network, device, connections, instance, waiting }}>
      {children}
    </DeviceContext.Provider>
  )
}
