import { createModel } from '@rematch/core'
import { AxiosResponse } from 'axios'
import { caseFindName } from '../helpers/utilHelper'
import { DESKTOP_EPOCH } from '../shared/constants'
import { eachDevice } from '../helpers/selectedHelper'
import {
  graphQLSetTag,
  graphQLAddTag,
  graphQLRemoveTag,
  graphQLDeleteTag,
  graphQLRenameTag,
} from '../services/graphQLMutation'
import { graphQLBasicRequest } from '../services/graphQL'
import { RootModel } from './rootModel'

type ITagState = {
  all: ITag[]
  processing: [number, number]
  removing?: string
  updating?: string
}

const defaultState: ITagState = {
  all: [
    {
      name: 'Gray',
      color: 1,
      created: DESKTOP_EPOCH,
    },
    {
      name: 'Red',
      color: 2,
      created: DESKTOP_EPOCH,
    },
    {
      name: 'Orange',
      color: 3,
      created: DESKTOP_EPOCH,
    },
    {
      name: 'Yellow',
      color: 4,
      created: DESKTOP_EPOCH,
    },
    {
      name: 'Green',
      color: 5,
      created: DESKTOP_EPOCH,
    },
    {
      name: 'Blue',
      color: 6,
      created: DESKTOP_EPOCH,
    },
    {
      name: 'Purple',
      color: 7,
      created: DESKTOP_EPOCH,
    },
  ],
  processing: [0, 0], // [current, total]
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async fetch(_, globalState) {
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
      const all = await dispatch.tags.parse(result)
      dispatch.tags.setOrdered({ all })
    },
    async parse(result: AxiosResponse<any> | undefined) {
      const all = result?.data?.data?.login?.tags
      const parsed = all
        .map(t => ({ ...t, created: new Date(t.created) }))
        .filter(t => !defaultState.all.find(d => d.name === t.name))
      return defaultState.all.concat(parsed)
    },
    async add({ tag, device }: { tag: ITag; device: IDevice }) {
      const original = { ...device }
      device.tags.push(tag)
      dispatch.accounts.setDevice({ id: device.id, device })
      const result = await graphQLAddTag(device.id, tag.name)
      if (result === 'ERROR') {
        dispatch.accounts.setDevice({ id: device.id, device: original })
      }
    },
    async addSelected({ tag, selected }: { tag: ITag; selected: string[] }, globalState) {
      dispatch.tags.set({ processing: [1, selected.length] })
      eachDevice(globalState, selected, device => {
        device.tags.push(tag)
        dispatch.accounts.setDevice({ id: device.id, device })
        dispatch.tags.set({ processing: [1, selected.length] })
      })
      await graphQLAddTag(selected, tag.name)
      dispatch.tags.set({ processing: [0, 0] })
    },
    async remove({ tag, device }: { tag: ITag; device: IDevice }) {
      const original = { ...device }
      const index = caseFindName(device.tags, tag.name)
      device.tags.splice(index, 1)
      dispatch.accounts.setDevice({ id: device.id, device })
      const result = await graphQLRemoveTag(device.id, tag.name)
      if (result === 'ERROR') {
        dispatch.accounts.setDevice({ id: device.id, device: original })
      }
    },
    async create(tag: ITag, globalState) {
      const tags = globalState.tags.all
      const result = await graphQLSetTag({ name: tag.name, color: tag.color })
      if (result === 'ERROR') return
      dispatch.tags.setOrdered({ all: [...tags, tag] })
    },
    async update(tag: ITag, globalState) {
      const tags = globalState.tags.all
      dispatch.tags.set({ updating: tag.name })
      const result = await graphQLSetTag({ name: tag.name, color: tag.color })
      if (result === 'ERROR') return
      const index = caseFindName(tags, tag.name)
      tags[index] = tag
      dispatch.tags.setOrdered({ all: [...tags] })
      dispatch.tags.set({ updating: undefined })
    },
    async rename({ tag, name }: { tag: ITag; name: string }, globalState) {
      const tags = globalState.tags.all
      dispatch.tags.set({ updating: tag.name })
      const result = await graphQLRenameTag(tag.name, name)
      if (result === 'ERROR') return
      const found = caseFindName(tags, name)
      const index = caseFindName(tags, tag.name)
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
      dispatch.tags.set({ removing: tag.name })
      const result = await graphQLDeleteTag(tag.name)
      if (result === 'ERROR') return
      const index = caseFindName(tags, tag.name)
      tags.splice(index, 1)
      dispatch.tags.setOrdered({ all: [...tags] })
      dispatch.tags.set({ removing: undefined })
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
