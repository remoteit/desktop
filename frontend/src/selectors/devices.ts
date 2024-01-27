import { State } from '../store'
import { defaultState } from '../models/devices'
import { createSelector } from 'reselect'
import { selectActiveAccountId } from './accounts'
import { removeObject, removeObjectAttribute } from '../helpers/utilHelper'
import { getUserId, getDevicesState, getColumns, optionalId, optionalSecondParam, optionalThirdParam } from './state'
import { deviceAttributes, DeviceAttribute, deviceAttributesAll, serviceAttributesAll } from '../components/Attributes'
import { selectLimitsLookup } from './organizations'
import { Attribute } from '../components/Attribute'

export function getDeviceModelFn(devices: State['devices'], activeAccountId: string, accountId?: string) {
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

export function selectAllByIds(state: State, ids?: string[]) {
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
  (devices, activeAccountId): IDevice[] => getDeviceModelFn(devices, activeAccountId).all || []
)

export const selectVisibleDevices = createSelector([getDevices], devices => devices.filter((d: IDevice) => !d.hidden))

export const selectOwnDevices = createSelector(
  [getDevicesState, getUserId],
  (devices, userId) => getDeviceModelFn(devices, userId).all || []
)

export const getAllDevices = createSelector(
  [getDevicesState],
  devices => Object.keys(devices).reduce((all: IDevice[], accountId) => all.concat(devices[accountId].all), []) || []
)

export const selectDeviceModelAttributes = createSelector([getDeviceModel], deviceModel =>
  removeObjectAttribute(deviceModel, 'all')
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
    (deviceModel.applicationTypes?.length ? serviceAttributesAll : deviceAttributesAll).filter(a =>
      a.show(limitsLookup)
    )
)

export const selectActiveAttributes = createSelector(
  [selectAllActiveAttributes, getColumns],
  (allActiveAttributes, columns) => allActiveAttributes.filter(a => columns.includes(a.id))
)

export const selectActiveColumns = createSelector([selectActiveAttributes], activeAttributes =>
  activeAttributes.map(a => a.id)
)

export const selectDevice = createSelector(
  [getAllDevices, getDevices, optionalSecondParam],
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

// selectService params (accountId, deviceId, serviceId)
export const selectDeviceService = createSelector(
  [selectDevice, getDevices, getAllDevices, optionalThirdParam],
  (device, devices, allDevices, serviceId): [IService | undefined, IDevice | undefined] => {
    let service: IService | undefined

    if (device) {
      if (serviceId) service = device.services.find(s => s.id === serviceId)
    } else if (serviceId) {
      const result = findById(devices, serviceId)
      return result[0] || result[1] ? result : findById(allDevices, serviceId)
    }
    return [service, device]
  }
)

export const selectDeviceListAttributes = createSelector([selectActiveAttributes], activeAttributes => {
  const [required, attributes] = removeObject(activeAttributes, a => a.required === true)
  return { attributes, required: required || activeAttributes[0] }
})

export const selectIsFiltered = createSelector(
  [getDeviceModel],
  deviceModel =>
    deviceModel.sort !== defaultState.sort ||
    deviceModel.filter !== defaultState.filter ||
    deviceModel.owner !== defaultState.owner ||
    deviceModel.platform !== defaultState.platform ||
    deviceModel.tag !== defaultState.tag
)
