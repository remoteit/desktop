// import Device from '../services/Device'
import axios from 'axios'
import { parseType } from '../services/serviceTypes'
import { createModel } from '@rematch/core'
import { renameServices } from '../helpers/nameHelper'
import { updateConnections } from '../helpers/connectionHelper'
import { ApplicationState } from '../store'
import { r3 } from '../services/remote.it'

const SORT_SETTING_KEY = 'sort'

type gqlOptions = {
  size: number
  from: number
  state?: string
  name?: string
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
  filter: boolean
  size: number
  from: number
}

const state: IDeviceState = {
  all: [],
  total: 0,
  results: 0,
  searched: false, // if displaying search results
  fetching: true,
  destroying: false,
  query: '',
  filter: window.localStorage.getItem(SORT_SETTING_KEY) === 'true',
  size: 25,
  from: 0,
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async fetch(_, globalState: ApplicationState) {
      const { set, graphQLExtractor, setDevices } = dispatch.devices
      const { query, filter, size, from } = globalState.devices
      const options: gqlOptions = {
        size,
        from,
        state: filter ? 'active' : '',
        name: query.length > 1 ? query : '',
      }

      if (!r3.token || !r3.authHash) {
        console.warn('Fetch missing api token or authHash. Fetch aborted. Token:', r3.token, 'AuthHash:', r3.authHash)
        return
      }

      set({ fetching: true })

      return fetchAllGQL(options)
        .then(graphQLExtractor)
        .then(graphQLAdaptor)
        .then(renameServices)
        .then(updateConnections)
        .then(setDevices)
        .catch(error => {
          console.error('Fetch error:', error, error.response)
          if (error && error.response && (error.response.status === 401 || error.response.status === 403)) {
            setDevices([])
            dispatch.auth.signedOut()
          }
        })
        .finally(() => set({ fetching: false }))
    },
    async graphQLExtractor(gqlData: any, globalState: ApplicationState) {
      const { searched } = globalState.devices
      const login = gqlData?.data?.data?.login
      const total = login?.devices?.total || 0
      if (searched) dispatch.devices.set({ results: total })
      else dispatch.devices.set({ total })
      return login
    },
    async reset() {
      dispatch.backend.set({ connections: [] })
      dispatch.devices.setDevices([])
      dispatch.devices.set({ query: '', filter: false })
    },
    destroy(device: IDevice) {
      dispatch.devices.set({ destroying: true })
      r3.post(`/developer/device/delete/registered/${device.id}`)
        .then(async () => {
          await dispatch.devices.fetch(false)
          dispatch.devices.set({ destroying: false })
        })
        .catch(error => {
          dispatch.devices.set({ destroying: false })
          dispatch.backend.set({ cliError: error.message })
          console.warn(error)
        })
    },
  }),
  reducers: {
    set(state: IDeviceState, params: DeviceParams) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
    },
    setFilter(state: IDeviceState, sort: boolean) {
      state.filter = sort
      window.localStorage.setItem(SORT_SETTING_KEY, sort.toString())
    },
    setDevices(state: IDeviceState, devices: IDevice[]) {
      state.all = devices
    },
  },
})

async function fetchAllGQL({ size, from, state = '', name = '' }: gqlOptions) {
  console.log('FETCH', size, from, state, name)
  return await axios
    .request({
      url: 'https://api.remote.it/v1/graphql',
      method: 'post',
      headers: { token: r3.token },
      data: {
        query: `
        {
          login {
            id
            devices(size:${size}, from:${from}, name:"${name}", state: "${state}" ) {
              total
              items {
                id
                name
                created
                hardwareId
                owner {
                  id
                }
                services {
                  name
                  id
                  port
                  title
                  type
                  bulk
                  created
                  endpoint {
                    availability
                    instability
                    state
                  }
                }
              }
            }
          }
        }
      `,
      },
    })
    .catch(e => console.warn(e))
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

function graphQLAdaptor(gqlDataLogin: any): IDevice[] {
  let data = gqlDataLogin?.devices?.items.map(
    (d: any): IDevice => {
      let deviceState = 'inactive'
      const services = d.services.reduce((result: IService[], s: any): IService[] => {
        const { typeID, type } = parseType(s.type)
        deviceState = s.endpoint?.state === 'active' ? 'active' : deviceState
        if (!s.bulk)
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
        state: deviceState,
        hardwareID: d.hardwareId,
        createdAt: new Date(d.created),
        contactedAt: new Date(d.endpoint?.timestamp),
        shared: gqlDataLogin.id !== d.owner.id,
        lastExternalIP: '',
        lastInternalIP: '',
        region: '',
        services,
      }
    }
  )

  return data
}
