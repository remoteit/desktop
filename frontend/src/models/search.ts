import { createModel } from '@rematch/core'
import { getDeviceModel } from './accounts'
import { ApplicationState } from '../store'
import { removeDeviceName } from '../shared/nameHelper'
import { graphQLBasicRequest } from '../services/graphQL'
import { getAccountIds } from './accounts'
import { RootModel } from '.'

type ISearchState = ILookup<any> & {
  search: ISearch[]
  fetching: boolean
  cloudSearch: boolean
}

const searchState: ISearchState = {
  search: [],
  fetching: false,
  cloudSearch: true,
}

export default createModel<RootModel>()({
  state: searchState,
  effects: dispatch => ({
    async updateSearch(_: void, state) {
      const { total, size } = getDeviceModel(state)
      const { membership: member } = state.accounts

      dispatch.search.set({ cloudSearch: total > size || member.length })
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
          id
          devices(size: $size, state: $state, name: $name) {
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
          networks {
            id
            name
            connections {
              name
              service {
                name
                id
              }
            }
            owner {
              email
            }
          }
        }`
      )

      const response = await graphQLBasicRequest(
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

      if (response === 'ERROR') return
      const search = await dispatch.search.parse({ response, ids })
      await dispatch.search.set({ search })
      dispatch.search.set({ fetching: false })
    },

    async parse({ response, ids }: { response: any; ids: string[] }): Promise<ISearch[]> {
      const data = response?.data?.data?.login
      const all = ids
        .map((id, index) => {
          const accountId = data[`_${index}`].id
          const devices = data[`_${index}`].devices.items
          const networks = data[`_${index}`].networks
          const parsedDevices = devices.map(device =>
            device.services.map(service => {
              const serviceName = removeDeviceName(device.name, service.name)
              return {
                accountId,
                serviceName,
                nodeId: device.id,
                nodeName: device.name,
                nodeType: 'DEVICE',
                combinedName: serviceName + ' ' + device.name,
                serviceId: service.id,
                ownerEmail: device.owner.email,
                targetPlatform: device.platform,
              }
            })
          )

          const parsedNetworks = networks.map(network =>
            network.connections.map(connection => {
              const service = connection.service
              return {
                accountId,
                serviceName: connection.name || service.name,
                nodeId: network.id,
                nodeName: network.name,
                nodeType: 'NETWORK',
                combinedName: service.name + ' ' + network.name + ' ' + connection.name,
                serviceId: service.id,
                ownerEmail: network.owner.email,
                targetPlatform: undefined,
              }
            })
          )

          return parsedDevices.concat(parsedNetworks).flat()
        })
        .flat()

      // remove duplicates
      const result = all.filter(
        (item, index) => all.findIndex(({ combinedName }) => combinedName === item.combinedName) === index
      )

      console.log('search result', result)
      return result
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

export function selectAllSearch(state: ApplicationState): ISearch[] {
  const { search } = state.search
  const sorted = search.sort((a, b) => {
    if (a.nodeName.toLowerCase() > b.nodeName.toLowerCase()) return 1
    if (a.nodeName.toLowerCase() < b.nodeName.toLowerCase()) return -1
    return 0
  })
  return sorted || []
}
