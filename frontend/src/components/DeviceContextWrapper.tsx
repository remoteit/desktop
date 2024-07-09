import React, { useEffect } from 'react'
import { selectDeviceService } from '../selectors/devices'
import { DeviceContext } from '../services/Context'
import { selectNetwork } from '../models/networks'
import { REGEX_FIRST_PATH, REGEX_SERVICE_ID } from '../constants'
import { useLocation, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { State, Dispatch } from '../store'
import { selectSharedNetwork } from '../models/networks'
import { selectConnection } from '../selectors/connections'
import { selectDeviceModelAttributes } from '../selectors/devices'
import { isRemoteUI } from '../helpers/uiHelper'
import { LoadingMessage } from './LoadingMessage'

export const DeviceContextWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  let { deviceID, serviceID, networkID } = useParams<{ deviceID?: string; serviceID?: string; networkID?: string }>()
  if (!deviceID || !REGEX_SERVICE_ID.test(deviceID)) deviceID = undefined
  if (!serviceID || !REGEX_SERVICE_ID.test(serviceID)) serviceID = undefined

  const [service, device] = useSelector((state: State) => selectDeviceService(state, undefined, deviceID, serviceID))
  const user = useSelector((state: State) => state.user)
  const network = useSelector((state: State) =>
    networkID ? selectNetwork(state, networkID) : selectSharedNetwork(state, serviceID)
  )
  const connection = useSelector((state: State) => selectConnection(state, service))
  const connections = useSelector((state: State) => state.connections.all).filter(c => c.deviceID === deviceID)
  const remoteUI = useSelector(isRemoteUI)
  const thisId = useSelector((state: State) => state.backend.thisId)
  const { fetching, initialized } = useSelector(selectDeviceModelAttributes)

  const waiting = fetching || !initialized

  const dispatch = useDispatch<Dispatch>()
  const location = useLocation()
  const instance: IInstance | undefined = network || device

  useEffect(() => {
    if ((instance?.loaded && device?.loaded) || waiting) return

    if (deviceID && !(remoteUI && thisId)) {
      console.log('LOADING DEVICE DATA', deviceID)
      dispatch.devices.fetchSingleFull({ id: deviceID, hidden: true, redirect: '/devices' })
    } else if (serviceID) {
      const redirect = location.pathname.match(REGEX_FIRST_PATH)?.[0]
      if (network && network.cloud && !network.loaded) {
        console.log('LOADING NETWORK DATA', network, redirect)
        dispatch.networks.fetchSingle({ network, redirect })
      } else {
        console.log('LOADING SERVICE DATA', serviceID, redirect)
        dispatch.devices.fetchSingleFull({ id: serviceID, hidden: true, redirect, isService: true })
      }
    }
  }, [deviceID, serviceID, waiting, thisId, instance?.loaded, device?.loaded])

  return (
    <DeviceContext.Provider value={{ user, service, device, network, instance, connection, connections, waiting }}>
      {children}
    </DeviceContext.Provider>
  )
}
