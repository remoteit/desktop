import {
  graphQLDeleteDevice,
  graphQLUnShareDevice,
  graphQLRename,
  graphQLSetAttributes,
  graphQLRegistration,
  graphQLClaimDevice,
  graphQLAddService,
  graphQLUpdateService,
  graphQLRemoveService,
  graphQLSetDeviceNotification,
  graphQLTransferDevice,
  graphQLRestoreDevice,
} from '../services/graphQLMutation'
import {
  graphQLFetchDeviceCount,
  graphQLFetchDeviceList,
  graphQLFetchFullDevice,
  graphQLPreloadDevices,
  graphQLDeviceAdaptor,
} from '../services/graphQLDevice'
import { getLocalStorage, setLocalStorage } from '../services/Browser'
import { getAllDevices, selectDevice, getDeviceModel, selectById } from '../selectors/devices'
import { getActiveAccountId } from '../selectors/accounts'
import { graphQLGetErrors, apiError } from '../services/graphQL'
import { ApplicationState } from '../store'
import { AxiosResponse } from 'axios'
import { createModel } from '@rematch/core'
import { RootModel } from '.'

const SAVED_STATES = ['filter', 'sort', 'tag', 'owner', 'platform', 'sortServiceOption']

// TODO move to connection model?
export const ROUTES: IRoute[] = [
  {
    key: 'failover',
    icon: 'code-branch',
    name: 'Peer to peer with proxy failover',
    description: 'A direct connection to this service that fails over to a private proxy.',
  },
  {
    key: 'p2p',
    icon: 'arrows-h',
    name: 'Peer to peer only',
    description: 'A direct connection to this service.',
  },
  {
    key: 'proxy',
    icon: 'cloud',
    name: 'Proxy only',
    description: 'A private proxy connection routed through the cloud.',
  },
  {
    key: 'public',
    icon: 'globe',
    name: 'Public Proxy',
    description: 'A proxy connection with a temporary public URL.',
  },
]

type IDeviceState = {
  all: IDevice[]
  initialized: boolean
  accountId: string
  total: number
  results: number
  searched: boolean
  fetching: boolean
  fetchingMore: boolean
  fetchingArray: boolean
  query: string
  append: boolean
  filter: 'all' | 'active' | 'inactive'
  sort: string
  tag: ITagFilter | undefined
  owner: 'all' | 'me' | 'others'
  platform: number[] | undefined
  size: number
  from: number
  eventsUrl: string
  sortServiceOption: 'ATOZ' | 'ZTOA' | 'NEWEST' | 'OLDEST'
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
  fetchingArray: false,
  query: '',
  append: false,
  filter: 'all',
  sort: 'state,name',
  tag: undefined,
  owner: 'all',
  platform: undefined,
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
    async init(_: void, state) {
      const accountId = getActiveAccountId(state)
      let states = { accountId }
      SAVED_STATES.forEach(key => {
        const value = getLocalStorage(state, `device-${accountId}-${key}`)
        if (value) states[key] = value
      })
      console.log('RESTORE DEVICE STATES', states)
      await dispatch.devices.set({ ...states, accountId })
    },
    /* 
      GraphQL search query for all device data
    */
    async fetchList(_: void, state) {
      const accountId = getActiveAccountId(state)
      const deviceModel = getDeviceModel(state, accountId)
      if (!deviceModel.initialized) await dispatch.devices.init()
      if (!accountId) return console.error('FETCH WITH MISSING ACCOUNT ID')
      const { set, graphQLListProcessor } = dispatch.devices
      const { truncateMergeDevices, appendUniqueDevices } = dispatch.accounts
      const { query, sort, tag, owner, filter, size, from, append, searched, platform } = deviceModel
      const options: gqlOptions = {
        size,
        from,
        account: accountId,
        state: filter === 'all' ? undefined : filter,
        tag,
        name: query,
        sort,
        owner: owner === 'all' ? undefined : owner === 'me',
        platform,
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
      const deviceModel = getDeviceModel(state)
      if (!deviceModel.initialized) await dispatch.devices.fetchList()
    },

    async fetchDevices(deviceIds: string[], state) {
      const accountId = getActiveAccountId(state)
      const model = getDeviceModel(state)

      if (model.fetchingArray) {
        console.warn('FETCH DEVICES ABORTED, fetching in progress...')
        return []
      }
      await dispatch.devices.set({ fetchingArray: true, accountId })

      const gqlResponse = await graphQLPreloadDevices({ account: accountId, ids: deviceIds })
      const error = graphQLGetErrors(gqlResponse)
      const result = gqlResponse?.data?.data?.login?.account?.device

      await dispatch.devices.set({ fetchingArray: false, accountId })
      if (error) return []

      const devices = graphQLDeviceAdaptor({ gqlDevices: result, accountId, hidden: true })
      if (devices.length) {
        await dispatch.accounts.mergeDevices({ devices, accountId })
        await dispatch.connections.updateConnectionState({ devices, accountId })
      }
    },

    async fetchSingle(
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

      const accountId = getActiveAccountId(state)
      let result: IDevice | undefined
      let errors: Error[] | undefined

      dispatch.devices.set({ fetching: true, accountId })

      try {
        const gqlResponse = await graphQLFetchFullDevice(id, accountId)
        errors = graphQLGetErrors(gqlResponse)
        const gqlData = gqlResponse?.data?.data?.login || {}
        if (gqlData) result = graphQLDeviceAdaptor({ gqlDevices: gqlData.device, accountId, hidden, loaded: true })[0]
      } catch (error) {
        await apiError(error)
        errors = errors?.length ? [...errors, error] : [error]
      }

      if (result) {
        result.thisDevice = result.thisDevice || thisDevice
        if (newDevice) result.newDevice = true
        await dispatch.connections.updateConnectionState({ devices: [result], accountId })
        await dispatch.accounts.setDevice({ id: result.id, device: result, accountId, prepend: newDevice })
        console.log('FETCHED DEVICE', { id: result.id, device: result, accountId })
      } else {
        if (!isService && state.ui.silent !== id)
          dispatch.ui.set({
            errorMessage: `You don't have access to that ${isService ? 'service' : 'device'}. (${id})`,
          })
        if (redirect) dispatch.ui.set({ redirect })
        if (!errors) {
          if (isService) dispatch.connections.forget(id)
          else dispatch.devices.cleanup(id)
        }
      }

      dispatch.devices.set({ fetching: false, accountId })
      return result
    },

    async fetchCount(params: IOrganizationRole, state) {
      const options: gqlOptions = {
        size: 0,
        from: 0,
        account: getActiveAccountId(state),
        owner: true,
        tag: params.tag?.values.length ? params.tag : undefined,
      }

      if (params.access === 'NONE' || (params.access === 'TAG' && !options.tag)) return 0

      const result = await graphQLFetchDeviceCount(options)
      if (result === 'ERROR') return
      const count = result?.data?.data?.login?.account?.devices?.total || 0
      return count
    },

    async graphQLListProcessor(options: gqlOptions) {
      try {
        const gqlResponse = await graphQLFetchDeviceList(options)
        const [gqlDevices, total, error] = graphQLMetadata(gqlResponse)
        const devices = graphQLDeviceAdaptor({ gqlDevices, accountId: options.account })
        return { devices, total, error }
      } catch (error) {
        await apiError(error)
        return { devices: [], total: 0, error }
      }
    },

    async renameDevice(device: IDevice) {
      dispatch.accounts.setDevice({ id: device.id, device })
      dispatch.devices.rename(device)
    },

    async rename({ id, name }: { id: string; name: string }) {
      await graphQLRename(id, name)
      await dispatch.devices.fetchSingle({ id })
    },

    async updateService({ id, set }: { id: string; set: ILookup<any> }, state) {
      let [_, device] = selectById(state, undefined, id)
      if (!device) return
      const index = device.services.findIndex((s: IService) => s.id === id)
      for (const key in set) device.services[index][key] = set[key]
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
      if (!device) return
      const index = device.services.findIndex((s: IService) => s.id === service.id)
      if (index === -1) return
      device.services[index].attributes = service.attributes
      graphQLSetAttributes(service.attributes, service.id)
      dispatch.accounts.setDevice({ id: device.id, device })
    },

    async cloudAddService({ form, deviceId }: { form: IService; deviceId: string }) {
      if (!form.host || !form.port) return
      dispatch.ui.set({ setupServiceBusy: form.id, setupAddingService: true })
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
        if (id) {
          await graphQLSetAttributes(form.attributes, id)
          await dispatch.devices.fetchSingle({ id: deviceId })
          dispatch.ui.set({ redirect: `/devices/${deviceId}/${id}/connect` })
        }
      }
      dispatch.ui.set({ setupServiceBusy: undefined, setupAddingService: false })
    },

    async cloudUpdateDevice({ id, set }: { id: string; set: ILookup<any> }, state) {
      let device = selectDevice(state, undefined, id)
      if (!device) return
      for (const key in set) device[key] = set[key]
      dispatch.accounts.setDevice({ id: device.id, device })
      await graphQLUpdateService({
        id,
        presenceAddress: set.presenceAddress,
      })
    },

    async cloudUpdateService({ form, deviceId }: { form: IService; deviceId: string }) {
      if (!form.host || !form.port) return
      dispatch.ui.set({ setupServiceBusy: form.id })
      await graphQLUpdateService({
        id: form.id || deviceId,
        name: form.name,
        application: form.typeID,
        host: form.host,
        port: form.port,
        enabled: !!form.enabled,
        presenceAddress: form.presenceAddress,
      })
      await dispatch.devices.fetchSingle({ id: deviceId })
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
      await graphQLRemoveService(serviceId)
      await dispatch.devices.fetchSingle({ id: deviceId })
      dispatch.ui.set({ setupServiceBusy: undefined, setupDeletingService: false })
    },

    async claimDevice({ code, redirect }: { code: string; redirect?: boolean }, state) {
      dispatch.ui.set({ claiming: true })
      dispatch.ui.guide({ guide: 'aws', step: 2 })

      const result = await graphQLClaimDevice(code, getActiveAccountId(state))
      if (state.auth.user) await dispatch.accounts.setActive(state.auth.user.id)

      if (result !== 'ERROR') {
        const device = result?.data?.data?.claimDevice
        if (device?.id) {
          // fixme should fetch single and in memory sort
          await dispatch.devices.fetchList() // fetch all so that the sorting is correct
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
      const result = await graphQLRegistration({ name, services, platform, tags, account: accountId })
      if (result !== 'ERROR') {
        let { registrationCommand, registrationCode } = result?.data?.data?.login?.account
        if (template && typeof template === 'string') registrationCommand = template.replace('[CODE]', registrationCode)
        console.log('CREATE REGISTRATION', registrationCommand)
        dispatch.ui.set({ registrationCommand })
        return registrationCode
      }
    },

    async getRestoreCommand(deviceId, state) {
      const accountId = getActiveAccountId(state)
      const result = await graphQLRestoreDevice({ id: deviceId, account: accountId })
      if (result !== 'ERROR') {
        let { restoreCommand } = result?.data?.data?.login?.account?.device?.[0]
        console.log('GET RESTORE COMMAND', restoreCommand)
        return restoreCommand
      }
    },

    async destroy(device: IDevice) {
      dispatch.ui.set({ destroying: true, silent: device.id })
      const result = await graphQLDeleteDevice(device.id)
      if (result !== 'ERROR') {
        dispatch.devices.cleanup(device.id)
        dispatch.ui.set({
          successMessage: `"${device.name}" was successfully deleted.`,
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
        dispatch.devices.cleanup(device.id)
        dispatch.ui.set({
          successMessage: `"${device.name}" was successfully removed.`,
        })
      }
      dispatch.ui.set({ destroying: false })
    },

    async customAttributes({ customAttributes }: { customAttributes: string[] }, state) {
      const unique = new Set(customAttributes.concat(getDeviceModel(state).customAttributes))
      dispatch.devices.set({ customAttributes: [...Array.from(unique)].sort() })
    },

    async transferDevice(data: ITransferProps) {
      if (data.email && data.device) {
        dispatch.ui.set({ transferring: true, silent: data.device.id })
        const result = await graphQLTransferDevice(data)
        if (result !== 'ERROR') {
          await dispatch.devices.cleanup(data.device.id)
          dispatch.ui.set({
            successMessage: `"${data.device.name}" was successfully transferred to ${data.email}.`,
          })
        }
        dispatch.ui.set({ transferring: false })
      }
    },

    async cleanup(deviceId: string) {
      await dispatch.connections.clearByDevice(deviceId)
      await dispatch.networks.removeById(deviceId)
      await dispatch.devices.fetchList()
      await dispatch.connections.fetch()
    },

    async setPersistent(params: ILookup<any>, state) {
      const accountId = params.accountId || getActiveAccountId(state)
      Object.keys(params).forEach(key => {
        if (SAVED_STATES.includes(key)) setLocalStorage(state, `device-${accountId}-${key}`, params[key] || '')
      })
      dispatch.devices.set(params)
    },

    async set(params: { accountId?: string } & ILookup<any>, state) {
      const accountId = params.accountId || getActiveAccountId(state)
      const deviceState = { ...getDeviceModel(state, accountId) }

      Object.keys(params).forEach(key => {
        deviceState[key] = params[key]
      })

      dispatch.devices.rootSet({ [accountId]: deviceState })
    },
  }),

  reducers: {
    reset(state: IDeviceAccountState) {
      state = { ...defaultAccountState }
      return state
    },
    rootSet(state: IDeviceAccountState, params: ILookup<any>) {
      Object.keys(params).forEach(key => {
        state[key] = params[key]
      })
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

export function mergeDevices(params: { overwrite: IDevice[]; keep: IDevice[] }) {
  const { overwrite, keep } = params
  return keep.map(k => {
    const ow = overwrite.find(o => o.id === k.id)
    return { ...ow, ...k, hidden: k.hidden && (ow ? ow.hidden : k.hidden) }
  })
}

export function selectIsFiltered(state: ApplicationState) {
  const devices = getDeviceModel(state)
  return (
    devices.sort !== defaultState.sort ||
    devices.filter !== defaultState.filter ||
    devices.owner !== defaultState.owner ||
    devices.platform !== defaultState.platform ||
    devices.tag !== defaultState.tag
  )
}

export function isOffline(instance?: IDevice | IService, connection?: IConnection) {
  const inactive = instance?.state !== 'active' && !connection?.connected
  return inactive
}

export function eachDevice(state: ApplicationState, callback: (device: IDevice) => void) {
  getAllDevices(state).forEach(device => callback(device))
}
