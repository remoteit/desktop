import { createModel } from '@rematch/core'
import { AxiosResponse } from 'axios'
import { eachSelectedDevice } from '../helpers/selectedHelper'
import {
  graphQLSetTag,
  graphQLAddTag,
  graphQLRemoveTag,
  graphQLDeleteTag,
  graphQLRenameTag,
} from '../services/graphQLMutation'
import { findTagIndex, mergeTags } from '../helpers/utilHelper'
import { graphQLBasicRequest } from '../services/graphQL'
import { getNextLabel } from './labels'
import { RootModel } from './rootModel'

type ITagState = {
  all: ITag[]
  legacy: ITag[]
  adding?: boolean
  removing?: boolean
  deleting?: string
  updating?: string
}

const defaultState: ITagState = {
  all: [],
  legacy: [],
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async fetch(_, globalState) {
      const { legacy } = globalState.tags
      const result = await graphQLBasicRequest(
        ` query {
            login {
              tags {
                name
                color
                created
              }
            }
          }`
      )
      if (result === 'ERROR') return
      const parsed = await dispatch.tags.parse(result)
      const all = mergeTags(legacy, parsed)
      dispatch.tags.setOrdered({ all })
    },

    async parse(result: AxiosResponse<any> | undefined, globalState) {
      const all = result?.data?.data?.login?.tags
      const parsed = all.map(t => ({
        name: t.name,
        color: t.color,
        created: new Date(t.created),
      }))
      return parsed
    },
    // async migrate(_, globalState) {

    //     TODO
    //       if we want to migrate colors in desktop this will have to be run on every query

    // import { labelLookup } from './labels'
    // import { DESKTOP_EPOCH } from '../shared/constants'
    // import { eachDevice } from './devices'

    //     remove color from device
    //         device.attributes = { ...device.attributes, color }
    //         devices.setAttributes(device)
    //     add color as tag
    //     add tag to device

    //   eachDevice(globalState, device => {
    //     if (device.attributes.color) {
    //       const label = labelLookup[device.attributes.color]
    //       const tag = { name: label.name, color: label.id, created: DESKTOP_EPOCH }
    //       tags.push(tag)
    //       store.dispatch.tags.migrateLegacy({ tag, deviceId: response.id })
    //     }
    //   })

    //   const { all, legacy } = globalState.tags
    //   const found = findTagIndex(all.concat(legacy), tag.name)
    //   if (found >= 0) return
    //   legacy.push(tag)
    //   dispatch.tags.set({ legacy })
    //   dispatch.tags.setOrdered({ all: [...all, tag] })
    // },

    async add({ tag, device }: { tag: ITag; device: IDevice }) {
      const original = { ...device }
      device.tags.push(tag)
      dispatch.accounts.setDevice({ id: device.id, device })
      const result = await graphQLAddTag(device.id, tag.name)
      if (result === 'ERROR') {
        dispatch.accounts.setDevice({ id: device.id, device: original })
      }
    },

    async addSelected({ tag, selected }: { tag: ITag; selected: IDevice['id'][] }, globalState) {
      dispatch.tags.set({ adding: true })
      eachSelectedDevice(globalState, selected, device => {
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

    async removeSelected({ tag, selected }: { tag: ITag; selected: IDevice['id'][] }, globalState) {
      let count = 0
      dispatch.tags.set({ removing: true })
      eachSelectedDevice(globalState, selected, device => {
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

    async create(tag: ITag, globalState) {
      const tags = globalState.tags.all
      tag.color = tag.color || getNextLabel(globalState)
      const result = await graphQLSetTag({ name: tag.name, color: tag.color })
      if (result === 'ERROR') return
      dispatch.tags.setOrdered({ all: [...tags, tag] })
    },

    async update(tag: ITag, globalState) {
      const tags = globalState.tags.all
      dispatch.tags.set({ updating: tag.name })
      const result = await graphQLSetTag({ name: tag.name, color: tag.color })
      if (result === 'ERROR') return
      const index = findTagIndex(tags, tag.name)
      tags[index] = tag
      dispatch.tags.setOrdered({ all: [...tags] })
      dispatch.tags.set({ updating: undefined })
    },

    async rename({ tag, name }: { tag: ITag; name: string }, globalState) {
      const tags = globalState.tags.all
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
      dispatch.tags.setOrdered({ all: [...tags] })
      dispatch.tags.set({ updating: undefined })
      dispatch.devices.fetch()
    },

    async delete(tag: ITag, globalState) {
      const tags = globalState.tags.all
      dispatch.tags.set({ deleting: tag.name })
      const result = await graphQLDeleteTag(tag.name)
      if (result === 'ERROR') return
      const index = findTagIndex(tags, tag.name)
      tags.splice(index, 1)
      dispatch.tags.setOrdered({ all: [...tags] })
      dispatch.tags.set({ deleting: undefined })
      dispatch.devices.fetch()
    },
  }),
  reducers: {
    reset(state: ITagState) {
      state = { ...defaultState }
      return state
    },
    setOrdered(state: ITagState, params: ILookup<any>) {
      Object.keys(params).forEach(
        key => (state[key] = params[key].sort((a, b) => (b.created?.getTime() || 0) - (a.created?.getTime() || 0)))
      )
      return state
    },
    set(state: ITagState, params: ILookup<any>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
