import { graphQLFetchDevices, graphQLFetchDevice, graphQLAdaptor } from '../services/graphQLDevice'
import { graphQLGetErrors, graphQLHandleError } from '../services/graphQL'
import { cleanOrphanConnections } from '../helpers/connectionHelper'
import { graphQLSetAttributes } from '../services/graphQLMutation'
import { r3, hasCredentials } from '../services/remote.it'
import { createModel } from '@rematch/core'
import { IContact } from 'remote.it'
import { emit } from '../services/Controller'

type DeviceParams = { [key: string]: any }

type IDeviceState = DeviceParams & {
  initialized: boolean
  all: IDevice[]
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
  contacts: IContact[]
}

const state: IDeviceState = {
  initialized: false,
  all: [],
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
    /* 
      GraphQL search query for all device data
    */
    async fetch(_, globalState: any) {
      const { set, graphQLFetchProcessor } = dispatch.devices
      const { all, query, filter, size, from, append, searched } = globalState.devices
      const { connections, device, targets } = globalState.backend
      const options: gqlOptions = {
        size,
        from,
        state: filter === 'all' ? undefined : filter,
        name: query,
        ids: append
          ? []
          : [device.uid].concat(
              connections.map((c: IConnection) => c.id),
              targets.map((t: ITarget) => t.uid)
            ),
      }

      if (!await hasCredentials()) return

      set({ fetching: true })
      const { devices, total, contacts, error } = await graphQLFetchProcessor(options)

      if (searched) set({ results: total })
      else set({ total })

      if (append) set({ all: [...all, ...devices], contacts })
      else set({ all: devices })

      set({ initialized: true, fetching: false, append: false, contacts })

      if (!error) cleanOrphanConnections()
      dispatch.ui.devicesUpdated()
    },

    /*
      Fetches a single device and merges in the state
    */
    async get(id: string) {
      const { graphQLMetadata, setDevice, set } = dispatch.devices
      let result

      if (!await hasCredentials()) return

      set({ fetching: true })

      try {
        const gqlResponse = await graphQLFetchDevice(id)
        const [gqlData] = await graphQLMetadata(gqlResponse)
        result = graphQLAdaptor(gqlData.devices, gqlData.id)[0]
      } catch (error) {
        await graphQLHandleError(error)
      }

      set({ fetching: false })
      setDevice({ id, device: result })
    },

    async graphQLFetchProcessor(options: any, globalState: any) {
      const { graphQLMetadata } = dispatch.devices
      try {
        const gqlResponse = await graphQLFetchDevices(options)
        const [gqlData, total, error] = await graphQLMetadata(gqlResponse)
        const connections = graphQLAdaptor(gqlData?.connections, gqlData?.id, true)
        const devices = graphQLAdaptor(gqlData?.devices, gqlData?.id)
        return { devices: [...connections, ...devices], total, contacts: gqlData?.contacts, error }
      } catch (error) {
        await graphQLHandleError(error)
        return { devices: [], total: 0, error }
      }
    },

    async updateShareDevice(device: IDevice) {
      const { setDevice } = dispatch.devices
      setDevice({ id: device.id, device })
    },

    async graphQLMetadata(gqlData: any) {
      const error = graphQLGetErrors(gqlData)
      const data = gqlData?.data?.data?.login || {}
      const total = data?.devices?.total || 0

      return [data, total, error]
    },

    async reset() {
      dispatch.backend.set({ connections: [] })
      dispatch.devices.set({ all: [], query: '', filter: 'all', initialized: false })
    },

    async renameService(service: IService, globalState: any) {
      let device = globalState.devices.all.find((d: IDevice) => d.id === service.deviceID)
      const index = device.services.findIndex((s: IService) => s.id === service.id)
      device.services[index].name = service.name
      dispatch.devices.setDevice({ id: device.id, device })
      dispatch.devices.rename(service)
    },

    async renameDevice(device: IDevice) {
      console.log('DEVICE RENAME', device.name)
      dispatch.devices.setDevice({ id: device.id, device })
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
      dispatch.devices.setDevice({ id: device.id, device })
    },

    async setServiceAttributes(service: IService, globalState: any) {
      let device = globalState.devices.all.find((d: IDevice) => d.id === service.deviceID)
      const index = device.services.findIndex((s: IService) => s.id === service.id)
      device.services[index].attributes = service.attributes
      graphQLSetAttributes(service.attributes, service.id)
      dispatch.devices.setDevice({ id: device.id, device })
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
    setDevice(state: IDeviceState, { id, device }: { id: string; device: IDevice }) {
      let exists = false
      state.all.forEach((d, index) => {
        if (d.id === id) {
          if (device) state.all[index] = { ...device, hidden: d.hidden }
          else state.all.splice(index, 1)
          exists = true
        }
      })

      // Add if new
      if (!exists && device) state.all.push(device)
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

export function getUsersConnectedDeviceOrService(device?: IDevice, service?: IService) {
  const userConnected: IUser[] = []

  const getSessionService = (s: IService) =>
    s?.sessions.forEach(session => !userConnected.includes(session) && userConnected.push(session))

  if (service) getSessionService(service)
  else if (device) device.services.forEach(getSessionService)
  return userConnected
}

export function getDetailUserPermission(device: IDevice, emailUser: string) {
  const services =
    device.services.filter(service => service.access && service.access.find(_ac => _ac.email === emailUser)) || []
  return {
    scripting: device?.access.find(_ac => _ac.email === emailUser)?.scripting || false,
    numberServices: services.length,
    services,
  }
}
