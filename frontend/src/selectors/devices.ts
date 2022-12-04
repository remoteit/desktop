import { ApplicationState } from '../store'
import { createSelector } from 'reselect'
import { getUserId, getActiveAccountId } from '../selectors/accounts'
import { masterAttributes, deviceAttributes } from '../components/Attributes'
import { selectLimitsLookup } from './organizations'

const getDevicesState = (state: ApplicationState) => state.devices
const getColumns = (state: ApplicationState) => state.ui.columns

function getDeviceModelFn(devices: ApplicationState['devices'], activeAccountId: string, accountId?: string) {
  return devices[accountId || activeAccountId] || devices.default
}

// function deviceSelectorFactory(accountId) {
//   return createSelector([state => state.something], something => something[key])
// }

export const getDeviceModel = createSelector([getDevicesState, getActiveAccountId], (devices, activeAccountId) =>
  getDeviceModelFn(devices, activeAccountId)
)

export const getDevices = createSelector(
  [getDevicesState, getActiveAccountId],
  (devices, activeAccountId) => getDeviceModelFn(devices, activeAccountId).all || []
)

export const getOwnDevices = createSelector(
  [getDevicesState, getUserId],
  (devices, getUserId) => getDeviceModelFn(devices, getUserId).all || []
)

export const getAllDevices = createSelector(
  [getDevicesState],
  devices => Object.keys(devices).reduce((all: IDevice[], accountId) => all.concat(devices[accountId].all), []) || []
)

export const selectMasterAttributes = createSelector([selectLimitsLookup, getColumns], (limitsLookup, columns) =>
  masterAttributes.concat(deviceAttributes).filter(a => a.show(limitsLookup) && columns.includes(a.id) && !a.required)
)
