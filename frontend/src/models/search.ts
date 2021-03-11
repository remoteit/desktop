import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import { graphQLRequest, graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { getAllDevices, getActiveAccount } from './accounts'
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
    async updateSearch(_, rootState) {
      const { total, size } = rootState.devices
      const { member } = rootState.accounts

      dispatch.search.set({ cloudSearch: total > size || member.length })

      const devices = await dispatch.search.parseDevices()
      await dispatch.search.set({ devices })
    },
    async fetch(name: string, rootState) {
      if (!rootState.auth.user) return
      if (!rootState.search.cloudSearch) return

      dispatch.search.set({ fetching: true })

      const accounts: IUser[] = [rootState.auth.user, ...rootState.accounts.member]
      const state = 'active'
      const size = Math.max(4 - accounts.length, 0) + 3
      const accountQueries = accounts.map(
        (account, index) => `
        _${index}: account(id: "${account.id}") {
          devices(size: $size, state: $state, name: $name) {
            total
            items {
              id
              name
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
            state,
            name,
          }
        )
        graphQLGetErrors(response)
        const search = await dispatch.search.parse({ response, accounts })
        await dispatch.search.set({ search })
      } catch (error) {
        await graphQLCatchError(error)
      }

      dispatch.search.set({ fetching: false })
    },
    async parse({ response, accounts }: { response: any; accounts: IUser[] }): Promise<ISearch[]> {
      const data = response?.data?.data?.login
      return accounts
        .map((account, index) => {
          const devices = data[`_${index}`].devices.items
          return devices
            .map(device =>
              device.services.map(service => ({
                deviceName: device.name,
                serviceName: service.name,
                deviceId: device.id,
                serviceId: service.id,
                accountEmail: account.email,
              }))
            )
            .flat()
        })
        .flat()
    },
    async parseDevices(_, rootState): Promise<ISearch[]> {
      const account = getActiveAccount(rootState)
      if (!account) return []
      return getAllDevices(rootState)
        .filter(d => !d.hidden)
        .map(device =>
          device.services
            .filter(service => service.state === 'active')
            .map(service => ({
              deviceName: device.name,
              serviceName: service.name,
              deviceId: device.id,
              serviceId: service.id,
              accountEmail: account.email,
            }))
            .flat()
        )
        .flat()
    },
  }),

  reducers: {
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
  return all.sort((a, b) => {
    if (a.deviceName.toLowerCase() > b.deviceName.toLowerCase()) return 1
    if (a.deviceName.toLowerCase() < b.deviceName.toLowerCase()) return -1
    return 0
  })
}
