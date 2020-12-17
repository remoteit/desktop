import { graphQLFetchDevices, graphQLFetchDevice, graphQLAdaptor } from '../services/graphQLDevice'
import { graphQLGetErrors, graphQLHandleError } from '../services/graphQL'
import { getAccountId, getDevices, getAllDevices } from './accounts'
import { cleanOrphanConnections, getConnectionIds } from '../helpers/connectionHelper'
import { platformConfiguration } from '../services/platformConfiguration'
import { graphQLSetAttributes } from '../services/graphQLMutation'
import { r3, hasCredentials } from '../services/remote.it'
import { ApplicationState } from '../store'
import { createModel } from '@rematch/core'
import { emit } from '../services/Controller'
import { RootModel } from './rootModel'

type DeviceParams = { [key: string]: any }

type IGetDevice = {
  deviceId: string
  hidden?: boolean
}

type IDeviceState = DeviceParams & {
  initialized: boolean
  total: number
  results: number
  searched: boolean
  fetching: boolean
  fetchingMore: boolean
  destroying: boolean
  query: string
  append: boolean
  filter: 'all' | 'active' | 'inactive'
  sort: 'name' | '-name' | 'state' | '-state' | 'color' | '-color'
  owner: 'all' | 'me' | 'others'
  size: number
  from: number
  contacts: IUserRef[]
  eventsUrl: string
}

export const state: IDeviceState = {
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
  size: 50,
  from: 0,
  contacts: [],
  eventsUrl: '',
}

export default createModel<RootModel>()({
  state,
  effects: (dispatch: any) => ({
    /* 
      GraphQL search query for all device data
    */
    async fetch(optionalAccountId?: string, globalState?) {
      const accountId: string = optionalAccountId || getAccountId(globalState)
      const { set, graphQLFetchProcessor } = dispatch.devices
      const { setDevices, appendDevices } = dispatch.accounts
      const { query, sort, owner, filter, size, from, append, searched } = globalState.devices
      const { user } = globalState.auth
      const all = getDevices(globalState)
      const options: gqlOptions = {
        size,
        from,
        account: accountId,
        state: filter === 'all' ? undefined : filter,
        name: query,
        ids: append ? undefined : getConnectionIds(globalState),
        sort,
        owner: owner === 'all' ? undefined : owner === 'me',
      }

      if (!(await hasCredentials())) return

      set({ fetching: true })
      const { devices, connections, total, contacts, error } = await graphQLFetchProcessor(options)

      if (searched) set({ results: total })
      else set({ total })

      // awaiting setDevices is critical for accurate initialized state
      if (append) await setDevices({ devices: [...all, ...devices], accountId })
      else {
        await setDevices({ devices, accountId })
        await appendDevices({ devices: connections, accountId: user?.id })
      }

      if (!error) cleanOrphanConnections()
      platformConfiguration()

      // @TODO pull contacts out into it's own model / request on page load
      set({ initialized: true, fetching: false, append: false, contacts })
    },

    /*
      Fetches a single device and merges in the state
    */
    async fetchSingle({ deviceId, hidden }: IGetDevice, globalState: any): Promise<IDevice | undefined> {
      const { set } = dispatch.devices
      const device = selectDevice(globalState, deviceId)
      const accountId = device?.accountId || getAccountId(globalState)

      let result: IDevice | undefined

      if (!(await hasCredentials()) || !deviceId) return

      set({ fetching: true })
      try {
        const gqlResponse = await graphQLFetchDevice(deviceId)
        graphQLGetErrors(gqlResponse)
        const gqlDevice = gqlResponse?.data?.data?.login.device || {}
        const loginId = gqlResponse?.data?.data?.login?.id
        result = gqlDevice ? graphQLAdaptor(gqlDevice, loginId, accountId, hidden)[0] : undefined
      } catch (error) {
        await graphQLHandleError(error)
      }

      await dispatch.accounts.setDevice({ id: deviceId, accountId, device: result })
      set({ fetching: false })

      platformConfiguration()
      return result
    },

    async graphQLFetchProcessor(options: gqlOptions) {
      const { graphQLMetadata } = dispatch.devices
      const parseAccounts = dispatch.accounts.parse
      try {
        const gqlResponse = await graphQLFetchDevices(options)
        const [deviceData, connectionData, total, loginId, contacts, error] = await graphQLMetadata(gqlResponse)
        const connections = graphQLAdaptor(connectionData, loginId, options.account, true)
        const devices = graphQLAdaptor(deviceData, loginId, options.account)
        await parseAccounts(gqlResponse)
        return { devices, connections, total, contacts, error }
      } catch (error) {
        await graphQLHandleError(error)
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
      const { connections, contacts, id } = gqlData?.data?.data?.login
      return [devices, connections, total, id, contacts, error]
    },

    async renameService(service: IService, globalState: any) {
      let device = getDevices(globalState).find((d: IDevice) => d.id === service.deviceID)
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
        dispatch.backend.set({ globalError: error.message })
        console.warn(error)
      }
    },

    async setAttributes(device: IDevice) {
      graphQLSetAttributes(device.attributes, device.id)
      dispatch.accounts.setDevice({ id: device.id, device })
    },

    async setServiceAttributes(service: IService, globalState: any) {
      let device = getDevices(globalState).find((d: IDevice) => d.id === service.deviceID)
      if (!device) return
      const index = device.services.findIndex((s: IService) => s.id === service.id)
      device.services[index].attributes = service.attributes
      graphQLSetAttributes(service.attributes, service.id)
      dispatch.accounts.setDevice({ id: device.id, device })
    },

    async destroy(device: IDevice, globalState: any) {
      const { auth } = globalState
      dispatch.devices.set({ destroying: true })
      try {
        device.shared
          ? await r3.post(`/developer/device/share/${device.id}/${encodeURIComponent(auth.user?.email)}`, {
              devices: device.id,
              emails: auth.user?.email,
              state: 'off',
              scripting: false,
            })
          : await r3.post(`/developer/device/delete/registered/${device.id}`)
        await dispatch.devices.fetch()
      } catch (error) {
        dispatch.backend.set({ globalError: error.message })
        console.warn(error)
      }
      dispatch.devices.set({ destroying: false })
    },
  }),

  reducers: {
    set(state: IDeviceState, params: DeviceParams) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

const isIService = (instance: any): instance is IService => !!instance?.license

export function isOffline(instance?: IDevice | IService, connection?: IConnection) {
  const inactive = instance?.state !== 'active' && !connection?.active
  const unlicensed = isIService(instance) && instance.license === 'UNLICENSED'
  return inactive || unlicensed
}

export function selectDevice(state: ApplicationState, deviceId: string) {
  return getAllDevices(state).find(d => d.id === deviceId)
}

export function selectService(state: ApplicationState, serviceId: string) {
  return findService(getAllDevices(state), serviceId)
}

// export function findService(devices: IDevice[], id: string) {
//   return devices.reduce(
//     (all, d) => {
//       const service = d?.services?.find(s => s.id === id)
//       if (service) {
//         all[0] = service
//         all[1] = d
//       }
//       return all
//     },
//     [undefined, undefined] as [IService | undefined, IDevice | undefined]
//   )
// }

export function findService(devices: IDevice[], id: string) {
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
