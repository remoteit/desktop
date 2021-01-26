import { createModel } from '@rematch/core'
import { graphQLBasicRequest } from '../services/graphQL'
import { RootModel } from './rootModel'

type INotificationsState = ILookup<INotice[]> & {
  all: INotice[]
}

type INotice = {
  id: string
  type: INoticeType
  stage: string
  title: string
  preview: string
  body: string
  modified: Date
  enabled: boolean
  read: Date
  from: Date
  until: Date
}

type INoticeType = 'GENERIC' | 'SYSTEM' | 'RELEASE' | 'COMMUNICATION'

const state: INotificationsState = {
  all: [],
}

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async fetch() {
      const result = await graphQLBasicRequest(
        ` {
              notices {
                id
                type
                stage
                title
                preview
                body
                modified
                enabled
                read
                from
                until
              }
            }`
      )
      const all = await dispatch.notices.parse(result)
      dispatch.applicationTypes.set({ all })
    },
    async parse(result: any) {
      const all = result?.data?.data?.notices
    },
  }),
  reducers: {
    set(state: INotificationsState, params: ILookup<INotice[]>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
