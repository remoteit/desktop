import { createModel } from '@rematch/core'
import { DEFAULT_SERVICE } from '@common/constants'
import { getApplicationType } from '@common/applications'
import { graphQLBasicRequest } from '../services/graphQL'
import { selectActiveAccountId } from '../selectors/accounts'
import { RootModel } from '.'
import { State } from '../store'

type IApplicationTypeState = {
  all: IApplicationType[]
  groups: Pick<IApplicationTypeGroup, 'ids' | 'name'>[]
  account: ILookup<IApplicationType[]>
}

const defaultState: IApplicationTypeState = {
  all: [],
  groups: [{ name: 'HTTP/S', ids: [7, 8] }],
  account: {},
}

const APPLICATION_TYPES_ORDER = [48, 49, 8, 7, 66, 28, 4, 5, 34]

const APPLICATION_TYPES_QUERY = `
  applicationTypes {
    name 
    id
    port
    proxy
    scheme
    protocol
    description
  }`

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
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
      const applicationTypes: IApplicationType[] = result?.data?.data?.login?.account?.applicationTypes
      dispatch.applicationTypes.set({
        account: { ...state.applicationTypes.account, [accountId]: applicationTypes.sort(sortFunction) },
      })
    },
    async fetchAll(_: void) {
      const result = await graphQLBasicRequest(
        ` query ApplicationTypesAll {
            ${APPLICATION_TYPES_QUERY}
          }`
      )
      if (result === 'ERROR') return
      const all = result?.data?.data?.applicationTypes
      all.sort(sortFunction)
      dispatch.applicationTypes.set({ all })
    },
  }),
  reducers: {
    reset(state: IApplicationTypeState) {
      state = { ...defaultState }
      return state
    },
    set(state: IApplicationTypeState, params: Partial<IApplicationTypeState>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

function sortFunction(a: IApplicationType, b: IApplicationType) {
  const indexA = APPLICATION_TYPES_ORDER.indexOf(a.id)
  const indexB = APPLICATION_TYPES_ORDER.indexOf(b.id)

  const rankA = indexA === -1 ? Number.MAX_VALUE : indexA
  const rankB = indexB === -1 ? Number.MAX_VALUE : indexB

  return rankA - rankB
}

// A type the API does not list — or not yet, the list still loading — is itself all the same, never another in its
// place: a form keeps it as it saves, and nothing takes it for a proxied one. The first listed is for no type at all.
export function findType(all?: IApplicationType[], typeId?: number): IApplicationType {
  if (!typeId) return all?.[0] || emptyServiceType
  return (
    all?.find(t => t.id === typeId) || {
      ...emptyServiceType,
      id: typeId,
      name: getApplicationType(typeId).title,
      protocol: typeId >= UDP_TYPES ? 'UDP' : 'TCP',
    }
  )
}

export function getType(all: IApplicationType[], port?: number) {
  const type = all?.find(t => t.port === port)
  return type ? type.id : DEFAULT_SERVICE.typeID
}

export function isReverseProxy(state: State, typeId?: number) {
  if (!typeId) return false
  return findType(state.applicationTypes.all, typeId).proxy
}

// The ids of UDP types have this bit set.
const UDP_TYPES = 0x8000

const emptyServiceType: IApplicationType = {
  id: 1,
  name: '',
  port: 0,
  scheme: '',
  proxy: false,
  protocol: 'TCP',
  description: '',
}
