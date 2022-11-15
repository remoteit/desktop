import { createModel } from '@rematch/core'
import { DEFAULT_SERVICE } from '../shared/constants'
import { graphQLBasicRequest } from '../services/graphQL'
import { ApplicationState } from '../store'
import { RootModel } from '.'

type IApplicationTypeState = {
  all: IApplicationType[]
}

const state: IApplicationTypeState = {
  all: [],
}

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async fetch() {
      const result = await graphQLBasicRequest(
        ` {
            applicationTypes {
              name
              id
              port
              proxy
              scheme
              protocol
              description
            }
          }`
      )
      if (result === 'ERROR') return
      const all = result?.data?.data?.applicationTypes
      dispatch.applicationTypes.set({ all })
    },
  }),
  reducers: {
    set(state: IApplicationTypeState, params: ILookup<IApplicationType[]>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

export function findType(all: IApplicationType[], typeId?: number) {
  return all.find(t => t.id === typeId) || all[0] || emptyServiceType
}

export function getType(all: IApplicationType[], port?: number) {
  const type = all?.find(t => t.port === port)
  return type ? type.id : DEFAULT_SERVICE.typeID
}

export function selectUniqueSchemeTypes(state: ApplicationState) {
  let schemes: string[] = []
  return state.applicationTypes.all.filter(t => {
    if (schemes.includes(t.scheme)) return false
    schemes.push(t.scheme)
    return true
  })
}

export function canUseConnectLink(state: ApplicationState, typeId?: number) {
  if (!typeId) return false
  const applicationType = findType(state.applicationTypes.all, typeId)
  return applicationType.proxy
}

const emptyServiceType = {
  id: 1,
  name: '',
  port: null,
  proxy: false,
  protocol: 'TCP',
  description: '',
}
