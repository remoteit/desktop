import structuredClone from '@ungap/structured-clone'
import { graphQLRegistration, graphQLRestoreDevice } from '../services/graphQLRequest'
import {
  graphQLDeleteDevice,
  graphQLDeleteDevices,
  graphQLUnShareDevice,
  graphQLRename,
  graphQLSetAttributes,
  graphQLClaimDevice,
  graphQLAddService,
  graphQLUpdateService,
  graphQLRemoveService,
  graphQLSetDeviceNotification,
  graphQLTransferDevice,
  graphQLRemoveLink,
  graphQLSetLink,
} from '../services/graphQLMutation'
import {
  graphQLFetchDeviceCount,
  graphQLFetchDeviceList,
  graphQLFetchFullDevice,
  graphQLPreloadDevices,
  graphQLDeviceAdaptor,
} from '../services/graphQLDevice'
import { graphQLGetErrors, apiError } from '../services/graphQL'
import { getLocalStorage, removeLocalStorage } from '../services/Browser'
import { selectTimeSeries } from '../selectors/ui'
import {
  getAllDevices,
  getDeviceModel,
  selectDevice,
  selectById,
  selectActiveColumns,
  selectDeviceModelAttributes,
} from '../selectors/devices'
import { selectActiveAccountId } from '../selectors/accounts'
import { store, State } from '../store'
import { AxiosResponse } from 'axios'
import { createModel } from '@rematch/core'
import { RootModel } from '.'

const SAVED_STATES = ['filter', 'sort', 'tag', 'owner', 'platform', 'applicationTypes', 'sortServiceOption']

type IDeviceState = {
  all: IDevice[]
  initialized: boolean
  accountId: string
  total: number
  results: number
  searched: boolean
  fetching: boolean
  fetchingMore: boolean
  query: string
  append: boolean
  filter: 'all' | 'active' | 'inactive'
  sort: string
  tag?: ITagFilter
  owner: 'all' | 'me' | 'others'
  platform?: number[]
  applicationTypes?: number[]
  size: number
  from: number
  eventsUrl: string
  sortServiceOption: ISortServiceType
  customAttributes: string[]
}

export const defaultState: IDeviceState = {
  all: [],
  initialized: false,
  accountId: '',
  total: 0,
  results: 0,
  searched: false,
  fetching: true,
  fetchingMore: false,
  query: '',
  append: false,
  filter: 'all',
  sort: 'state,name',
  tag: undefined,
  owner: 'all',
  platform: undefined,
  applicationTypes: undefined,
  size: 50,
  from: 0,
  eventsUrl: '',
  sortServiceOption: 'ATOZ',
  customAttributes: [],
}

type IDeviceAccountState = {
  [accountId: string]: IDeviceState
}

const defaultAccountState: IDeviceAccountState = {
  default: { ...defaultState },
}

export default createModel<RootModel>()({
  state: { ...defaultAccountState },
  effects: dispatch => ({
    async migrate(_: void, state) {
      const accountId = selectActiveAccountId(state)
      console.log('INIT DEVICES', accountId)
      let states = {}
      SAVED_STATES.forEach(key => {
        const value = getLocalStorage(state, `device-${accountId}-${key}`)
        if (value) {
          states[key] = value
          removeLocalStorage(state, `device-${accountId}-${key}`)
          console.log('MIGRATE DEVICE STATE', key, value)
        }
      })
      await dispatch.devices.set({ ...states, accountId })
    },

    async fetchList(_: void, state) {
      const accountId = selectActiveAccountId(state)
      let deviceModel = selectDeviceModelAttributes(state, accountId)

      if (!deviceModel.initialized) {
        await dispatch.devices.migrate()
        // Update the state object after
        state = store.getState()
        deviceModel = selectDeviceModelAttributes(state, accountId)
      }

      const columns = selectActiveColumns(state, accountId)
      const { set, graphQLListProcessor } = dispatch.devices
      const { truncateMergeDevices, appendUniqueDevices } = dispatch.accounts
      const { query, owner, filter, append, searched } = deviceModel
      const { deviceTimeSeries, serviceTimeSeries } = selectTimeSeries(state)

      const options: gqlOptions = {
        accountId,
        name: query,
        columns,
        deviceTimeSeries,
        serviceTimeSeries,
        size: deviceModel.size,
        from: deviceModel.from,
        tag: deviceModel.tag,
        sort: deviceModel.sort,
        platform: deviceModel.platform,
        applicationTypes: deviceModel.applicationTypes,
        state: filter === 'all' ? undefined : filter,
        owner: owner === 'all' ? undefined : owner === 'me',
      }

      set({ fetching: true, accountId })
      const { devices, total, error } = await graphQLListProcessor(options)

      if (searched) set({ results: total, accountId })
      else set({ total, accountId })

      if (append) {
        await appendUniqueDevices({ devices, accountId })
      } else {
        await truncateMergeDevices({ devices, accountId })
      }

      if (!error) dispatch.search.updateSearch()
      set({ fetching: false, append: false, initialized: true, accountId })
    },

    async fetchIfEmpty(_: void, state) {
      const deviceModel = selectDeviceModelAttributes(state)
      if (!deviceModel.initialized) {
        await dispatch.devices.fetchList()
        await dispatch.applicationTypes.fetch()
      }
    },

    async fetchDevices({ ids, hidden, accountId }: { ids: string[]; hidden?: boolean; accountId?: string }, state) {
      accountId = accountId || selectActiveAccountId(state)
      const gqlResponse = await graphQLPreloadDevices({
        ids,
        accountId,
        columns: selectActiveColumns(state, accountId),
        ...selectTimeSeries(state),
      })
      const error = graphQLGetErrors(gqlResponse)
      const result = gqlResponse?.data?.data?.login?.account?.device

      if (error) return []

      const devices = graphQLDeviceAdaptor({ gqlDevices: result, accountId, hidden })
      if (devices.length) {
        await dispatch.accounts.mergeDevices({ devices, accountId })
        await dispatch.connections.updateConnectionState({ devices, accountId })
      }
    },

    async fetchSingleFull(
      {
        id,
        hidden,
        redirect,
        thisDevice,
        newDevice,
        isService,
      }: {
        id: string // service or device id
        hidden?: boolean
        redirect?: string
        thisDevice?: boolean
        newDevice?: boolean
        isService?: boolean
      },
      state
    ) {
      if (!id) return

      const accountId = selectActiveAccountId(state)

      let result: IDevice | undefined
      let errors: Error[] | undefined

      dispatch.devices.set({ fetching: true, accountId })
      const { serviceTimeSeries, deviceTimeSeries } = selectTimeSeries(state)

      try {
        const gqlResponse = await graphQLFetchFullDevice(id, accountId, serviceTimeSeries, deviceTimeSeries)
        errors = graphQLGetErrors(gqlResponse)
        const gqlData = gqlResponse?.data?.data?.login || {}
        if (gqlData) result = graphQLDeviceAdaptor({ gqlDevices: gqlData.device, accountId, hidden, loaded: true })[0]
      } catch (error) {
        await apiError(error)
        errors = errors?.length ? [...errors, error] : [error]
      }

      if (result) {
        result.thisDevice = result.thisDevice || thisDevice
        if (newDevice) {
          result.newDevice = true
          dispatch.devices.incrementTotal(accountId)
        }
        console.log('FETCHED FULL DEVICE', { id, device: result, accountId })
        await dispatch.connections.updateConnectionState({ devices: [result], accountId })
        await dispatch.accounts.setDevice({ id: result.id, device: result, accountId, prepend: newDevice })
      } else {
        if (!isService && state.ui.silent !== id)
          dispatch.ui.set({
            errorMessage: `You don't have access to that ${isService ? 'service' : 'device'}. (${id})`,
          })
        if (redirect) dispatch.ui.set({ redirect })
        if (!errors) {
          if (isService) dispatch.connections.forget(id)
          else dispatch.devices.cleanup([id])
        }
      }

      dispatch.devices.set({ fetching: false, accountId })
    },

    async fetchCount(params: IOrganizationRole, state) {
      const options: gqlOptions = {
        size: 0,
        from: 0,
        owner: true,
        columns: [],
        accountId: selectActiveAccountId(state),
        tag: params.tag?.values.length ? params.tag : undefined,
      }

      if (params.access === 'NONE' || (params.access === 'TAG' && !options.tag)) return 0

      const result = await graphQLFetchDeviceCount(options)
      if (result === 'ERROR') return
      const count = result?.data?.data?.login?.account?.devices?.total || 0
      return count
    },

    async expire(_: void, state) {
      const activeAccountId = selectActiveAccountId(state)
      const rootState = structuredClone(state.devices)
      const expired: string[] = []

      for (const accountId in rootState) {
        if (accountId === 'default' || accountId === activeAccountId) continue
        rootState[accountId].initialized = false
        expired.push(accountId)
      }

      console.log('EXPIRE DEVICES', expired)
      await dispatch.devices.rootSet(rootState)
    },

    async clearLoaded(_: void, state) {
      const accountId = selectActiveAccountId(state)
      const all = [...getDeviceModel(state, accountId).all]
      for (const id in all) {
        if (all[id].loaded) all[id] = { ...all[id], loaded: false }
      }
      await dispatch.devices.set({ all, accountId })
    },

    async graphQLListProcessor(options: gqlOptions) {
      try {
        const gqlResponse = await graphQLFetchDeviceList(options)
        const [gqlDevices, total, error] = graphQLMetadata(gqlResponse)
        const devices = graphQLDeviceAdaptor({
          gqlDevices,
          accountId: options.accountId,
          serviceLoaded: !!options.applicationTypes?.length,
        })
        return { devices, total, error }
      } catch (error) {
        await apiError(error)
        return { devices: [], total: 0, error }
      }
    },

    async rename({ id, name }: { id: string; name: string }) {
      await graphQLRename(id, name)
    },

    async addService({ deviceId, service }: { deviceId: string; service: IService }, state) {
      let device = await selectDevice(state, undefined, deviceId)
      device = structuredClone(device)
      if (!device) return
      device.services.push({ ...service, deviceID: deviceId })
      dispatch.accounts.setDevice({ id: deviceId, device })
    },

    async updateService({ id, set }: { id: string; set: Partial<IService> }, state) {
      let [_, device] = selectById(state, undefined, id)
      device = structuredClone(device)
      if (!device) return
      const index = device.services.findIndex((s: IService) => s.id === id)
      if (index === -1) return
      for (const key in set) device.services[index][key] = set[key]
      dispatch.accounts.setDevice({ id: device.id, device })
    },

    async removeService(id: string, state) {
      let [_, device] = selectById(state, undefined, id)
      device = structuredClone(device)
      if (!device) return
      const index = device.services.findIndex((s: IService) => s.id === id)
      device.services.splice(index, 1)
      dispatch.accounts.setDevice({ id: device.id, device })
    },

    async setAttributes(device: IDevice) {
      graphQLSetAttributes(device.attributes, device.id)
      dispatch.accounts.setDevice({ id: device.id, device })
    },

    async setNotificationDevice(device: IDevice) {
      graphQLSetDeviceNotification(
        device.id,
        device.notificationSettings.emailNotifications,
        device.notificationSettings.desktopNotifications
      )
      dispatch.accounts.setDevice({ id: device.id, device })
    },

    async setServiceAttributes(service: IService, state) {
      let [_, device] = selectById(state, undefined, service.deviceID)
      device = structuredClone(device)
      if (!device) return
      const index = device.services.findIndex((s: IService) => s.id === service.id)
      if (index === -1) return
      device.services[index].attributes = service.attributes
      graphQLSetAttributes(service.attributes, service.id)
      dispatch.accounts.setDevice({ id: device.id, device })
    },

    async cloudAddService({ form, deviceId }: { form: IService; deviceId: string }) {
      if (!form.host || !form.port) return
      const result = await graphQLAddService({
        deviceId,
        name: form.name,
        application: form.typeID,
        host: form.host,
        port: form.port,
        enabled: !!form.enabled,
      })
      if (result !== 'ERROR') {
        const id = result?.data?.data?.addService?.id
        console.log('CLOUD ADD SERVICE', { id, form })
        if (id) {
          await graphQLSetAttributes(form.attributes, id)
          dispatch.devices.addService({ deviceId, service: { ...form, id } })
          dispatch.ui.set({ redirect: `/devices/${deviceId}/${id}/connect` })
        }
      }
    },

    async cloudUpdatePresenceAddress({ id, set }: { id: string; set: ILookup<any> }, state) {
      let device = structuredClone(selectDevice(state, undefined, id))
      if (!device) return
      for (const key in set) device[key] = set[key]
      dispatch.accounts.setDevice({ id: device.id, device })
      await graphQLUpdateService({ id, presenceAddress: set.presenceAddress })
    },

    async cloudUpdateService({ form, deviceId }: { form: IService; deviceId: string }) {
      if (!form.host || !form.port) return
      dispatch.ui.set({ setupServiceBusy: form.id })
      const set: ICloudUpdateService = {
        id: form.id || deviceId,
        name: form.name,
        application: form.typeID,
        host: form.host,
        port: form.port,
        enabled: !!form.enabled,
        presenceAddress: form.presenceAddress,
      }
      await graphQLUpdateService(set)
      dispatch.devices.updateService({ id: form.id, set })
      dispatch.ui.set({ setupServiceBusy: undefined })
    },

    async cloudRemoveService({ serviceId, deviceId }: { serviceId: string; deviceId: string }) {
      console.log('REMOVING SERVICE', serviceId, deviceId)
      dispatch.ui.set({
        setupServiceBusy: serviceId,
        setupDeletingService: serviceId,
        silent: serviceId,
        redirect: `/devices/${deviceId}/details`,
      })
      const result = await graphQLRemoveService(serviceId)

      if (result !== 'ERROR') {
        await dispatch.devices.cleanupService(serviceId)
        dispatch.ui.set({
          successMessage: `Service was successfully removed.`,
        })
      }

      dispatch.ui.set({ setupServiceBusy: undefined, setupDeletingService: undefined })
    },

    async setLink({ serviceId, enabled }: { serviceId: string; enabled: boolean }) {
      if (!serviceId) return

      const result = await graphQLSetLink({ serviceId, enabled })

      if (result === 'ERROR' || !result?.data?.data?.setConnectLink?.code) {
        dispatch.ui.set({ errorMessage: 'Could not update service.' })
        return
      }

      const data = result?.data?.data?.setConnectLink
      await dispatch.devices.updateService({
        id: serviceId,
        set: {
          link: {
            ...data,
            created: new Date(data.created),
          },
        },
      })
    },

    async removeLink(id: string) {
      await dispatch.devices.updateService({ id, set: { link: undefined } })
      const result = await graphQLRemoveLink(id)

      if (result === 'ERROR') {
        dispatch.ui.set({ errorMessage: 'An error occurred when trying to remove the service link.' })
        await dispatch.devices.fetchSingleFull({ id, isService: true })
      }
    },

    async claimDevice({ code, redirect }: { code: string; redirect?: boolean }, state) {
      const accountId = selectActiveAccountId(state)

      dispatch.ui.set({ claiming: true })
      dispatch.ui.guide({ guide: 'aws', step: 2 })

      const result = await graphQLClaimDevice(code, accountId)
      await dispatch.accounts.set({ activeId: accountId })

      if (result !== 'ERROR') {
        const device = result?.data?.data?.claimDevice
        if (device?.id) {
          // fixme should fetch single and in memory sort
          await dispatch.devices.fetchList() // fetch all so that the sorting is correct
          await dispatch.applicationTypes.fetch()
          dispatch.ui.set({
            redirect: redirect ? `/devices/${device.id}` : undefined,
            successMessage: `'${device.name}' was successfully registered!`,
          })
        } else {
          dispatch.ui.set({ noticeMessage: `Your device (${code}) could not be found.` })
        }
        dispatch.ui.set({ claiming: false })
      }

      dispatch.ui.guide({ guide: 'aws', step: 3 })
    },

    async createRegistration({
      name,
      services,
      platform,
      tags,
      accountId,
      template,
    }: {
      name?: string
      services: IServiceRegistration[]
      platform?: number
      tags?: string[]
      accountId: string
      template?: string | boolean
    }) {
      if (platform === 65535) platform = undefined // Clear out the platform if it's the unknown type
      const result = await graphQLRegistration({ name, services, platform, tags, accountId })
      if (result !== 'ERROR') {
        let { registrationCommand, registrationCode } = result?.data?.data?.login?.account
        if (template && typeof template === 'string') registrationCommand = template.replace('[CODE]', registrationCode)
        console.log('CREATE REGISTRATION', registrationCode)
        dispatch.ui.set({ registrationCommand, registrationCode })
        return registrationCode
      }
    },

    async getRestoreCommand(deviceId, state): Promise<{ restoreCommand?: string; restoreCode?: string }> {
      const accountId = selectActiveAccountId(state)
      const result = await graphQLRestoreDevice({ id: deviceId, accountId })
      if (result !== 'ERROR') {
        let { restoreCommand, restoreCode } = result?.data?.data?.login?.account?.device?.[0]
        console.log('GET RESTORE CODE', restoreCode)
        return { restoreCommand, restoreCode }
      }
      return {}
    },

    async destroy(device: IDevice) {
      dispatch.ui.set({ destroying: true, silent: device.id })
      const result = await graphQLDeleteDevice(device.id)
      if (result !== 'ERROR') {
        await dispatch.devices.cleanup([device.id])
        dispatch.ui.set({
          successMessage: `"${device.name}" was successfully deleted.`,
        })
      }
      dispatch.ui.set({ destroying: false })
    },

    async destroySelected(deviceIds: string[], state) {
      if (!deviceIds.length) return

      // Check that delete is allowed for all devices
      for (const id of deviceIds) {
        const device = selectDevice(state, undefined, id)
        if (!device) {
          dispatch.ui.set({
            errorMessage: `A device id could not be found. Deselect ${id} and try again.`,
          })
          return
        }
        if (device.shared) {
          dispatch.ui.set({
            errorMessage: `You cannot delete a shared device. Deselect or leave "${device.name}" and try again.`,
          })
          return
        }
        if (device.state !== 'inactive') {
          dispatch.ui.set({
            errorMessage: `You cannot delete an online device. Deselect "${device.name}" and try again.`,
          })
          return
        }
        if (!device.permissions.includes('MANAGE')) {
          dispatch.ui.set({
            errorMessage: `You do not have permission to delete a device. Deselect "${device.name}" and try again.`,
          })
          return
        }
      }

      dispatch.ui.set({ destroying: true })
      const result = await graphQLDeleteDevices(deviceIds)
      if (result !== 'ERROR') {
        await dispatch.ui.set({ selected: [] })
        await dispatch.devices.cleanup(deviceIds)
        dispatch.ui.set({
          successMessage: `${deviceIds.length} device${deviceIds.length > 1 ? 's were' : ' was'} successfully deleted.`,
        })
      }
      dispatch.ui.set({ destroying: false })
    },

    async leave(device: IDevice, state) {
      const { auth } = state
      dispatch.ui.set({ destroying: true, silent: device.id })
      const result = await graphQLUnShareDevice({
        deviceId: device.id,
        email: [auth.user?.email || ''],
      })
      if (result !== 'ERROR') {
        await dispatch.devices.cleanup([device.id])
        dispatch.ui.set({
          successMessage: `"${device.name}" was successfully removed.`,
        })
      }
      dispatch.ui.set({ destroying: false })
    },

    async customAttributes(customAttributes: Set<string>, state) {
      const unique = new Set([...customAttributes, ...selectDeviceModelAttributes(state).customAttributes])
      dispatch.devices.set({ customAttributes: [...Array.from(unique)].sort() })
    },

    async transferDevice(data: ITransferProps) {
      if (data.email && data.device) {
        dispatch.ui.set({ transferring: true, silent: data.device.id })
        const result = await graphQLTransferDevice(data)
        if (result !== 'ERROR') {
          await dispatch.devices.cleanup([data.device.id])
          dispatch.ui.set({
            successMessage: `"${data.device.name}" was successfully transferred to ${data.email}.`,
          })
        }
        dispatch.ui.set({ transferring: false })
      }
    },

    async cleanup(deviceIds: string[]) {
      for (const id of deviceIds) {
        await dispatch.connections.clearByDevice(id)
        await dispatch.networks.clearById(id)
        await dispatch.accounts.removeDevice(id)
      }
      await dispatch.connections.fetch()
    },

    async cleanupService(serviceId: string) {
      await dispatch.devices.removeService(serviceId)
      await dispatch.connections.clear(serviceId)
      await dispatch.networks.clearById(serviceId)
    },

    async incrementTotal(accountId: string, state) {
      accountId = accountId || selectActiveAccountId(state)
      const total = selectDeviceModelAttributes(state, accountId).total + 1
      console.log('INCREMENT TOTAL', { total, accountId })
      await dispatch.devices.set({ total, accountId })
    },

    async set(params: Partial<IDeviceState>, state) {
      const accountId = params.accountId || selectActiveAccountId(state)
      const deviceState = { ...getDeviceModel(state, accountId) }

      Object.keys(params).forEach(key => {
        deviceState[key] = params[key]
      })

      await dispatch.devices.rootSet({ [accountId]: deviceState })
    },
  }),

  reducers: {
    reset(state: IDeviceAccountState) {
      state = { ...defaultAccountState }
      return state
    },
    rootSet(state: IDeviceAccountState, params: IDeviceAccountState) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

function graphQLMetadata(gqlData?: AxiosResponse) {
  const error = graphQLGetErrors(gqlData)
  const total = gqlData?.data?.data?.login?.account?.devices?.total || 0
  const devices = gqlData?.data?.data?.login?.account?.devices?.items || []
  const id = gqlData?.data?.data?.login?.id
  return [devices, total, id, error]
}

export function mergeDevice(overwrite: IDevice, device: IDevice): IDevice {
  const serviceIds = new Set(device.services.map(s => s.id))
  return {
    ...overwrite,
    ...device,
    services: [...overwrite.services.filter(os => !serviceIds.has(os.id)), ...device.services],
    hidden: device.hidden && overwrite.hidden,
  }
}

export function isOffline(instance?: IDevice | IService, connection?: IConnection) {
  const inactive = instance?.state !== 'active' && !connection?.connected
  return inactive
}

export function eachDevice(state: State, callback: (device: IDevice) => void) {
  getAllDevices(state).forEach(device => callback(device))
}
