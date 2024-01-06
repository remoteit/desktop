import React from 'react'
import { REGEX_SERVICE_ID } from '../constants'
import { ApplicationState } from '../store'
import { DeviceOptionMenu } from './DeviceOptionMenu'
import { selectDevice } from '../selectors/devices'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

export function HeaderDeviceOptionMenu() {
  let { deviceID, serviceID } = useParams<{ deviceID?: string; serviceID?: string }>()

  if (!serviceID || !REGEX_SERVICE_ID.test(serviceID)) serviceID = undefined

  const { device, singlePanel } = useSelector((state: ApplicationState) => ({
    device: selectDevice(state, undefined, deviceID),
    singlePanel: state.ui.layout.singlePanel,
  }))

  const hide = !device || (singlePanel && serviceID)

  return hide ? null : <DeviceOptionMenu device={device} />
}
