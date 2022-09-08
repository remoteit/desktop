import {
  graphQLDeleteDevice,
  graphQLUnShareDevice,
  graphQLRename,
  graphQLSetAttributes,
  graphQLClaimDevice,
  graphQLAddService,
  graphQLUpdateService,
  graphQLRemoveService,
  graphQLSetDeviceNotification,
  graphQLTransferDevice,
} from '../services/graphQLMutation'
import {
  graphQLFetchDeviceCount,
  graphQLFetchDevices,
  graphQLFetchDevice,
  graphQLFetchConnections,
  graphQLRegistration,
  graphQLDeviceAdaptor,
} from '../services/graphQLDevice'
import { getLocalStorage, setLocalStorage } from '../services/Browser'
import { getActiveAccountId, getAllDevices, getDevices, getDeviceModel } from './accounts'
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
      await dispatch.devices.set({ ...states, accountId })
    },
    /* 
      GraphQL search query for all device data
    */
    async fetch(_: void, state) {
      const accountId = getActiveAccountId(state)
      const deviceModel = getDeviceModel(state, accountId)
      if (!deviceModel.initialized) await dispatch.devices.init()
      if (!accountId) return console.error('FETCH WITH MISSING ACCOUNT ID')
      const { set, graphQLFetchProcessor } = dispatch.devices
      const { setDevices, appendUniqueDevices } = dispatch.accounts
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
      const { devices, total, error } = await graphQLFetchProcessor(options)

      if (searched) set({ results: total, accountId })
      else set({ total, accountId })

      // awaiting setDevices is critical for accurate initialized state
      if (append) {
        await appendUniqueDevices({ devices, accountId })
      } else {
        await setDevices({ devices, accountId })
      }

      if (!error) dispatch.search.updateSearch()
      set({ fetching: false, append: false, initialized: true, accountId })
    },

    async fetchIfEmpty(_: void, state) {
      const deviceModel = getDeviceModel(state)
      if (!deviceModel.initialized) await dispatch.devices.fetch()
    },

    async fetchDevices(deviceIds: string[], state) {
      const accountId = getActiveAccountId(state)
      const devices = await dispatch.devices.fetchArray({ deviceIds, accountId })
      if (devices.length) dispatch.accounts.mergeDevices({ devices, accountId })
    },

    async fetchArray({ deviceIds, accountId }: { deviceIds: string[]; accountId: string }, state): Promise<IDevice[]> {
      const model = getDeviceModel(state)
      if (model.fetchingArray) return []
      await dispatch.devices.set({ fetchingArray: true, accountId })
      const gqlResponse = await graphQLFetchConnections({ account: accountId, ids: deviceIds })
      const error = graphQLGetErrors(gqlResponse)
      const connectionData = gqlResponse?.data?.data?.login?.connections
      const loginId = gqlResponse?.data?.data?.login?.id
      await dispatch.devices.set({ fetchingArray: false, accountId })
      if (error) return []
      return graphQLDeviceAdaptor(connectionData, loginId, accountId, true)
    },

    async fetchSingle(
      {
        id,
        hidden,
        thisDevice,
      }: {
        id: string
        hidden?: boolean
        thisDevice?: boolean
      },
      state
    ): Promise<IDevice | undefined> {
      const { set } = dispatch.devices
      const device = selectDevice(state, id)
      const accountId = device?.accountId || getActiveAccountId(state)
      let result: IDevice | undefined
      if (!id) return

      set({ fetching: true, accountId })
      try {
        const gqlResponse = await graphQLFetchDevice(id, accountId)
        graphQLGetErrors(gqlResponse)
        const gqlDevice = gqlResponse?.data?.data?.login.device || {}
        const loginId = gqlResponse?.data?.data?.login?.id
        result = gqlDevice ? graphQLDeviceAdaptor(gqlDevice, loginId, accountId, hidden)[0] : undefined
      } catch (error) {
        await apiError(error)
      }

      if (result) result.thisDevice = result.thisDevice || thisDevice
      await dispatch.accounts.setDevice({ id: id, accountId, device: result })
      set({ fetching: false, accountId })

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
      const result = await graphQLFetchDeviceCount(options)
      if (result === 'ERROR') return
      const count = result?.data?.data?.login?.account?.devices?.total || 0
      return count
    },

    async graphQLFetchProcessor(options: gqlOptions) {
      try {
        const gqlResponse = await graphQLFetchDevices(options)
        const [deviceData, total, loginId, error] = graphQLMetadata(gqlResponse)
        const devices = graphQLDeviceAdaptor(deviceData, loginId, options.account)
        return { devices, total, error }
      } catch (error) {
        await apiError(error)
        return { devices: [], total: 0, error }
      }
    },

    async renameService(service: IService, state) {
      let device = getAllDevices(state).find((d: IDevice) => d.id === service.deviceID)
      if (!device) return
      const index = device.services.findIndex((s: IService) => s.id === service.id)
      device.services[index].name = service.name
      dispatch.accounts.setDevice({ id: device.id, device })
      dispatch.devices.rename(service)
    },

    async renameDevice(device: IDevice) {
      dispatch.accounts.setDevice({ id: device.id, device })
      dispatch.devices.rename(device)
    },

    async rename({ id, name }: { id: string; name: string }) {
      const result = await graphQLRename(id, name)
      if (result !== 'ERROR') {
        await dispatch.devices.fetch()
      }
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
      let device = getAllDevices(state).find((d: IDevice) => d.id === service.deviceID)
      if (!device) return
      const index = device.services.findIndex((s: IService) => s.id === service.id)
      device.services[index].attributes = service.attributes
      graphQLSetAttributes(service.attributes, service.id)
      dispatch.accounts.setDevice({ id: device.id, device })
    },

    async cloudAddService({ form, deviceId }: { form: IServiceForm; deviceId: string }) {
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
        }
      }
      dispatch.ui.set({ setupServiceBusy: undefined, setupAddingService: false })
    },

    async cloudUpdateService({ form, deviceId }: { form: IServiceForm; deviceId: string }) {
      if (!form.host || !form.port) return
      dispatch.ui.set({ setupServiceBusy: form.id })
      await graphQLUpdateService({
        id: form.id,
        name: form.name,
        application: form.typeID,
        host: form.host,
        port: form.port,
        enabled: !!form.enabled,
      })
      await dispatch.devices.fetchSingle({ id: deviceId })
      dispatch.ui.set({ setupServiceBusy: undefined })
    },

    async cloudRemoveService({ serviceId, deviceId }: { serviceId: string; deviceId: string }) {
      console.log('REMOVING SERVICE', serviceId, deviceId)
      dispatch.ui.set({ setupServiceBusy: serviceId, setupDeletingService: serviceId })
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
          await dispatch.devices.fetch() // fetch all so that the sorting is correct
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
      accountId,
    }: {
      name?: string
      services: IServiceRegistration[]
      platform?: number
      accountId: string
    }) {
      const result = await graphQLRegistration({ name, services, platform, account: accountId })
      if (result !== 'ERROR') {
        const { registrationCommand, registrationCode } = result?.data?.data?.login?.account
        console.log('CREATE REGISTRATION', registrationCommand)
        dispatch.ui.set({ registrationCommand })
        return registrationCode
      }
    },

    async destroy(device: IDevice) {
      dispatch.ui.set({ destroying: true, silent: true })
      const result = await graphQLDeleteDevice(device.id)
      if (result !== 'ERROR') {
        await dispatch.devices.cleanup(device.id)
        dispatch.ui.set({
          successMessage: `"${device.name}" was successfully deleted.`,
        })
      }
      dispatch.ui.set({ destroying: false, redirect: '/devices' })
    },

    async leave(device: IDevice, state) {
      const { auth } = state
      dispatch.ui.set({ destroying: true, silent: true })
      const result = await graphQLUnShareDevice({
        deviceId: device.id,
        email: [auth.user?.email || ''],
      })
      if (result !== 'ERROR') {
        await dispatch.devices.cleanup(device.id)
        dispatch.ui.set({
          successMessage: `"${device.name}" was successfully removed.`,
        })
      }
      dispatch.ui.set({ destroying: false, redirect: '/devices' })
    },

    async customAttributes({ customAttributes }: { customAttributes: string[] }, state) {
      const unique = new Set(customAttributes.concat(getDeviceModel(state).customAttributes))
      dispatch.devices.set({ customAttributes: [...Array.from(unique)].sort() })
    },

    async transferDevice(data: ITransferProps) {
      if (data.email && data.device) {
        dispatch.ui.set({ transferring: true, silent: true })
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
      await dispatch.devices.fetch()
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
  const devices = gqlData?.data?.data?.login?.account?.devices?.items || {}
  const id = gqlData?.data?.data?.login?.id
  return [devices, total, id, error]
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

export function selectDevice(state: ApplicationState, deviceId?: string) {
  const accountId = getActiveAccountId(state)
  const device = selectDeviceByAccount(state, deviceId, accountId)
  return device || getAllDevices(state).find(d => d.id === deviceId)
}

export function selectDeviceByAccount(state: ApplicationState, deviceId?: string, accountId?: string) {
  return getDevices(state, accountId).find(d => d.id === deviceId)
}

export function selectById(state: ApplicationState, id?: string) {
  return findService(getAllDevices(state), id)
}

export function findService(devices: IDevice[], id?: string) {
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

export function eachDevice(state: ApplicationState, callback: (device: IDevice) => void) {
  getAllDevices(state).forEach(device => callback(device))
}
