import { useSelector } from 'react-redux'
import { State } from '../store'

/* The one gate for virtual devices (graphql-api docs/VIRTUAL-DEVICES.md): a device with no daemon, hosted by a gateway
   on its network. A Test UI setting, and only while Test UI is on, as the device-session gate is. The device queries
   ask for the virtual fields only while it is on, and against an API that does not serve them the portal shows sample
   devices instead (services/graphQLVirtualDevices). */
export const selectVirtualDevicesSetting = (state: State): boolean => !!state.ui.virtualDevices

export const selectVirtualDevices = (state: State): boolean => selectVirtualDevicesSetting(state) && !!state.ui.testUI

export const useVirtualDevices = (): boolean => useSelector(selectVirtualDevices)
