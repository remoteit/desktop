import { createModel } from '@rematch/core'
import { graphQLBasicRequest } from '../services/graphQL'
import { graphQLReadNotice } from '../services/graphQLMutation'
import { AxiosResponse } from 'axios'
import { RootModel } from '.'

type IAnnouncementsState = ILookup<IAnnouncement[]> & {
  all: IAnnouncement[]
  presentedThrough?: number
}

const defaultState: IAnnouncementsState = {
  all: [],
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: dispatch => ({
    async fetch() {
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
              read
            }
          }`
      )
      if (response === 'ERROR') return
      const all = await dispatch.announcements.parse(response)
      dispatch.announcements.set({ all })
    },
    async parse(response: AxiosResponse<any> | void): Promise<IAnnouncement[]> {
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
      dispatch.announcements.clearPresentedThrough()
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
    setPresentedThrough(state, modified: number) {
      state.presentedThrough = Math.max(state.presentedThrough || 0, modified)
      return state
    },
    clearPresentedThrough(state) {
      state.presentedThrough = undefined
      return state
    },
    set(state, params: ILookup<IAnnouncement[]>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
