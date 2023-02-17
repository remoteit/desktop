import structuredClone from '@ungap/structured-clone'
import { createModel } from '@rematch/core'
import { AxiosResponse } from 'axios'
import { eachSelectedDevice } from '../helpers/selectedHelper'
import { getActiveAccountId } from '../selectors/accounts'
import { selectPermissions } from './organization'
import { selectTags } from '../selectors/tags'
import {
  graphQLSetTag,
  graphQLAddDeviceTag,
  graphQLAddNetworkTag,
  graphQLRemoveDeviceTag,
  graphQLRemoveNetworkTag,
  graphQLDeleteTag,
  graphQLRenameTag,
  graphQLMergeTag,
} from '../services/graphQLMutation'
import { graphQLBasicRequest } from '../services/graphQL'
import { ApplicationState } from '../store'
import { findTagIndex } from '../helpers/utilHelper'
import { getNextLabel } from './labels'
import { RootModel } from '.'

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
    async fetch(_: void, state) {
      const accountId = getActiveAccountId(state)
      const result = await graphQLBasicRequest(
        ` query Tags($account: String) {
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
          account: accountId,
        }
      )
      if (result === 'ERROR') return
      const tags = await dispatch.tags.parse(result)
      if (tags) dispatch.tags.setTags({ tags, accountId })
    },

    async fetchIfEmpty(_: void, state) {
      const accountId = getActiveAccountId(state)
      if (!state.tags.all[accountId]) dispatch.tags.fetch()
    },

    async parse(result: AxiosResponse<any> | undefined) {
      const all = result?.data?.data?.login?.account?.tags
      if (!all) return
      const parsed: ITag[] = all.map(t => ({
        name: t.name,
        color: t.color,
        created: new Date(t.created),
      }))
      return parsed
    },

    async addDevice({ tag, device, accountId }: { tag: ITag; device: IDevice; accountId: string }) {
      if (!device) return
      const copy = { ...device }
      copy.tags.push(tag)
      dispatch.accounts.setDevice({ id: copy.id, device: copy })
      const result = await graphQLAddDeviceTag(copy.id, tag.name, accountId)
      if (result === 'ERROR' || !result?.data?.data?.addTag) {
        dispatch.accounts.setDevice({ id: device.id, device })
      }
    },

    async addNetwork({ tag, network }: { tag: ITag; network: INetwork }) {
      if (!network) return
      const copy = structuredClone(network)
      copy.tags.push(tag)
      dispatch.networks.setNetwork(copy)
      const result = await graphQLAddNetworkTag(copy.id, tag.name)
      if (result === 'ERROR' || !result?.data?.data?.addNetworkTag) {
        dispatch.networks.setNetwork(network)
      }
    },

    async addSelected({ tag, selected }: { tag: ITag; selected: IDevice['id'][] }, state) {
      dispatch.tags.set({ adding: true })
      let add: IDevice['id'][] = []
      eachSelectedDevice(state, selected, device => {
        const index = findTagIndex(device.tags, tag.name)
        if (index === -1) {
          device.tags.push(tag)
          add.push(device.id)
          dispatch.accounts.setDevice({ id: device.id, device })
        }
      })
      const result = await graphQLAddDeviceTag(add, tag.name, getActiveAccountId(state))
      if (result !== 'ERROR')
        dispatch.ui.set({
          successMessage: `${tag.name} added to ${add.length} device${add.length === 1 ? '' : 's'}.`,
        })
      dispatch.tags.set({ adding: false })
    },

    async removeDevice({ tag, device, accountId }: { tag: ITag; device: IDevice; accountId: string }) {
      const copy: IDevice = removeTag(device, tag)
      dispatch.accounts.setDevice({ id: copy.id, device: copy })
      const result = await graphQLRemoveDeviceTag(device.id, tag.name, accountId)
      if (result === 'ERROR' || !result?.data?.data?.removeTag) {
        dispatch.accounts.setDevice({ id: device.id, device })
      }
    },

    async removeNetwork({ tag, network }: { tag: ITag; network: INetwork }) {
      const copy = removeTag(network, tag)
      dispatch.networks.setNetwork(copy)
      const result = await graphQLRemoveNetworkTag(copy.id, tag.name)
      if (result === 'ERROR' || !result?.data?.data?.removeNetworkTag) {
        dispatch.networks.setNetwork(network)
      }
    },

    async removeSelected({ tag, selected }: { tag: ITag; selected: IDevice['id'][] }, state) {
      let count = 0
      dispatch.tags.set({ removing: true })
      eachSelectedDevice(state, selected, device => {
        const index = findTagIndex(device.tags, tag.name)
        if (index !== -1) {
          count++
          device.tags.splice(index, 1)
          dispatch.accounts.setDevice({ id: device.id, device })
        }
      })
      const result = await graphQLRemoveDeviceTag(selected, tag.name, getActiveAccountId(state))
      if (result !== 'ERROR')
        dispatch.ui.set({
          successMessage: `${tag.name} removed from ${count} device${count > 1 ? 's' : ''}.`,
        })
      dispatch.tags.set({ removing: false })
    },

    async create({ tag, accountId }: { tag: ITag; accountId: string }, state) {
      const tags = selectTags(state)
      dispatch.tags.set({ creating: true })
      tag.color = tag.color || getNextLabel(state)
      const result = await graphQLSetTag({ name: tag.name, color: tag.color }, accountId)
      if (result === 'ERROR') return
      dispatch.tags.setTags({ tags: [...tags, tag], accountId })
      dispatch.tags.set({ creating: false })
    },

    async update({ tag, accountId }: { tag: ITag; accountId: string }, state) {
      dispatch.tags.set({ updating: tag.name })
      const tags = selectTags(state, accountId)
      const result = await graphQLSetTag({ name: tag.name, color: tag.color }, accountId)
      if (result === 'ERROR') return
      const index = findTagIndex(tags, tag.name)
      tags[index] = tag
      dispatch.tags.setTags({ tags, accountId })
      dispatch.tags.set({ updating: undefined })
      dispatch.devices.fetchList()
    },

    async rename({ tag, name, accountId }: { tag: ITag; name: string; accountId: string }, state) {
      dispatch.tags.set({ updating: tag.name })
      const tags = selectTags(state, accountId)
      const found = findTagIndex(tags, name)
      const index = findTagIndex(tags, tag.name)
      if (found >= 0 && tag.name.toLowerCase() !== name.toLowerCase()) {
        // merge
        const result = await graphQLMergeTag(tag.name, name, accountId)
        if (result === 'ERROR') return
        tags.splice(index, 1)
        dispatch.ui.set({ noticeMessage: `Tag merged into existing tag ‘${name}.’` })
      } else {
        // rename
        const result = await graphQLRenameTag(tag.name, name, accountId)
        if (result === 'ERROR') return
        tags[index].name = name
      }
      dispatch.tags.setTags({ tags, accountId })
      dispatch.tags.set({ updating: undefined })
      dispatch.devices.fetchList()
    },

    async delete({ tag, accountId }: { tag: ITag; accountId: string }, state) {
      const tags = [...selectTags(state)]
      dispatch.tags.set({ deleting: tag.name })
      const result = await graphQLDeleteTag(tag.name, accountId)
      if (result === 'ERROR') return
      const index = findTagIndex(tags, tag.name)
      tags.splice(index, 1)
      dispatch.tags.setTags({ tags, accountId })
      dispatch.tags.set({ deleting: undefined })
      dispatch.devices.fetchList()
    },
    async setTags({ tags, accountId }: { tags: ITag[]; accountId: string }, state) {
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

function removeTag<T extends IInstance>(original: T, tag: ITag): T {
  const copy = structuredClone(original)
  const index = findTagIndex(copy.tags, tag.name)
  copy.tags.splice(index, 1)
  return copy
}

export function canEditTags(state: ApplicationState, accountId?: string) {
  const permissions = selectPermissions(state, accountId)
  return !!permissions?.includes('ADMIN')
}
