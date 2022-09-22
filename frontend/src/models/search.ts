import { createModel } from '@rematch/core'
import { getDeviceModel } from './accounts'
import { ApplicationState } from '../store'
import { removeDeviceName } from '../shared/nameHelper'
import { graphQLBasicRequest } from '../services/graphQL'
import { getActiveAccountId } from './accounts'
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
  state: { ...searchState },
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

      const id = getActiveAccountId(state)
      const size = 5
      const accountQuery = `
        account(id: $id) {
          id
          devices(size: $size, name: $name) {
            items {
              id
              name
              platform
              owner {
                email
              }
              services {
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

      const response = await graphQLBasicRequest(
        ` query Search($id: String, $size: Int, $name: String) {
              login {
                ${accountQuery}
              }
            }`,
        {
          id,
          size,
          name,
        }
      )

      if (response === 'ERROR') return
      const search = await dispatch.search.parse({ response, id })
      await dispatch.search.set({ search })
      dispatch.search.set({ fetching: false })
    },

    async parse({ response, id }: { response: any; id: string }): Promise<ISearch[]> {
      const data = response?.data?.data?.login?.account

      const accountId = data.id
      const devices = data.devices.items
      const networks = data.networks
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

      const all = parsedNetworks.concat(parsedDevices).flat()

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
      state = { ...searchState }
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
