import { graphQLFetchDevices, graphQLFetchDevice, graphQLAdaptor } from '../services/graphQLDevice'
import { graphQLGetErrors, graphQLHandleError } from '../services/graphQL'
import { getAccountId, getDevices } from './accounts'
import { cleanOrphanConnections } from '../helpers/connectionHelper'
import { graphQLSetAttributes } from '../services/graphQLMutation'
import { r3, hasCredentials } from '../services/remote.it'
import { ApplicationState } from '../store'
import { createModel } from '@rematch/core'
import { emit } from '../services/Controller'

type DeviceParams = { [key: string]: any }

type IGetDevice = {
  deviceId: string
  accountId?: string
  hidden?: boolean
}

type IDeviceState = DeviceParams & {
  initialized: boolean
  total: number
  results: number
  searched: boolean
  fetching: boolean
  destroying: boolean
  query: string
  append: boolean
  filter: 'all' | 'active' | 'inactive'
  size: number
  from: number
  contacts: IUserRef[]
}

const state: IDeviceState = {
  initialized: false,
  total: 0,
  results: 0,
  searched: false,
  fetching: true,
  destroying: false,
  query: '',
  append: false,
  filter: 'all',
  size: 50,
  from: 0,
  contacts: [],
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async init(_, globalState) {
      dispatch.devices.fetch(true)
      if (globalState.accounts.activeId !== globalState.auth.user?.id) {
        dispatch.devices.fetch()
      }
    },

    /* 
      GraphQL search query for all device data
    */
    async fetch(ownDevice, globalState: any) {
      const { set, graphQLFetchProcessor } = dispatch.devices
      const { setDevices } = dispatch.accounts
      const { query, filter, size, from, append, searched } = globalState.devices
      const { connections, device } = globalState.backend
      const account = ownDevice ? globalState.auth.user?.id : getAccountId(globalState)
      const all = getDevices(globalState)
      const options: gqlOptions = {
        size,
        from,
        account,
        state: filter === 'all' ? undefined : filter,
        name: query,
        ids: append ? [] : [device.uid].concat(connections.map((c: IConnection) => c.id)),
      }

      if (!hasCredentials()) return

      set({ fetching: true })
      const { devices, total, contacts, error } = await graphQLFetchProcessor(options)

      if (searched) set({ results: total })
      else set({ total })

      if (append) setDevices({ devices: [...all, ...devices], accountId: account })
      else setDevices({ devices, accountId: account })

      set({ initialized: true, fetching: false, append: false, contacts })
      // @TODO pull contacts out into it's own model / request on page load

      if (!error) cleanOrphanConnections()
      dispatch.ui.devicesUpdated()
    },

    /*
      Fetches a single device and merges in the state
    */
    async fetchDevice({ deviceId, accountId = '', hidden }: IGetDevice, globalState: any) {
      const { set } = dispatch.devices
      if (!hasCredentials()) return
      let result

      accountId = accountId || getAccountId(globalState)

      set({ fetching: true })

      try {
        const gqlResponse = await graphQLFetchDevice(deviceId, accountId)
        graphQLGetErrors(gqlResponse)
        const { device } = gqlResponse?.data?.data?.login?.account || {}
        result = graphQLAdaptor([device], accountId)[0]
      } catch (error) {
        await graphQLHandleError(error)
      }

      set({ fetching: false })
      dispatch.accounts.setDevice({ id: deviceId, accountId, device: { ...result, hidden } })
    },

    async graphQLFetchProcessor(options: gqlOptions) {
      const { graphQLMetadata } = dispatch.devices
      const parseAccounts = dispatch.accounts.parse
      try {
        const gqlResponse = await graphQLFetchDevices(options)
        const [gqlData, total, loginId, contacts, error] = await graphQLMetadata(gqlResponse)
        const connections = graphQLAdaptor(gqlData?.connections?.items, loginId, true)
        const devices = graphQLAdaptor(gqlData?.devices?.items, loginId)
        await parseAccounts(gqlResponse)
        return { devices: [...connections, ...devices], total, contacts, error }
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
      const data = gqlData?.data?.data?.login?.account || {}
      const contacts = gqlData?.data?.data?.login?.contacts
      const loginId = gqlData?.data?.data?.login?.id
      const total = data?.devices?.total || 0
      return [data, total, loginId, contacts, error]
    },

    async reset() {
      dispatch.accounts.setDevices({ devices: [] })
      dispatch.backend.set({ connections: [] })
      dispatch.devices.set({ query: '', filter: 'all', initialized: false })
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
      console.log('DEVICE RENAME', device.name)
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
      emit('service/forget', service) // clear connection since state changed?
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
    },
  },
})

export function findService(devices: IDevice[], id: string) {
  return devices.reduce(
    (all, d) => {
      const service = d.services.find(s => s.id === id)
      if (service) {
        all[0] = service
        all[1] = d
      }
      return all
    },
    [undefined, undefined] as [IService | undefined, IDevice | undefined]
  )
}
