import { createModel } from '@rematch/core'
import { graphQLRequest, graphQLGetErrors, apiError } from '../services/graphQL'
import { graphQLReadNotice } from '../services/graphQLMutation'
import { AxiosResponse } from 'axios'
import { RootModel } from '.'

type IAnnouncementsState = ILookup<IAnnouncement[]> & {
  all: IAnnouncement[]
}

const defaultState: IAnnouncementsState = {
  all: [],
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: dispatch => ({
    async fetch() {
      try {
        const response = await graphQLRequest(
          ` query Announcements {
              notices {
                id
                title
                body
                image
                link
                type
                modified
                read
              }
            }`
        )
        graphQLGetErrors(response)
        const all = await dispatch.announcements.parse(response)
        dispatch.announcements.set({ all })
      } catch (error) {
        await apiError(error)
      }
    },
    async parse(response: AxiosResponse<any> | void, globalState): Promise<IAnnouncement[]> {
      if (!response) return []
      const all = response?.data?.data?.notices
      if (!all) return []
      console.log('ANNOUNCEMENTS', all)
      return all.map(n => ({
        id: n.id,
        title: n.title,
        body: n.body,
        image: n.image,
        link: n.link,
        type: n.type,
        modified: new Date(n.modified),
        read: n.read ? new Date(n.read) : undefined,
      }))
    },
    async read(id: string, state) {
      console.log('ANNOUNCEMENT READ', id)
      await graphQLReadNotice(id)
      dispatch.announcements.setRead(id)
    },
  }),
  reducers: {
    reset(state: IAnnouncementsState) {
      state = { ...defaultState }
      return state
    },
    setRead(state, id: string) {
      state.all.find((a, i) => {
        if (a.id === id) {
          state.all[i].read = new Date()
          return true
        }
        return false
      })
      return state
    },
    set(state, params: ILookup<IAnnouncement[]>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
