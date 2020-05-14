import fuzzy from 'fuzzy'
import Device from '../services/Device'
import axios from 'axios'
import { parseType } from '../services/serviceTypes'
import { createModel } from '@rematch/core'
import { renameServices } from '../helpers/nameHelper'
import { updateConnections } from '../helpers/connectionHelper'
import { r3 } from '../services/remote.it'

// Slightly below the API limit for search of 300 services.
const SEARCH_ONLY_SERVICE_LIMIT = 300

const SORT_SETTING_KEY = 'sort'
const SEARCH_ONLY_SETTING_KEY = 'search-only'

interface IDeviceState {
  all: IDevice[]
  searchPerformed: boolean
  fetched: boolean
  fetching: boolean
  searchOnly: boolean
  searching: boolean
  destroying: boolean
  query: string
  sort: SortType
}

// async function fetchAll(cache: boolean = true): Promise<IDevice[]> {
//   const [allDevices, metadata] = await Promise.all([
//     r3.get(`/device/list/all?cache=${cache.toString()}`).then(({ devices }: { devices: IRawDevice[] }) => devices),
//     r3.devices.metadata(),
//   ])
//   return r3.devices.group(allDevices, metadata)
// }

async function fetchAllGQL(): Promise<IDevice[]> {
  const data = await axios
    .request({
      url: 'https://api.remote.it/v1/graphql',
      method: 'post',
      headers: {
        token: r3.token,
        'Content-Type': 'application/json',
      },
      data: {
        query: `
        {
          login {
            id
            devices(size: 200) {
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

  return graphQLAdaptor(data)
}

function graphQLAdaptor(gqlData: any): IDevice[] {
  const login = gqlData?.data?.data?.login
  let data = login?.devices?.items.map(
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
        shared: login.id !== d.owner.id,
        lastExternalIP: '',
        lastInternalIP: '',
        region: '',
        services,
      }
    }
  )

  return data
}

const state: IDeviceState = {
  all: [],
  searchPerformed: false,
  fetched: false,
  fetching: true,
  searching: false,
  searchOnly: false,
  destroying: false,
  query: '',
  sort: (window.localStorage.getItem(SORT_SETTING_KEY) || 'state') as SortType,
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    /**
     * Decide if the user should only search for devices veruses
     * us fetching all of their devices at the getgo.
     */
    async shouldSearchDevices() {
      // First see if they have already decided on their preference
      const pref = window.localStorage.getItem(SEARCH_ONLY_SETTING_KEY)
      let searchOnly = false

      // Handle unset state - localStorage turns bool into string
      if (typeof pref === 'string') {
        searchOnly = pref === 'true'
      }

      if (!searchOnly) {
        // const count = await r3.devices.count()
        searchOnly = false //count.services > SEARCH_ONLY_SERVICE_LIMIT
      }

      dispatch.devices.setSearchOnly(searchOnly)
      return searchOnly
    },
    async fetch(cache: boolean = true) {
      // TODO: Deal with device search only UI
      const { fetchStarted, fetchFinished, setDevices } = dispatch.devices

      if (!r3.token || !r3.authHash) {
        console.warn('Fetch missing api token or authHash. Fetch aborted. Token:', r3.token, 'AuthHash:', r3.authHash)
        return
      }

      fetchStarted()

      return fetchAllGQL()
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
        .finally(fetchFinished)
    },
    async localSearch(_, globalState: any) {
      const query = globalState.devices.query
      dispatch.devices.setQuery(query)
    },
    async remoteSearch(_, globalState: any) {
      const query = globalState.devices.query
      dispatch.devices.setDevices([])
      dispatch.devices.setSearching(true)
      dispatch.devices.setSearchPerformed(true)
      return r3.devices
        .search(query)
        .then(devices => {
          dispatch.devices.setDevices(devices)
          dispatch.devices.setSearchPerformed(true)
        })
        .finally(() => dispatch.devices.setSearching(false))
    },
    async toggleSearchOnly(_, state) {
      const searchOnly = !state.devices.searchOnly

      dispatch.devices.setSearchOnly(searchOnly)
      dispatch.devices.setQuery('')
      if (searchOnly) {
        dispatch.devices.setDevices([])
      } else {
        dispatch.devices.setDevices([])
        dispatch.devices.fetch()
      }
    },
    async reset() {
      dispatch.devices.setDevices([])
      dispatch.backend.set({ connections: [] })
      dispatch.devices.setSearchOnly(false)
      dispatch.devices.setQuery('')
      dispatch.devices.changeSort('state')
    },

    destroy(device: IDevice) {
      dispatch.devices.setDestroying(true)
      r3.post(`/developer/device/delete/registered/${device.id}`)
        .then(async () => {
          await dispatch.devices.fetch(false)
          dispatch.devices.setDestroying(false)
        })
        .catch(error => {
          dispatch.devices.setDestroying(false)
          dispatch.backend.set({ cliError: error.message })
          console.warn(error)
        })
    },
  }),
  reducers: {
    setDestroying(state: IDeviceState, destroying: boolean) {
      state.destroying = destroying
    },
    setQuery(state: IDeviceState, query: string) {
      state.query = query
      if (state.searchOnly) {
        state.all = []
        state.searchPerformed = false
      }
    },
    setSearchOnly(state: IDeviceState, searchOnly: boolean) {
      state.searchOnly = searchOnly
      window.localStorage.setItem(SEARCH_ONLY_SETTING_KEY, String(searchOnly))
    },
    fetchStarted(state: IDeviceState) {
      state.fetched = false
      state.fetching = true
    },
    changeSort(state: IDeviceState, sort: SortType) {
      state.sort = sort
      state.all = Device.sort(state.all, sort)
      window.localStorage.setItem(SORT_SETTING_KEY, sort)
    },
    setDevices(state: IDeviceState, devices: IDevice[]) {
      // window.localStorage.setItem('devices', JSON.stringify(devices)) // disabled as we're not reading it
      console.log('DEVICE DATA', devices)
      state.all = Device.sort(devices, state.sort)
    },
    fetchFinished(state: IDeviceState) {
      state.fetched = true
      state.fetching = false
    },
    setSearching(state: IDeviceState, searching: boolean) {
      state.searching = searching
    },
    setSearchPerformed(state: IDeviceState, searchPerformed: boolean) {
      state.searchPerformed = searchPerformed
    },
  },
  selectors: slice => ({
    visible() {
      return slice((state: IDeviceState): IDevice[] => {
        const filtered = filterDevices(state.all, state.query)
        const sorted = Device.sort(filtered, state.sort)
        // console.log('FILTERED:', filtered)
        // console.log('SORTED:', state.sort, sorted)
        return sorted
      })
    },
  }),
})

function filterDevices(devices: IDevice[], query: string) {
  const options = {
    extract: (dev: IDevice) => {
      let matchString = dev.name
      if (dev.services && dev.services.length) matchString += dev.services.map(s => s.name).join('')
      return matchString
    },
  }
  return fuzzy.filter(query, devices, options).map(d => d.original)
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
