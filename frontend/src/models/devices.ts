import {
  graphQLSetAttributes,
  graphQLClaimDevice,
  graphQLAddService,
  graphQLUpdateService,
  graphQLRemoveService,
  graphQLSetDeviceNotification,
  graphQLTransferDevice,
} from '../services/graphQLMutation'
import {
  graphQLFetchDevices,
  graphQLFetchDevice,
  graphQLCreateRegistration,
  graphQLAdaptor,
} from '../services/graphQLDevice'
import { getLocalStorage, setLocalStorage } from '../services/Browser'
import { cleanOrphanConnections, getConnectionIds } from '../helpers/connectionHelper'
import { getActiveAccountId, getAllDevices } from './accounts'
import { r3, hasCredentials } from '../services/remote.it'
import { graphQLGetErrors } from '../services/graphQL'
import { ApplicationState } from '../store'
import { AxiosResponse } from 'axios'
import { createModel } from '@rematch/core'
import { RootModel } from './rootModel'
import { apiError } from '../helpers/apiHelper'

const SAVED_STATES = ['filter', 'sort', 'owner', 'platform', 'sortServiceOption']

type DeviceParams = { [key: string]: any }

type IGetDevice = {
  id: string
  hidden?: boolean
  thisDevice?: boolean
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
  transferring: boolean
  query: string
  append: boolean
  filter: 'all' | 'active' | 'inactive'
  sort: 'name' | '-name' | 'state' | '-state' | 'color' | '-color'
  owner: 'all' | 'me' | 'others'
  platform: number[] | undefined
  size: number
  from: number
  contacts: IUserRef[]
  eventsUrl: string
  sortServiceOption: 'ATOZ' | 'ZTOA' | 'NEWEST' | 'OLDEST'
  userAttributes: string[]
  registrationCode: string
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
  transferring: false,
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
  registrationCode: '',
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async init(_, state) {
      let states = {}
      SAVED_STATES.forEach(key => {
        const value = getLocalStorage(state, `device-${key}`)
        if (value) states[key] = value
      })
      dispatch.devices.set(states)
    },
    /* 
      GraphQL search query for all device data
    */
    async fetch(optionalAccountId?: string, globalState?) {
      const accountId: string = optionalAccountId || getActiveAccountId(globalState)
      const userId = globalState.auth.user?.id
      const ids = globalState.backend.device.uid ? [globalState.backend.device.uid] : []
      if (!userId) return console.error('NO AUTH USER ID')
      if (!accountId) return console.error('FETCH WITH MISSING ACCOUNT ID')
      const { updateSearch } = dispatch.search
      const { set, graphQLFetchProcessor } = dispatch.devices
      const { setDevices, mergeDevices, appendUniqueDevices } = dispatch.accounts
      const { query, sort, owner, filter, size, from, append, searched, platform } = globalState.devices
      const options: gqlOptions = {
        size,
        from,
        account: accountId,
        state: filter === 'all' ? undefined : filter,
        name: query,
        ids: append ? undefined : ids.concat(getConnectionIds(globalState)),
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
        await mergeDevices({ devices: connections, accountId: userId })
      }

      updateSearch()
      if (!error) cleanOrphanConnections(options.ids)

      // @TODO pull contacts out into its own model / request on page load
      set({ fetching: false, append: false, initialized: true, contacts })
    },

    /*
      Fetches a single device and merges in the state
    */
    async fetchSingle({ id, hidden, thisDevice }: IGetDevice, globalState): Promise<IDevice | undefined> {
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
        await apiError(error)
      }

      if (result) result.thisDevice = result.thisDevice || thisDevice
      await dispatch.accounts.setDevice({ id: id, accountId, device: result })
      set({ fetching: false })

      return result
    },

    async graphQLFetchProcessor(options: gqlOptions) {
      try {
        const gqlResponse = await graphQLFetchDevices(options)
        const [deviceData, connectionData, total, loginId, contacts, error] = graphQLMetadata(gqlResponse)
        const connections = graphQLAdaptor(connectionData, loginId, options.account, true)
        const devices = graphQLAdaptor(deviceData, loginId, options.account)
        return { devices, connections, total, contacts, error }
      } catch (error) {
        await apiError(error)
        return { devices: [], total: 0, error }
      }
    },

    async updateShareDevice(device: IDevice) {
      dispatch.accounts.setDevice({ id: device.id, device })
    },

    async renameService(service: IService, globalState) {
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
        if (error instanceof Error) dispatch.ui.set({ errorMessage: error.message })
        console.warn(error)
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

    async claimDevice(code: string, globalState) {
      dispatch.ui.set({ claiming: true })
      dispatch.ui.guide({ guide: 'guideAWS', step: 2 })

      const result = await graphQLClaimDevice(code)

      if (result !== 'ERROR') {
        const device = result?.data?.data?.claimDevice
        if (device?.id) {
          await dispatch.devices.fetch() // fetch all so that the sorting is correct
          dispatch.ui.set({ successMessage: `'${device.name}' was successfully registered!` })
        } else {
          dispatch.ui.set({ noticeMessage: `Your device (${code}) could not be found.` })
        }
        dispatch.ui.set({ claiming: false })
      }

      if (globalState.auth.user) await dispatch.accounts.setActive(globalState.auth.user.id.toString())
      dispatch.ui.guide({ guide: 'guideAWS', step: 3 })
    },

    async createRegistration(services: IApplicationType['id'][], globalState) {
      const result = await graphQLCreateRegistration(services)
      if (result !== 'ERROR') {
        const { registrationCode } = result?.data?.data?.login
        console.log('CREATE REGISTRATION', registrationCode)
        dispatch.devices.set({ registrationCode })
      }
    },

    async destroy(device: IDevice, globalState) {
      const { auth } = globalState
      dispatch.devices.set({ destroying: true })
      try {
        device.permissions.includes('MANAGE')
          ? await r3.post(`/developer/device/delete/registered/${device.id}`)
          : await r3.post(`/developer/device/share/${device.id}/${encodeURIComponent(auth.user?.email || '')}`, {
              devices: device.id,
              emails: auth.user?.email,
              state: 'off',
              scripting: false,
            })

        await dispatch.devices.fetch()
      } catch (error) {
        if (error instanceof Error) dispatch.ui.set({ errorMessage: error.message })
        console.warn(error)
      }
      dispatch.devices.set({ destroying: false })
    },

    async userAttributes({ userAttributes }: { userAttributes: string[] }, globalState) {
      const unique = new Set(userAttributes.concat(globalState.devices.userAttributes))
      dispatch.devices.set({ userAttributes: [...Array.from(unique)].sort() })
    },

    async setPersistent(params: DeviceParams, state) {
      Object.keys(params).forEach(key => {
        if (SAVED_STATES.includes(key)) setLocalStorage(state, `device-${key}`, params[key] || '')
      })
      dispatch.devices.set(params)
    },
    async transferDevice(data: ITransferProps) {
      if (data.email && data.device) {
        dispatch.devices.set({ transferring: true })
        try {
          await graphQLTransferDevice(data)
          await dispatch.devices.fetch()
          dispatch.ui.set({
            successMessage: `"${data.device.name}" was successfully transferred to ${data.email}.`,
          })
        } catch (error) {
          if (error instanceof Error) dispatch.ui.set({ errorMessage: error.message })
          console.warn(error)
        }
        dispatch.devices.set({ transferring: false })
      }
    },
  }),

  reducers: {
    reset(state: IDeviceState) {
      state = { ...defaultState }
      return state
    },
    set(state: IDeviceState, params: DeviceParams) {
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
  const { connections, contacts, id } = gqlData?.data?.data?.login || {}
  return [devices, connections, total, id, contacts, error]
}

export function selectIsFiltered(state: ApplicationState) {
  return (
    state.devices.sort !== defaultState.sort ||
    state.devices.filter !== defaultState.filter ||
    state.devices.owner !== defaultState.owner ||
    state.devices.platform !== defaultState.platform
  )
}

export function isOffline(instance?: IDevice | IService, connection?: IConnection) {
  const inactive = instance?.state !== 'active' && !connection?.connected
  return inactive
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
        return false
      })
  )
  return [service, device] as [IService | undefined, IDevice | undefined]
}
