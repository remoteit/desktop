import { createModel } from '@rematch/core'
import { DEFAULT_TARGET } from '../shared/constants'
import { graphQLRequest } from '../services/graphQL'
import { RootModel } from './rootModel'
import { apiError } from '../helpers/apiHelper'

type ITagState = ILookup<ITag[]> & {
  all: ITag[]
}

const defaultState: ITagState = {
  all: [
    {
      id: 1001,
      name: 'Gray',
      label: 1,
    },
    {
      id: 1002,
      name: 'Red',
      label: 2,
    },
    {
      id: 1003,
      name: 'Orange',
      label: 3,
    },
    {
      id: 1004,
      name: 'Yellow',
      label: 4,
    },
    {
      id: 1005,
      name: 'Green',
      label: 5,
    },
    {
      id: 1006,
      name: 'Blue',
      label: 6,
    },
    {
      id: 1007,
      name: 'Purple',
      label: 7,
    },
  ],
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: dispatch => ({
    async fetch() {
      try {
        const result = await graphQLRequest(
          ` {
              get tag query
            }`
        )
        // graphQLGetErrors(result)
        // const all = result?.data?.data?.tags
        // dispatch.tags.set({ all })
      } catch (error) {
        await apiError(error)
      }
    },
  }),
  reducers: {
    reset(state: ITagState) {
      state = { ...defaultState }
      return state
    },
    set(state: ITagState, params: ILookup<ITag[]>) {
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
