import { createSelector } from 'reselect'
import { ApplicationState } from '../store'
import { selectActiveAccountId } from './accounts'
import { getUserId, getDevicesState, getColumns, optionalId, optionalDeviceId } from './state'
import { deviceAttributes, DeviceAttribute, deviceAttributesAll, serviceAttributesAll } from '../components/Attributes'
import { selectLimitsLookup } from './organizations'
import { Attribute } from '../components/Attribute'

export function getDeviceModelFn(devices: ApplicationState['devices'], activeAccountId: string, accountId?: string) {
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

export function selectAllByIds(state: ApplicationState, ids?: string[]) {
  return (
    ids?.reduce((result: [IService, IDevice | undefined][], serviceId: string) => {
      const [service, device] = selectById(state, undefined, serviceId)
      if (service) result.push([service, device])
      return result
    }, []) || []
  )
}

export const getDeviceModel = createSelector([getDevicesState, selectActiveAccountId], (devices, activeAccountId) =>
  getDeviceModelFn(devices, activeAccountId)
)

export const getDevices = createSelector(
  [getDevicesState, selectActiveAccountId],
  (devices, activeAccountId) => getDeviceModelFn(devices, activeAccountId).all || []
)

export const getVisibleDevices = createSelector([getDevices], devices => devices.filter((d: IDevice) => !d.hidden))

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

export const selectAllDeviceAttributes = createSelector([selectLimitsLookup], limitsLookup =>
  deviceAttributesAll.filter(a => a.show(limitsLookup))
)

export const selectDeviceAttributes = createSelector(
  [selectAllDeviceAttributes, getColumns],
  (allDeviceAttributes, columns) => allDeviceAttributes.filter(a => columns.includes(a.id))
)

export const selectDeviceColumns = createSelector([selectDeviceAttributes], deviceAttributes =>
  deviceAttributes.map(a => a.id)
)

export const selectAllActiveAttributes = createSelector(
  [selectLimitsLookup, getDeviceModel],
  (limitsLookup, deviceModel) =>
    (deviceModel.applicationType ? serviceAttributesAll : deviceAttributesAll).filter(a => a.show(limitsLookup))
  // {
  //   const x = (deviceModel.applicationType ? serviceAttributesAll : deviceAttributesAll).filter(a =>
  //     a.show(limitsLookup)
  //   )
  //   console.log('selectAllActiveAttributes', deviceModel, x)
  //   return x
  // }
)

export const selectActiveAttributes = createSelector(
  [selectAllActiveAttributes, getColumns],
  (allActiveAttributes, columns) => allActiveAttributes.filter(a => columns.includes(a.id))
)

export const selectActiveColumns = createSelector([selectActiveAttributes], activeAttributes =>
  activeAttributes.map(a => a.id)
)

export const selectDevice = createSelector(
  [getAllDevices, getDevices, optionalDeviceId],
  (allDevices, devices, deviceId) => devices.find(d => d.id === deviceId) || allDevices.find(d => d.id === deviceId)
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

// export const selectDeviceListItemAttributes = createSelector([getDeviceModel], deviceModel =>
//   deviceAttributes
//     .filter(d => d.list)
//     .concat(
//       deviceModel.customAttributes.map(
//         id =>
//           new DeviceAttribute({
//             id: `attribute-${id}`,
//             label: id,
//             value: ({ device }) => (device?.attributes[id] ? Attribute(device.attributes[id]) : undefined),
//           })
//       )
//     )
// )
