import axios from 'axios'
import { parseType } from '../services/serviceTypes'
import { createModel } from '@rematch/core'
import { renameServices } from '../helpers/nameHelper'
import { GRAPHQL_API_URL } from '../constants'
import { updateConnections } from '../helpers/connectionHelper'
import { r3 } from '../services/remote.it'

type gqlOptions = {
  size: number
  from: number
  state?: string
  name?: string
  ids?: string[]
}

type DeviceParams = { [key: string]: any }

type IDeviceState = DeviceParams & {
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
}

const state: IDeviceState = {
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
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async fetch(_, globalState: any) {
      const { set, graphQLProcessor } = dispatch.devices
      const { query, filter, size, from, append } = globalState.devices
      const options: gqlOptions = {
        size,
        from,
        state: filter === 'all' ? '' : filter,
        name: query.length > 1 ? query : '',
        ids: append ? [] : globalState.backend.connections.map((c: IConnection) => c.id),
      }

      if (!r3.token || !r3.authHash) {
        console.warn('Fetch missing api token or authHash. Fetch aborted. Token:', r3.token, 'AuthHash:', r3.authHash)
        return
      }

      set({ fetching: true })

      try {
        const gqlData = await fetchGQL(options)
        await graphQLProcessor(gqlData)
      } catch (error) {
        console.error('Fetch error:', error, error.response)
        if (error && error.response && (error.response.status === 401 || error.response.status === 403)) {
          dispatch.backend.set({ globalError: error.message })
          dispatch.auth.handleDisconnect()
        }
      }

      set({ fetching: false, append: false })
    },
    async graphQLProcessor(gqlData: any, globalState: any) {
      const { set, graphQLExtractor } = dispatch.devices
      const { all, append } = globalState.devices

      const gqlLoginData = await graphQLExtractor(gqlData)
      const connections = graphQLAdaptor(gqlLoginData.connections, gqlLoginData.id, true)
      const devices = graphQLAdaptor(gqlLoginData.devices, gqlLoginData.id)

      if (append) set({ all: [...all, ...devices] })
      else set({ all: [...connections, ...devices] })
    },
    async graphQLExtractor(gqlData: any, globalState: any) {
      const { searched } = globalState.devices
      const { errors } = gqlData?.data

      if (errors) {
        dispatch.backend.set({ globalError: errors[0].message })
      }

      const login = gqlData?.data?.data?.login
      const total = login?.devices?.total || 0
      if (searched) dispatch.devices.set({ results: total })
      else dispatch.devices.set({ total })

      return login
    },
    async reset() {
      dispatch.backend.set({ connections: [] })
      dispatch.devices.set({ all: [], query: '', filter: 'all' })
    },
    async destroy(device: IDevice) {
      dispatch.devices.set({ destroying: true })
      r3.post(`/developer/device/delete/registered/${device.id}`)
        .then(async () => {
          await dispatch.devices.fetch()
          dispatch.devices.set({ destroying: false })
        })
        .catch(error => {
          dispatch.devices.set({ destroying: false })
          dispatch.backend.set({ globalError: error.message })
          console.warn(error)
        })
    },
  }),
  reducers: {
    set(state: IDeviceState, params: DeviceParams) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
    },
  },
})

async function fetchGQL({ size, from, state = '', name = '', ids = [] }: gqlOptions) {
  console.log('GQL OPTIONS', size, from, state, name, ids)
  const connections = `connections: devices(id:${JSON.stringify(ids)})`
  const devices = `devices(size:${size}, from:${from}, name:"${name}", state: "${state}")`
  const select = `
  {
    total
    items {
      id
      name
      state
      created
      hardwareId
      lastReported
      owner {
        id
      }
      services {
        name
        id
        port
        type
        created
        endpoint {
          state
        }
      }
    }
  }
  `
  return await axios.request({
    url: GRAPHQL_API_URL,
    method: 'post',
    headers: { token: r3.token },
    data: {
      query: `
        {
          login {
            id
            ${devices}${select}
            ${connections}${select}
          }
        }
      `,
    },
  })
}

function graphQLAdaptor(gqlDevices: any, loginId: string, hidden?: boolean): IDevice[] {
  if (!gqlDevices) return []
  let data = gqlDevices?.items.map(
    (d: any): IDevice => {
      const services = d.services.reduce((result: IService[], s: any): IService[] => {
        const { typeID, type } = parseType(s.type)
        if (typeID !== 35)
          result.push({
            type,
            typeID,
            contactedAt: new Date(s.endpoint?.timestamp),
            createdAt: new Date(s.created),
            deviceID: d.id,
            id: s.id,
            lastExternalIP: '',
            name: s.name,
            port: s.port,
            protocol: '',
            region: '',
            state: s.endpoint?.state,
          })
        return result
      }, [])

      return {
        id: d.id,
        name: d.name,
        owner: d.owner.email,
        state: d.state,
        hardwareID: d.hardwareId,
        createdAt: new Date(d.created),
        contactedAt: new Date(d.endpoint?.timestamp),
        shared: loginId !== d.owner.id,
        lastReported: new Date(d.lastReported),
        lastExternalIP: '',
        lastInternalIP: '',
        region: '',
        services,
        hidden,
      }
    }
  )

  return updateConnections(renameServices(data))
}

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
