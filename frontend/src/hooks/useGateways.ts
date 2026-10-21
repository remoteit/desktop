import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { getAllDevices } from '../selectors/devices'
import { canHost } from '../helpers/virtualDeviceHelper'

// The devices loaded so far that the viewer may host a virtual device on, by name.
export const selectGateways = createSelector([getAllDevices], devices =>
  devices.filter(canHost).sort((a, b) => a.name.localeCompare(b.name))
)

export const useGateways = (): IDevice[] => useSelector(selectGateways)
