import { createModel } from '@rematch/core'
import { graphQLRequest, graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { RootModel } from './rootModel'

type ISearchState = ILookup<any> & {
  all: ISearch[]
  fetching: boolean
}

const searchState: ISearchState = {
  all: [],
  fetching: false,
}

export default createModel<RootModel>()({
  state: searchState,
  effects: dispatch => ({
    async fetch(name: string, rootState) {
      if (!rootState.auth.user) return
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
        const all = await dispatch.search.parse({ response, accounts })
        await dispatch.search.set({ all })
      } catch (error) {
        await graphQLCatchError(error)
      }

      dispatch.search.set({ fetching: false })
    },
    async parse({ response, accounts }: { response: any; accounts: IUser[] }): Promise<ISearch[]> {
      const data = response?.data?.data?.login
      let items: ISearch[] = accounts
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

      return items.sort((a, b) => {
        if (a.deviceName.toLowerCase() > b.deviceName.toLowerCase()) return 1
        if (a.deviceName.toLowerCase() < b.deviceName.toLowerCase()) return -1
        return 0
      })
    },
  }),
  reducers: {
    set(state, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
