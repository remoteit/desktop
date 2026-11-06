import { createModel } from '@rematch/core'
import { graphQLBasicRequest } from '../services/graphQL'
import { graphQLReadNotice } from '../services/graphQLMutation'
import { AxiosResponse } from 'axios'
import { RootModel } from '.'
import { store } from '../store'

type IAnnouncementsState = ILookup<IAnnouncement[]> & {
  all: IAnnouncement[]
}

const defaultState: IAnnouncementsState = {
  all: [],
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: dispatch => ({
    async fetch(_: void, state) {
      const userId = state.auth.user?.id
      const response = await graphQLBasicRequest(
        ` query Announcements {
            notices {
              id
              title
              body
              image
              link
              type
              modified
              from
              until
              read
            }
          }`
      )
      if (response === 'ERROR' || store.getState().auth.user?.id !== userId) return
      const all = await dispatch.announcements.parse(response)
      dispatch.announcements.set({ all })
      dispatch.ui.set({ announcementsFetched: true })
    },
    async parse(response: AxiosResponse<any>): Promise<IAnnouncement[]> {
      const all = response.data?.data?.notices
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
        from: n.from ? new Date(n.from) : undefined,
        until: n.until ? new Date(n.until) : undefined,
        read: n.read ? new Date(n.read) : undefined,
      }))
    },
    async read(id: string) {
      console.log('ANNOUNCEMENT READ', id)
      const response = await graphQLReadNotice(id)
      if (response !== 'ERROR') dispatch.announcements.setRead({ id, value: true })
    },
    async clearRead(_: void, state) {
      const read = state.announcements.all.filter(announcement => announcement.read)
      const results = await Promise.all(
        read.map(async announcement => ({ id: announcement.id, response: await graphQLReadNotice(announcement.id, false) }))
      )

      results.forEach(({ id, response }) => {
        if (response !== 'ERROR') dispatch.announcements.setRead({ id, value: false })
      })
    },
  }),
  reducers: {
    reset(state: IAnnouncementsState) {
      state = { ...defaultState }
      return state
    },
    setRead(state, { id, value }: { id: string; value: boolean }) {
      state.all.find((a, i) => {
        if (a.id === id) {
          state.all[i].read = value ? new Date() : undefined
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
