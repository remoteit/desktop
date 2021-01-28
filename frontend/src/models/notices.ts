import { createModel } from '@rematch/core'
import { graphQLBasicRequest } from '../services/graphQL'
import { AxiosResponse } from 'axios'
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

const noticesState: INotificationsState = {
  all: [],
}

export default createModel<RootModel>()({
  state: noticesState,
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
      dispatch.notices.set({ all })
    },
    async parse(result: AxiosResponse<any> | undefined, state) {
      console.log('NOTICES RESULT', result, state)
      const all = result?.data?.data?.notices as INotice[]
      console.log('NOTICES', all)
      return all || []
    },
    async read(id: string) {
      //
    },
  }),
  reducers: {
    set(state: INotificationsState, params: ILookup<INotice[]>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
