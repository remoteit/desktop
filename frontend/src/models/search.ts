import { createModel } from '@rematch/core'
import { getDeviceModel } from './accounts'
import { ApplicationState } from '../store'
import { removeDeviceName } from '../shared/nameHelper'
import { graphQLRequest, graphQLGetErrors, apiError } from '../services/graphQL'
import { getAllDevices, getActiveAccountId, getAccountIds } from './accounts'
import { RootModel } from './rootModel'

type ISearchState = ILookup<any> & {
  search: ISearch[]
  devices: ISearch[]
  fetching: boolean
  cloudSearch: boolean
}

const searchState: ISearchState = {
  search: [],
  devices: [],
  fetching: false,
  cloudSearch: true,
}

export default createModel<RootModel>()({
  state: searchState,
  effects: dispatch => ({
    async updateSearch(_, state) {
      const { total, size } = getDeviceModel(state)
      const { membership: member } = state.accounts

      dispatch.search.set({ cloudSearch: total > size || member.length })

      const devices = await dispatch.search.parseDevices()
      await dispatch.search.set({ devices })
    },
    async fetch(name: string, state) {
      if (!state.auth.user) return
      if (!state.search.cloudSearch) return

      dispatch.search.set({ fetching: true })

      const ids: string[] = getAccountIds(state)
      const searchState = 'active'
      const size = Math.max(4 - ids.length, 0) + 3
      const accountQueries = ids.map(
        (id, index) => `
        _${index}: account(id: "${id}") {
          devices(size: $size, state: $state, name: $name) {
            total
            items {
              id
              name
              platform
              owner {
                email
              }
              services(state: $state) {
                name
                id
              }
            }
          }
        }`
      )
      try {
        const response = await graphQLRequest(
          ` query ($size: Int, $state: String, $name: String) {
              login {
                ${accountQueries.join('\n')}
              }
            }`,
          {
            size,
            state: searchState,
            name,
          }
        )
        graphQLGetErrors(response)
        const search = await dispatch.search.parse({ response, ids })
        await dispatch.search.set({ search })
      } catch (error) {
        await apiError(error)
      }

      dispatch.search.set({ fetching: false })
    },
    async parse({ response, ids }: { response: any; ids: string[] }): Promise<ISearch[]> {
      const data = response?.data?.data?.login
      return ids
        .map((id, index) => {
          const devices = data[`_${index}`].devices.items
          return devices
            .map(device =>
              device.services.map(service => ({
                deviceName: device.name,
                serviceName: removeDeviceName(device.name, service.name),
                deviceId: device.id,
                serviceId: service.id,
                ownerEmail: device.owner.email,
                targetPlatform: device.platform,
                offline: service.state === 'inactive',
              }))
            )
            .flat()
        })
        .flat()
    },
    async parseDevices(_, state): Promise<ISearch[]> {
      const id = getActiveAccountId(state)
      if (!id) return []
      return getAllDevices(state)
        .filter(d => !d.hidden)
        .map(device =>
          device.services
            .map(service => ({
              deviceName: device.name,
              serviceName: service.name,
              deviceId: device.id,
              serviceId: service.id,
              ownerEmail: device.owner.email,
              targetPlatform: device.targetPlatform,
              offline: service.state === 'inactive',
            }))
            .flat()
        )
        .flat()
    },
  }),

  reducers: {
    reset(state) {
      state = searchState
      return state
    },
    set(state, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

export function selectAllSearch(state: ApplicationState) {
  const { search, devices } = state.search
  const searchIds = search.map(s => s.serviceId)
  const all = search.concat(devices.filter(item => !searchIds.includes(item.serviceId)))
  const sorted = all.sort((a, b) => {
    if (a.deviceName.toLowerCase() > b.deviceName.toLowerCase()) return 1
    if (a.deviceName.toLowerCase() < b.deviceName.toLowerCase()) return -1
    return 0
  })
  return sorted || []
}
