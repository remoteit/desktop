import { createSelector } from 'reselect'
import { ApplicationState } from '../store'
import { getActiveAccountId } from './accounts'
import { getUserId, getDevicesState, getColumns, optionalId, optionalDeviceId } from './state'
import { masterAttributes, deviceAttributes, DeviceAttribute } from '../components/Attributes'
import { selectLimitsLookup } from './organizations'
import { Attribute } from '../components/Attribute'

function getDeviceModelFn(devices: ApplicationState['devices'], activeAccountId: string, accountId?: string) {
  return devices[accountId || activeAccountId] || devices.default
}

export function findById(devices: IDevice[], id?: string) {
  let service: IService | undefined
  const device = devices.find(
    d =>
      d.id === id ||
      d?.services?.find(s => {
        if (s.id === id) {
          service = s
          return true
        }
        return false
      })
  )
  return [service, device] as [IService | undefined, IDevice | undefined]
}

export const getDeviceModel = createSelector([getDevicesState, getActiveAccountId], (devices, activeAccountId) =>
  getDeviceModelFn(devices, activeAccountId)
)

export const getDevices = createSelector(
  [getDevicesState, getActiveAccountId],
  (devices, activeAccountId) => getDeviceModelFn(devices, activeAccountId).all || []
)

export const getOwnDevices = createSelector(
  [getDevicesState, getUserId],
  (devices, userId) => getDeviceModelFn(devices, userId).all || []
)

export const getAllDevices = createSelector(
  [getDevicesState],
  devices => Object.keys(devices).reduce((all: IDevice[], accountId) => all.concat(devices[accountId].all), []) || []
)

export const selectById = createSelector([getDevices, getAllDevices, optionalId], (devices, allDevices, id) => {
  const result = findById(devices, id)
  return result[0] || result[1] ? result : findById(allDevices, id)
})

export const selectMasterAttributes = createSelector([selectLimitsLookup, getColumns], (limitsLookup, columns) =>
  masterAttributes.concat(deviceAttributes).filter(a => a.show(limitsLookup) && columns.includes(a.id) && !a.required)
)

export const selectDevice = createSelector(
  [getAllDevices, getDevices, optionalDeviceId],
  (allDevices, devices, deviceId) => {
    return devices.find(d => d.id === deviceId) || allDevices.find(d => d.id === deviceId)
  }
)

export const selectDeviceDetailAttributes = createSelector([getDeviceModel], deviceModel =>
  deviceAttributes
    .filter(d => d.details)
    .concat(
      deviceModel.customAttributes.map(
        id =>
          new DeviceAttribute({
            id: `attribute-${id}`,
            label: id,
            value: ({ device }) => (device?.attributes[id] ? Attribute(device.attributes[id]) : undefined),
          })
      )
    )
)
