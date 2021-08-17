import { createModel } from '@rematch/core'
import { DEFAULT_TARGET } from '../shared/constants'
import { graphQLRequest, graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { RootModel } from './rootModel'

type IApplicationTypeState = ILookup<IApplicationType[]> & {
  all: IApplicationType[]
}

const state: IApplicationTypeState = {
  all: [],
}

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async fetch() {
      try {
        const result = await graphQLRequest(
          ` {
              applicationTypes {
                name
                id
                port
                proxy
                protocol
                description
              }
            }`
        )
        graphQLGetErrors(result)
        const all = result?.data?.data?.applicationTypes
        dispatch.applicationTypes.set({ all })
      } catch (error) {
        await graphQLCatchError(error)
      }
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

export function getTypeId(all: IApplicationType[], port: number) {
  const type = all.find(t => t.port === port)
  return type ? type.id : DEFAULT_TARGET.type
}

const emptyServiceType = {
  id: 1,
  name: '',
  port: null,
  proxy: false,
  protocol: 'TCP',
  description: '',
}
