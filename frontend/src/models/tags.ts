import { createModel } from '@rematch/core'
import { AxiosResponse } from 'axios'
import { eachSelectedDevice } from '../helpers/selectedHelper'
import { getActiveAccountId } from './accounts'
import {
  graphQLSetTag,
  graphQLAddTag,
  graphQLRemoveTag,
  graphQLDeleteTag,
  graphQLRenameTag,
} from '../services/graphQLMutation'
import { graphQLBasicRequest } from '../services/graphQL'
import { ApplicationState } from '../store'
import { findTagIndex } from '../helpers/utilHelper'
import { getNextLabel } from './labels'
import { RootModel } from './rootModel'

type ITagState = {
  all: { [accountId: string]: ITag[] }
  adding?: boolean
  creating?: boolean
  removing?: boolean
  deleting?: string
  updating?: string
}

const defaultState: ITagState = {
  all: {},
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async fetch(_, state) {
      const result = await graphQLBasicRequest(
        ` query($account: String) {
            login {
              account(id: $account) {
                tags {
                  name
                  color
                  created
                }
              }
            }
          }`,
        {
          account: getActiveAccountId(state),
        }
      )
      if (result === 'ERROR') return
      const all = await dispatch.tags.parse(result)
      dispatch.tags.setTags(all)
    },

    async parse(result: AxiosResponse<any> | undefined) {
      const all = result?.data?.data?.login?.account?.tags
      if (!all) return
      const parsed = all.map(t => ({
        name: t.name,
        color: t.color,
        created: new Date(t.created),
      }))
      return parsed
    },

    async add({ tag, device }: { tag: ITag; device: IDevice }) {
      if (!device) return
      const original = { ...device }
      device.tags.push(tag)
      dispatch.accounts.setDevice({ id: device.id, device })
      const result = await graphQLAddTag(device.id, tag.name)
      if (result === 'ERROR') {
        dispatch.accounts.setDevice({ id: device.id, device: original })
      }
    },

    async addSelected({ tag, selected }: { tag: ITag; selected: IDevice['id'][] }, state) {
      dispatch.tags.set({ adding: true })
      eachSelectedDevice(state, selected, device => {
        device.tags.push(tag)
        dispatch.accounts.setDevice({ id: device.id, device })
      })
      const result = await graphQLAddTag(selected, tag.name)
      if (result !== 'ERROR')
        dispatch.ui.set({
          successMessage: `${tag.name} added to ${selected.length} device${selected.length > 1 ? 's' : ''}.`,
        })
      dispatch.tags.set({ adding: false })
    },

    async remove({ tag, device }: { tag: ITag; device: IDevice }) {
      const original = { ...device }
      const index = findTagIndex(device.tags, tag.name)
      device.tags.splice(index, 1)
      dispatch.accounts.setDevice({ id: device.id, device })
      const result = await graphQLRemoveTag(device.id, tag.name)
      if (result === 'ERROR') {
        dispatch.accounts.setDevice({ id: device.id, device: original })
      }
    },

    async removeSelected({ tag, selected }: { tag: ITag; selected: IDevice['id'][] }, state) {
      let count = 0
      dispatch.tags.set({ removing: true })
      eachSelectedDevice(state, selected, device => {
        const index = findTagIndex(device.tags, tag.name)
        if (index >= 0) {
          count++
          device.tags.splice(index, 1)
          dispatch.accounts.setDevice({ id: device.id, device })
        }
      })
      const result = await graphQLRemoveTag(selected, tag.name)
      if (result !== 'ERROR')
        dispatch.ui.set({
          successMessage: `${tag.name} removed from ${count} device${count > 1 ? 's' : ''}.`,
        })
      dispatch.tags.set({ removing: false })
    },

    async create(tag: ITag, state) {
      const tags = selectTags(state)
      dispatch.tags.set({ creating: true })
      tag.color = tag.color || getNextLabel(state)
      const result = await graphQLSetTag({ name: tag.name, color: tag.color })
      if (result === 'ERROR') return
      dispatch.tags.setTags([...tags, tag])
      dispatch.tags.set({ creating: false })
    },

    async update(tag: ITag, state) {
      const tags = selectTags(state)
      dispatch.tags.set({ updating: tag.name })
      const result = await graphQLSetTag({ name: tag.name, color: tag.color })
      if (result === 'ERROR') return
      const index = findTagIndex(tags, tag.name)
      tags[index] = tag
      dispatch.tags.setTags(tags)
      dispatch.tags.set({ updating: undefined })
    },

    async rename({ tag, name }: { tag: ITag; name: string }, state) {
      const tags = selectTags(state)
      dispatch.tags.set({ updating: tag.name })
      const result = await graphQLRenameTag(tag.name, name)
      if (result === 'ERROR') return
      const found = findTagIndex(tags, name)
      const index = findTagIndex(tags, tag.name)
      if (found >= 0) {
        tags.splice(index, 1)
        dispatch.ui.set({ noticeMessage: `Tag merged into existing tag ‘${name}.’` })
      } else {
        tags[index].name = name
      }
      dispatch.tags.setTags(tags)
      dispatch.tags.set({ updating: undefined })
      dispatch.devices.fetch()
    },

    async delete(tag: ITag, state) {
      const tags = selectTags(state)
      dispatch.tags.set({ deleting: tag.name })
      const result = await graphQLDeleteTag(tag.name)
      if (result === 'ERROR') return
      const index = findTagIndex(tags, tag.name)
      tags.splice(index, 1)
      dispatch.tags.setTags(tags)
      dispatch.tags.set({ deleting: undefined })
      dispatch.devices.fetch()
    },
    async setTags(tags: ITag[], state) {
      const accountId = getActiveAccountId(state)
      tags = tags.sort((a, b) => (b.created?.getTime() || 0) - (a.created?.getTime() || 0))
      let all = { ...state.tags.all }
      all[accountId] = tags
      dispatch.tags.set({ all })
    },
  }),
  reducers: {
    reset(state: ITagState) {
      state = { ...defaultState }
      return state
    },
    set(state: ITagState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

export function selectTags(state: ApplicationState) {
  const accountId = getActiveAccountId(state)
  return state.tags.all[accountId] || []
}
