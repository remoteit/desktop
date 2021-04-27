import {
  graphQLSetAttributes,
  graphQLClaimDevice,
  graphQLAddService,
  graphQLUpdateService,
  graphQLRemoveService,
  graphQLAddNotifications,
} from '../services/graphQLMutation'
import { graphQLFetchDevices, graphQLFetchDevice, graphQLAdaptor } from '../services/graphQLDevice'
import { cleanOrphanConnections, getConnectionIds } from '../helpers/connectionHelper'
import { graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { getActiveAccountId, getAllDevices } from './accounts'
import { platformConfiguration } from '../services/platformConfiguration'
import { r3, hasCredentials } from '../services/remote.it'
import { ApplicationState } from '../store'
import { createModel } from '@rematch/core'
import { RootModel } from './rootModel'

type DeviceParams = { [key: string]: any }

type IGetDevice = {
  id: string
  hidden?: boolean
}

type IDeviceState = {
  all: { [accountId: string]: IDevice[] }
  initialized: boolean
  total: number
  results: number
  searched: boolean
  fetching: boolean
  fetchingMore: boolean
  destroying: boolean // fixme - move to ui model
  query: string
  append: boolean
  filter: 'all' | 'active' | 'inactive'
  sort: 'name' | '-name' | 'state' | '-state' | 'color' | '-color'
  owner: 'all' | 'me' | 'others'
  platform?: number
  size: number
  from: number
  contacts: IUserRef[]
  eventsUrl: string
  sortServiceOption?: 'ATOZ' | 'ZTOA' | 'NEWEST' | 'OLDEST'
  userAttributes: string[]
}

export const defaultState: IDeviceState = {
  all: {},
  initialized: false,
  total: 0,
  results: 0,
  searched: false,
  fetching: true,
  fetchingMore: false,
  destroying: false,
  query: '',
  append: false,
  filter: 'all',
  sort: 'name',
  owner: 'all',
  platform: undefined,
  size: 50,
  from: 0,
  contacts: [],
  eventsUrl: '',
  sortServiceOption: 'ATOZ',
  userAttributes: [],
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: dispatch => ({
    /* 
      GraphQL search query for all device data
    */
    async fetch(optionalAccountId?: string, globalState?) {
      const accountId: string = optionalAccountId || getActiveAccountId(globalState)
      const userId = globalState.auth.user?.id
      if (!userId) return console.error('NO AUTH USER ID')
      if (!accountId) return console.error('FETCH WITH MISSING ACCOUNT ID')
      const { updateSearch } = dispatch.search
      const { set, graphQLFetchProcessor } = dispatch.devices
      const { setDevices, appendUniqueDevices } = dispatch.accounts
      const { query, sort, owner, filter, size, from, append, searched, platform } = globalState.devices
      const options: gqlOptions = {
        size,
        from,
        account: accountId,
        state: filter === 'all' ? undefined : filter,
        name: query,
        ids: append ? undefined : getConnectionIds(globalState),
        sort,
        owner: owner === 'all' ? undefined : owner === 'me',
        platform,
      }

      if (!(await hasCredentials())) return

      set({ fetching: true })
      const { devices, connections, total, contacts, error } = await graphQLFetchProcessor(options)

      if (searched) set({ results: total })
      else set({ total })

      // awaiting setDevices is critical for accurate initialized state
      if (append) {
        await appendUniqueDevices({ devices, accountId })
      } else {
        await setDevices({ devices, accountId })
        await appendUniqueDevices({ devices: connections, accountId: userId })
      }

      updateSearch()
      if (!error) cleanOrphanConnections()
      platformConfiguration()

      // @TODO pull contacts out into its own model / request on page load
      set({ initialized: true, fetching: false, append: false, contacts })
    },

    /*
      Fetches a single device and merges in the state
    */
    async fetchSingle({ id, hidden }: IGetDevice, globalState: any): Promise<IDevice | undefined> {
      const { set } = dispatch.devices
      const device = selectDevice(globalState, id)
      const accountId = device?.accountId || getActiveAccountId(globalState)

      let result: IDevice | undefined

      if (!(await hasCredentials()) || !id) return

      set({ fetching: true })
      try {
        const gqlResponse = await graphQLFetchDevice(id)
        graphQLGetErrors(gqlResponse)
        const gqlDevice = gqlResponse?.data?.data?.login.device || {}
        const loginId = gqlResponse?.data?.data?.login?.id
        result = gqlDevice ? graphQLAdaptor(gqlDevice, loginId, accountId, hidden)[0] : undefined
      } catch (error) {
        await graphQLCatchError(error)
      }

      await dispatch.accounts.setDevice({ id: id, accountId, device: result })
      set({ fetching: false })

      platformConfiguration()
      return result
    },

    async graphQLFetchProcessor(options: gqlOptions) {
      const { graphQLMetadata } = dispatch.devices as any
      const parseAccounts = dispatch.accounts.parse
      try {
        const gqlResponse = await graphQLFetchDevices(options)
        const [deviceData, connectionData, total, loginId, contacts, error] = await graphQLMetadata(gqlResponse)
        const connections = graphQLAdaptor(connectionData, loginId, options.account, true)
        const devices = graphQLAdaptor(deviceData, loginId, options.account)
        await parseAccounts(gqlResponse)
        return { devices, connections, total, contacts, error }
      } catch (error) {
        await graphQLCatchError(error)
        return { devices: [], total: 0, error }
      }
    },

    async updateShareDevice(device: IDevice) {
      dispatch.accounts.setDevice({ id: device.id, device })
    },

    async graphQLMetadata(gqlData: any) {
      const error = graphQLGetErrors(gqlData)
      const total = gqlData?.data?.data?.login?.account?.devices?.total || 0
      const devices = gqlData?.data?.data?.login?.account?.devices?.items || {}
      const { connections, contacts, id } = gqlData?.data?.data?.login || {}
      return [devices, connections, total, id, contacts, error]
    },

    async renameService(service: IService, globalState: any) {
      let device = getAllDevices(globalState).find((d: IDevice) => d.id === service.deviceID)
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
      try {
        await r3.post(`/device/name/`, { deviceaddress: id, devicealias: name })
        await dispatch.devices.fetch()
      } catch (error) {
        dispatch.ui.set({ errorMessage: error.message })
        console.warn(error)
      }
    },

    async setAttributes(device: IDevice) {
      graphQLSetAttributes(device.attributes, device.id)
      dispatch.accounts.setDevice({ id: device.id, device })
    },

    async setServiceAttributes(service: IService, globalState) {
      let device = getAllDevices(globalState).find((d: IDevice) => d.id === service.deviceID)
      if (!device) return
      const index = device.services.findIndex((s: IService) => s.id === service.id)
      device.services[index].attributes = service.attributes
      graphQLSetAttributes(service.attributes, service.id)
      dispatch.accounts.setDevice({ id: device.id, device })
    },

    async cloudAddService({ form, deviceId }: { form: IServiceForm; deviceId: string }) {
      console.log('CLOUD ADD SERVICE', form)
      dispatch.ui.set({ setupServiceBusy: form.uid, setupAddingService: true })
      const result = await graphQLAddService({
        deviceId,
        name: form.name,
        application: form.type,
        host: form.hostname,
        port: form.port,
        enabled: !form.disabled,
      })
      console.log('CLOUD RESULT', result)
      const id = result?.data?.data?.addService?.id
      if (id) {
        await graphQLSetAttributes(form.attributes, id)
        await dispatch.devices.fetchSingle({ id: deviceId })
      }
      dispatch.ui.set({ setupServiceBusy: undefined, setupAddingService: false })
    },

    async cloudUpdateService({ form, deviceId }: { form: IServiceForm; deviceId: string }) {
      console.log('CLOUD UPDATE SERVICE', form)
      dispatch.ui.set({ setupServiceBusy: form.uid })
      await graphQLUpdateService({
        id: form.uid,
        name: form.name,
        application: form.type,
        host: form.hostname,
        port: form.port,
        enabled: !form.disabled,
      })
      await graphQLSetAttributes(form.attributes, form.uid)
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

    async claimDevice(code: string) {
      dispatch.ui.set({ claiming: true })
      dispatch.ui.guide({ guide: 'guideAWS', step: 2 })

      const result = await graphQLClaimDevice(code)
      try {
        const device = result?.data?.data?.claimDevice
        if (device?.id) {
          await dispatch.devices.fetch() // fetch all so that the sorting is correct
          dispatch.ui.set({ successMessage: `'${device.name}' was successfully registered!` })
        } else {
          dispatch.ui.set({ noticeMessage: `Your device (${code}) could not be found.` })
        }
        dispatch.ui.set({ claiming: false })
      } catch (error) {
        dispatch.ui.set({ errorMessage: `An error occurred registering your device. (${error.message})` })
        console.error(error)
      }

      dispatch.ui.guide({ guide: 'guideAWS', step: 3 })
    },

    async destroy(device: IDevice, globalState) {
      const { auth } = globalState
      dispatch.devices.set({ destroying: true })
      try {
        device.shared
          ? await r3.post(`/developer/device/share/${device.id}/${encodeURIComponent(auth.user?.email || '')}`, {
              devices: device.id,
              emails: auth.user?.email,
              state: 'off',
              scripting: false,
            })
          : await r3.post(`/developer/device/delete/registered/${device.id}`)
        await dispatch.devices.fetch()
      } catch (error) {
        dispatch.ui.set({ errorMessage: error.message })
        console.warn(error)
      }
      dispatch.devices.set({ destroying: false })
    },

    async userAttributes({ userAttributes }: { userAttributes: string[] }, globalState) {
      const unique = new Set(userAttributes.concat(globalState.devices.userAttributes))
      dispatch.devices.set({ userAttributes: [...Array.from(unique)].sort() })
    },
  }),

  reducers: {
    reset(state: IDeviceState) {
      state = defaultState
      return state
    },
    set(state: IDeviceState, params: DeviceParams) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

const isIService = (instance: any): instance is IService => !!instance?.license

export function isOffline(instance?: IDevice | IService, connection?: IConnection) {
  const inactive = instance?.state !== 'active' && !connection?.connected
  const unlicensed = isIService(instance) && instance.license === 'UNLICENSED'
  return inactive || unlicensed
}

export function selectDevice(state: ApplicationState, deviceId?: string) {
  return getAllDevices(state).find(d => d.id === deviceId)
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
      })
  )
  return [service, device] as [IService | undefined, IDevice | undefined]
}
