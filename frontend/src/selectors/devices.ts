import { State } from '../store'
import { defaultState, IDeviceState } from '../models/devices'
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
  [selectLimitsLookup, selectDeviceModelAttributes],
  (limitsLookup, deviceModelAttributes) =>
    (deviceModelAttributes.applicationTypes?.length ? serviceAttributesAll : deviceAttributesAll).filter(a =>
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

export const selectDeviceDetailAttributes = createSelector([selectDeviceModelAttributes], deviceModelAttributes =>
  deviceAttributes
    .filter(d => d.details)
    .concat(
      deviceModelAttributes.customAttributes.map(
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
  [selectDeviceModelAttributes],
  deviceModelAttributes =>
    deviceModelAttributes.sort !== defaultState.sort ||
    deviceModelAttributes.filter !== defaultState.filter ||
    deviceModelAttributes.owner !== defaultState.owner ||
    deviceModelAttributes.platform !== defaultState.platform ||
    deviceModelAttributes.tag !== defaultState.tag
)

/*
  Determines whether a device belongs in the currently filtered device list.
  Mirrors the server-side filtering applied by graphQLFetchDeviceList so that a
  newly-arrived device can be shown or hidden to match the active filter.
*/
export function deviceMatchesFilters(
  device: IDevice,
  model: Pick<IDeviceState, 'filter' | 'owner' | 'platform' | 'tag' | 'query' | 'searched' | 'applicationTypes'>,
  userId: string
): boolean {
  // state (online/offline)
  if (model.filter !== 'all' && device.state !== model.filter) return false
  // owner (me / others)
  if (model.owner === 'me' && device.owner?.id !== userId) return false
  if (model.owner === 'others' && device.owner?.id === userId) return false
  // platform
  if (model.platform?.length && !model.platform.includes(device.targetPlatform)) return false
  // tags (match ALL or ANY of the selected tag names)
  if (model.tag?.values.length) {
    const names = device.tags?.map(t => t.name) ?? []
    const has = (v: string) => names.includes(v)
    const matches = model.tag.operator === 'ALL' ? model.tag.values.every(has) : model.tag.values.some(has)
    if (!matches) return false
  }
  // service-type tab (applicationTypes): device must have a service of a selected type
  if (model.applicationTypes?.length && !device.services?.some(s => model.applicationTypes!.includes(s.typeID)))
    return false
  // search query — only when a search has actually been applied (model.query tracks the
  // live input, which can be ahead of the displayed results until submitted/searched).
  // Best-effort: device name only — the server search also matches service names.
  const query = model.searched ? model.query?.trim().toLowerCase() : undefined
  if (query && !(device.name || '').toLowerCase().includes(query)) return false

  return true
}
