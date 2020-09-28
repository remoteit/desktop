import {
  graphQLFetchDevices,
  graphQLFetchDevice,
  graphQLAdaptor,
  graphQLGetMoreLogs,
  graphQLGetEventsURL,
} from '../services/graphQLDevice'
import { graphQLGetErrors, graphQLHandleError } from '../services/graphQL'
import { getAccountId, getDevices } from './accounts'
import { cleanOrphanConnections, getConnectionIds } from '../helpers/connectionHelper'
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
  fetchingMore: boolean
  destroying: boolean
  query: string
  append: boolean
  filter: 'all' | 'active' | 'inactive'
  size: number
  from: number
  contacts: IUserRef[]
  eventsUrl: string
}

const state: IDeviceState = {
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
  size: 50,
  from: 0,
  contacts: [],
  eventsUrl: '',
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    /* 
      GraphQL search query for all device data
    */

    // @TODO might want a fetch member call and a fetch(logged in user) call
    // The fetch member call could be smaller and not get the connections an
    // other stuff
    async fetch(_, globalState: any) {
      const { set, graphQLFetchProcessor } = dispatch.devices
      const { setDevices } = dispatch.accounts
      const { query, filter, size, from, append, searched } = globalState.devices
      const accountId = getAccountId(globalState)
      const all = getDevices(globalState)
      const options: gqlOptions = {
        size,
        from,
        account: accountId,
        state: filter === 'all' ? undefined : filter,
        name: query,
        ids: append ? undefined : getConnectionIds(globalState),
      }

      if (!(await hasCredentials())) return

      set({ fetching: true })
      const { devices, total, contacts, error } = await graphQLFetchProcessor(options)

      if (searched) set({ results: total })
      else set({ total })

      if (append) setDevices({ devices: [...all, ...devices], accountId })
      else setDevices({ devices, accountId })

      set({ initialized: true, fetching: false, append: false, contacts })
      // @TODO pull contacts out into it's own model / request on page load

      if (!error) cleanOrphanConnections()
      dispatch.ui.devicesUpdated()
    },

    /*
      Fetches a single device and merges in the state
    */
    async fetchSingle({ deviceId, accountId = '', hidden }: IGetDevice, globalState: any) {
      const { set } = dispatch.devices
      let result

      if (!(await hasCredentials())) return

      accountId = accountId || getAccountId(globalState)
      set({ fetching: true })
      try {
        const gqlResponse = await graphQLFetchDevice(deviceId)
        graphQLGetErrors(gqlResponse)
        const { device } = gqlResponse?.data?.data?.login || {}
        const loginId = gqlResponse?.data?.data?.login?.id
        result = device ? graphQLAdaptor(device, loginId, hidden)[0] : []
      } catch (error) {
        await graphQLHandleError(error)
      }

      set({ fetching: false })
      dispatch.accounts.setDevice({ id: deviceId, accountId, device: result })
    },

    async graphQLFetchProcessor(options: gqlOptions) {
      const { graphQLMetadata } = dispatch.devices
      const parseAccounts = dispatch.accounts.parse
      try {
        const gqlResponse = await graphQLFetchDevices(options)
        const [deviceData, connectionData, total, loginId, contacts, error] = await graphQLMetadata(gqlResponse)
        const connections = graphQLAdaptor(connectionData, loginId, true)
        const devices = graphQLAdaptor(deviceData, loginId)
        await parseAccounts(gqlResponse)
        return { devices: [...connections, ...devices], total, contacts, error }
      } catch (error) {
        await graphQLHandleError(error)
        return { devices: [], total: 0, error }
      }
    },
    async fetchLogs({ id, from, maxDate }: any, globalState: any) {
      const { graphQLMetadata, graphQLError, setDevice, set } = dispatch.devices
      const { all } = globalState.devices

      if (!hasCredentials()) return

      from === 0 ? set({ fetching: true }) : set({ fetchingMore: true })

      try {
        const gqlResponse = await graphQLGetMoreLogs(id, from, maxDate)
        const [gqlData] = await graphQLMetadata(gqlResponse)
        const { events } = gqlData.devices.items[0]
        const devices: IDevice[] = all
          .filter((d: IDevice) => d.id === id)
          .map((_d: IDevice) => {
            const items = from === 0 ? events.items : _d.events.items.concat(events.items)
            return { ..._d, events: { ...events, items } }
          })
        setDevice({ id, device: devices[0] })
      } catch (error) {
        await graphQLError(error)
      }

      from === 0 ? set({ fetching: false }) : set({ fetchingMore: false })
    },

    async getEventsURL({ id, maxDate }: any, globalState: any) {
      const { graphQLMetadata, graphQLError, set } = dispatch.devices

      if (!hasCredentials()) return
      try {
        const gqlResponse = await graphQLGetEventsURL(id, maxDate)
        const [gqlData] = await graphQLMetadata(gqlResponse)
        const { eventsUrl } = gqlData.device
        set({ eventsUrl: eventsUrl })
      } catch (error) {
        await graphQLError(error)
      }
    },

    async updateShareDevice(device: IDevice) {
      dispatch.accounts.setDevice({ id: device.id, device })
    },

    async graphQLMetadata(gqlData: any) {
      const error = graphQLGetErrors(gqlData)
      const devices = gqlData?.data?.data?.login?.account?.devices?.items || {}
      const { connections, contacts, id } = gqlData?.data?.data?.login
      const total = devices.total || 0
      return [devices, connections, total, id, contacts, error]
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
      const service = d?.services?.find(s => s.id === id)
      if (service) {
        all[0] = service
        all[1] = d
      }
      return all
    },
    [undefined, undefined] as [IService | undefined, IDevice | undefined]
  )
}
