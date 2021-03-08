import { createModel } from '@rematch/core'
import { ApplicationState } from '../store'
import { graphQLRequest, graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { AxiosResponse } from 'axios'
import { RootModel } from './rootModel'

type ISearchState = ILookup<ISearch[]> & {
  all: ISearch[]
}

const searchState: ISearchState = {
  all: [],
}

export default createModel<RootModel>()({
  state: searchState,
  effects: dispatch => ({
    async fetch(name: string, rootState) {
      if (!rootState.auth.user) return

      const size = 5
      const state = 'active'
      const accounts: IUser[] = [rootState.auth.user, ...rootState.accounts.member]
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
        dispatch.search.set({ all })
      } catch (error) {
        await graphQLCatchError(error)
      }
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
    set(state, params: ILookup<ISearch[]>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

// export function selectAnnouncements(state: ApplicationState, unread?: boolean) {
//   return state.announcements.all.filter(a => !unread || !a.read)
// }
