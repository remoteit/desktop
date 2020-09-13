import { createModel } from '@rematch/core'
import { DEFAULT_TARGET } from '../shared/constants'
import { graphQLRequest, graphQLGetErrors, graphQLHandleError } from '../services/graphQL'

type IApplicationTypeState = ILookup & {
  all: IApplicationType[]
}

const state: IApplicationTypeState = {
  all: [],
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async fetch() {
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
      console.log('APPLICATION TYPES', result)
      dispatch.applicationTypes.set({ all: result.data.data.applicationTypes })
    },
  }),
  reducers: {
    set(state: IApplicationTypeState, params: ILookup) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
    },
  },
})

export function findType(all: IApplicationType[], typeId?: number) {
  return all.find(t => t.id === typeId) || emptyServiceType
}

export function getTypeId(all: IApplicationType[], port: number) {
  const type = all.find(t => t.port === port)
  return type ? type.id : DEFAULT_TARGET.type
}

const emptyServiceType = {
  id: 0,
  name: '',
  port: 0,
  proxy: false,
  protocol: 'TCP',
  description: '',
}
