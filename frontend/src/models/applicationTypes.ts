import { createModel } from '@rematch/core'
import { DEFAULT_SERVICE } from '@common/constants'
import { graphQLBasicRequest } from '../services/graphQL'
import { selectActiveAccountId } from '../selectors/accounts'
import { ApplicationState } from '../store'
import { RootModel } from '.'

type IApplicationTypeState = {
  all: IApplicationType[]
}

const state: IApplicationTypeState = {
  all: [],
}

const APPLICATION_TYPES_QUERY = `
  applicationTypes {
    name
    id
    port
    proxy
    scheme
    protocol
    description
  }
`

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async init() {
      const result = await graphQLBasicRequest(
        ` query ApplicationTypesAll {
            ${APPLICATION_TYPES_QUERY}
          }`
      )
      if (result === 'ERROR') return
      const all = result?.data?.data?.applicationTypes
      dispatch.applicationTypes.set({ all })
    },
    async fetch(_: void, state) {
      const accountId = selectActiveAccountId(state)
      const result = await graphQLBasicRequest(
        ` query ApplicationTypes($accountId: String) {
            login {
              account(id: $accountId) {
                ${APPLICATION_TYPES_QUERY}
              }
            }
          }`,
        { accountId }
      )
      if (result === 'ERROR') return
      const applicationTypes = result?.data?.data?.login?.account?.applicationTypes
      dispatch.applicationTypes.set({ [accountId]: applicationTypes })
    },
  }),
  reducers: {
    set(state: IApplicationTypeState, params: ILookup<IApplicationType[]>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

export function findType(all?: IApplicationType[], typeId?: number): IApplicationType {
  return all?.find(t => t.id === typeId) || all?.[0] || emptyServiceType
}

export function getType(all: IApplicationType[], port?: number) {
  const type = all?.find(t => t.port === port)
  return type ? type.id : DEFAULT_SERVICE.typeID
}

export function isReverseProxy(state: ApplicationState, typeId?: number) {
  if (!typeId) return false
  const applicationType = findType(state.applicationTypes.all, typeId)
  return applicationType?.proxy
}

const emptyServiceType: IApplicationType = {
  id: 1,
  name: '',
  port: 0,
  scheme: '',
  proxy: false,
  protocol: 'TCP',
  description: '',
}
