import { createModel } from '@rematch/core'
import { graphQLAllNotices } from '../services/graphQLRequest'
import { graphQLCreateNotice, graphQLDeleteNotice, graphQLUpdateNotice } from '../services/graphQLMutation'
import type { RootModel } from '.'

type AdminNoticesState = {
  notices: IAdminNotice[]
  loading: boolean
  saving: boolean
  initialized: boolean
}

const defaultState: AdminNoticesState = {
  notices: [],
  loading: false,
  saving: false,
  initialized: false,
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: dispatch => ({
    async fetch() {
      dispatch.adminNotices.set({ loading: true })
      const response = await graphQLAllNotices()
      if (response === 'ERROR') {
        dispatch.adminNotices.set({ loading: false })
        return
      }
      const notices = parse(response?.data?.data?.allNotices)
      dispatch.adminNotices.set({ notices, loading: false, initialized: true })
    },

    async create(notice: INoticeInput) {
      dispatch.adminNotices.set({ saving: true })
      const response = await graphQLCreateNotice(notice)
      dispatch.adminNotices.set({ saving: false })
      if (response === 'ERROR') return false
      await dispatch.adminNotices.fetch()
      return true
    },

    async update(params: { id: string; notice: INoticeInput }) {
      dispatch.adminNotices.set({ saving: true })
      const response = await graphQLUpdateNotice(params.id, params.notice)
      dispatch.adminNotices.set({ saving: false })
      if (response === 'ERROR') return false
      await dispatch.adminNotices.fetch()
      return true
    },

    async remove(id: string) {
      dispatch.adminNotices.set({ saving: true })
      const response = await graphQLDeleteNotice(id)
      dispatch.adminNotices.set({ saving: false })
      if (response === 'ERROR') return false
      await dispatch.adminNotices.fetch()
      return true
    },
  }),
  reducers: {
    reset() {
      return { ...defaultState }
    },
    set(state, params: Partial<AdminNoticesState>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

function parse(all?: any[]): IAdminNotice[] {
  if (!all) return []
  return all.map(n => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body || '',
    preview: n.preview || undefined,
    image: n.image || undefined,
    link: n.link || undefined,
    stage: n.stage || undefined,
    language: n.language || undefined,
    enabled: !!n.enabled,
    from: n.from ? new Date(n.from) : undefined,
    until: n.until ? new Date(n.until) : undefined,
    modified: n.modified ? new Date(n.modified) : undefined,
  }))
}
