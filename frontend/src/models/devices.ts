import { graphQLFetch, graphQLAdaptor, graphQLGet } from '../services/graphQL'
import { createModel } from '@rematch/core'
import { r3, hasCredentials } from '../services/remote.it'

type DeviceParams = { [key: string]: any }

type IDeviceState = DeviceParams & {
  all: IDevice[]
  total: number
  results: number
  searched: boolean
  fetching: boolean
  getting: boolean
  destroying: boolean
  query: string
  append: boolean
  filter: 'all' | 'active' | 'inactive'
  size: number
  from: number
}

const state: IDeviceState = {
  all: [],
  total: 0,
  results: 0,
  searched: false,
  fetching: true,
  getting: false,
  destroying: false,
  query: '',
  append: false,
  filter: 'all',
  size: 50,
  from: 0,
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

      if (!hasCredentials()) return

      set({ fetching: true })
      const { devices, total } = await graphQLFetchProcessor(options)

      if (searched) set({ results: total })
      else set({ total })

      if (append) set({ all: [...all, ...devices] })
      else set({ all: devices })

      set({ fetching: false, append: false })
    },

    async graphQLFetchProcessor(options: any, globalState: any) {
      const { graphQLMetadata, graphQLError } = dispatch.devices
      try {
        const gqlResponse = await graphQLFetch(options)
        const [gqlData, total] = await graphQLMetadata(gqlResponse)
        const connections = graphQLAdaptor(gqlData.connections, gqlData.id, true)
        const devices = graphQLAdaptor(gqlData.devices, gqlData.id)
        return { devices: [...connections, ...devices], total }
      } catch (error) {
        await graphQLError(error)
        return { devices: [], total: 0 }
      }
    },

    /*
      Fetches a single device and merges in the state
    */
    async get(id: string) {
      const { graphQLMetadata, graphQLError, setDevice, set } = dispatch.devices
      let result

      if (!hasCredentials()) return

      set({ getting: true })

      try {
        const gqlResponse = await graphQLGet(id)
        const [gqlData] = await graphQLMetadata(gqlResponse)
        result = graphQLAdaptor(gqlData.devices, gqlData.id)[0]
      } catch (error) {
        await graphQLError(error)
      }

      console.log('GET DEVICE', result)
      set({ getting: false })
      setDevice({ id, device: result })
    },

    async graphQLError(error) {
      console.error('Fetch error:', error, error.response)
      if (error && error.response && (error.response.status === 401 || error.response.status === 403)) {
        dispatch.auth.checkSession()
      } else {
        dispatch.backend.set({ globalError: error.message })
      }
    },

    async graphQLMetadata(gqlData: any) {
      const { errors } = gqlData?.data

      if (errors) {
        errors.forEach((error: Error) => console.warn('graphQL error:', error))
        dispatch.backend.set({ globalError: 'GraphQL: ' + errors[0].message })
      }

      const data = gqlData?.data?.data?.login
      const total = data?.devices?.total || 0

      return [data, total]
    },

    async reset() {
      dispatch.backend.set({ connections: [] })
      dispatch.devices.set({ all: [], query: '', filter: 'all' })
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
    [null, null] as [IService | null, IDevice | null]
  )
}
