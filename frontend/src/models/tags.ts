import structuredClone from '@ungap/structured-clone'
import i18n from '../i18n'
import { createModel } from '@rematch/core'
import { AxiosResponse } from 'axios'
import { eachSelectedDevice } from '../helpers/selectedHelper'
import { RowSaid, rowSaid, selectActiveAccountId } from '../selectors/accounts'
import { asRow, rowGone, selectRowOf, sendAs } from '../selectors/signIns'
import { RowKey, withoutAccounts, withoutRows, rekeyed } from '../helpers/rowKey'
import { selectPermissions } from '../selectors/organizations'
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
import { State } from '../store'
import { findTagIndex } from '../helpers/utilHelper'
import { getNextLabel } from './labels'
import { RootModel } from '.'

type ITagState = {
  // By ROW (helpers/rowKey): an account's tags as each sign-in that belongs to it is given them.
  all: { [row: string]: ITag[] }
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
    // Read for a row (selectors/accounts rowSaid): asked as its sign-in, and kept under it.
    async fetch(of: string | RowSaid | void, state) {
      const { accountId, row } = rowSaid(state, of)
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
        },
        false,
        asRow(row)
      )
      if (result === 'ERROR') return
      const tags = await dispatch.tags.parse(result)
      if (tags) dispatch.tags.setTags({ tags, accountId, row })
    },

    async fetchIfEmpty(accountId: string | void, state) {
      accountId = accountId || selectActiveAccountId(state)
      if (!state.tags.all[selectRowOf(state, accountId)]) dispatch.tags.fetch(accountId)
    },

    async parse(result: AxiosResponse<any>) {
      const all = result.data?.data?.login?.account?.tags
      if (!all) return
      const parsed: ITag[] = all.map(t => ({
        name: t.name,
        color: t.color,
        created: new Date(t.created),
      }))
      return parsed
    },

    async addDevice({ tag, device, accountId }: { tag: ITag; device: IDevice; accountId: string }, state) {
      if (!device) return
      // The row the device is in when this begins: where it is written, and put back if the tag is refused.
      const row = deviceRow(state, device)
      const copy = structuredClone(device)
      copy.tags.push(tag)
      dispatch.accounts.setDevice({ id: copy.id, device: copy, row })
      const result = await graphQLAddDeviceTag(copy.id, tag.name, accountId)
      if (result === 'ERROR' || !result?.data?.data?.addTag) {
        dispatch.accounts.setDevice({ id: device.id, device, row })
      }
    },

    async addNetwork({ tag, network }: { tag: ITag; network: INetwork }, state) {
      if (!network) return
      const at = rowSaid(state)
      const copy = structuredClone(network)
      copy.tags.push(tag)
      dispatch.networks.setNetworkIn({ network: copy, ...at })
      const result = await graphQLAddNetworkTag(copy.id, tag.name)
      if (result === 'ERROR' || !result?.data?.data?.addNetworkTag) {
        dispatch.networks.setNetworkIn({ network, ...at })
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
      const result = await graphQLAddDeviceTag(add, tag.name, selectActiveAccountId(state))
      if (result !== 'ERROR')
        dispatch.ui.set({
          successMessage: i18n.t('notices:tag.added', {
            tag: tag.name,
            count: add.length,
            defaultValue_one: '{{tag}} added to {{count}} device.',
            defaultValue_other: '{{tag}} added to {{count}} devices.',
          }),
        })
      dispatch.tags.set({ adding: false })
    },

    async removeDevice({ tag, device, accountId }: { tag: ITag; device: IDevice; accountId: string }, state) {
      const row = deviceRow(state, device)
      const copy: IDevice = removeTag(device, tag)
      dispatch.accounts.setDevice({ id: copy.id, device: copy, row })
      const result = await graphQLRemoveDeviceTag(device.id, tag.name, accountId)
      if (result === 'ERROR' || !result?.data?.data?.removeTag) {
        dispatch.accounts.setDevice({ id: device.id, device, row })
      }
    },

    async removeNetwork({ tag, network }: { tag: ITag; network: INetwork }, state) {
      const at = rowSaid(state)
      const copy = removeTag(network, tag)
      dispatch.networks.setNetworkIn({ network: copy, ...at })
      const result = await graphQLRemoveNetworkTag(copy.id, tag.name)
      if (result === 'ERROR' || !result?.data?.data?.removeNetworkTag) {
        dispatch.networks.setNetworkIn({ network, ...at })
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
      const result = await graphQLRemoveDeviceTag(selected, tag.name, selectActiveAccountId(state))
      if (result !== 'ERROR')
        dispatch.ui.set({
          successMessage: `${tag.name} removed from ${count} device${count > 1 ? 's' : ''}.`,
        })
      dispatch.tags.set({ removing: false })
    },

    async create({ tag, accountId }: { tag: ITag; accountId?: string }, state) {
      accountId = accountId || selectActiveAccountId(state)
      // The row it began in (this effect's own state): where the list is written once the request has answered.
      const row = selectRowOf(state, accountId)
      const tags = selectTags(state, accountId)
      dispatch.tags.set({ creating: true })
      tag.color = tag.color || getNextLabel(state)
      const result = await graphQLSetTag({ name: tag.name, color: tag.color }, accountId)
      if (result !== 'ERROR') dispatch.tags.setTags({ tags: [...tags, tag], accountId, row })
      dispatch.tags.set({ creating: false })
    },

    async update({ tag, accountId }: { tag: ITag; accountId: string }, state) {
      dispatch.tags.set({ updating: tag.name })
      const tags = structuredClone(selectTags(state, accountId))
      const result = await graphQLSetTag({ name: tag.name, color: tag.color }, accountId)
      if (result === 'ERROR') {
        dispatch.tags.set({ updating: undefined })
        return
      }
      const index = findTagIndex(tags, tag.name)
      tags[index] = tag
      dispatch.tags.setTags({ tags, accountId, row: selectRowOf(state, accountId) })
      dispatch.tags.set({ updating: undefined })
      dispatch.devices.fetchList()
    },

    async rename({ tag, name, accountId }: { tag: ITag; name: string; accountId: string }, state) {
      dispatch.tags.set({ updating: tag.name })
      const tags = structuredClone(selectTags(state, accountId))
      const found = findTagIndex(tags, name)
      const index = findTagIndex(tags, tag.name)
      if (found >= 0 && tag.name.toLowerCase() !== name.toLowerCase()) {
        // merge
        const result = await sendAs(selectRowOf(state, accountId), () => graphQLMergeTag(tag.name, name, accountId))
        if (result === 'ERROR') {
          dispatch.tags.set({ updating: undefined })
          return
        }
        tags.splice(index, 1)
        dispatch.ui.set({
          noticeMessage: i18n.t('notices:tag.merged', {
            name,
            defaultValue: 'Tag merged into existing tag ‘{{name}}.’',
          }),
        })
      } else {
        // rename
        const result = await sendAs(selectRowOf(state, accountId), () => graphQLRenameTag(tag.name, name, accountId))
        if (result === 'ERROR' || !result?.data?.data?.renameTag) {
          dispatch.ui.set({
            errorMessage: i18n.t('notices:tag.renameError', {
              name,
              defaultValue: 'Your tag ({{name}}) could not be renamed.',
            }),
          })
          dispatch.tags.set({ updating: undefined })
          return
        }
        tags[index].name = name
      }
      dispatch.tags.setTags({ tags, accountId, row: selectRowOf(state, accountId) })
      dispatch.tags.set({ updating: undefined })
      dispatch.devices.fetchList()
    },

    async delete({ tag, accountId }: { tag: ITag; accountId: string }, state) {
      const tags = [...selectTags(state, accountId)]
      dispatch.tags.set({ deleting: tag.name })
      const result = await graphQLDeleteTag(tag.name, accountId)
      if (result === 'ERROR') {
        dispatch.tags.set({ deleting: undefined })
        return
      }
      const index = findTagIndex(tags, tag.name)
      tags.splice(index, 1)
      dispatch.tags.setTags({ tags, accountId, row: selectRowOf(state, accountId) })
      dispatch.tags.set({ deleting: undefined })
      dispatch.devices.fetchList()
    },

    /* The one write of a row's tags. `row` is the key (helpers/rowKey): the row said — the one a read was made for, or
       an effect began in — else the one the account is looked at through. */
    async setTags({ tags, accountId, row }: { tags: ITag[]; accountId: string; row?: RowKey }, state) {
      // An answer for a row whose sign-in has left since it was asked: the row is gone, and is not put back.
      if (row && rowGone(state, row)) return
      tags = tags.sort((a, b) => (b.created?.getTime() || 0) - (a.created?.getTime() || 0))
      dispatch.tags.setRow({ row: row ?? selectRowOf(state, accountId), tags })
    },
  }),
  reducers: {
    reset(state: ITagState) {
      state = { ...defaultState }
      return state
    },
    /** An account's data dropped: its sign-in signed out, so it is no longer a row (models/accounts forgetData). */
    forget(state: ITagState, accountIds: string[]) {
      state.all = withoutAccounts(state.all, accountIds)
      return state
    },
    forgetRows(state: ITagState, rows: string[]) {
      state.all = withoutRows(state.all, rows)
      return state
    },
    rekey(state: ITagState, rows: ILookup<RowKey>) {
      state.all = rekeyed(state.all, rows)
      return state
    },
    setRow(state: ITagState, { row, tags }: { row: RowKey; tags: ITag[] }) {
      state.all = { ...state.all, [row]: tags }
      return state
    },
    set(state: ITagState, params: Partial<ITagState>) {
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

export function canEditTags(state: State, accountId?: string) {
  const permissions = selectPermissions(state, accountId)
  return !!permissions.includes('ADMIN')
}

// The row a device is in: its account's, as that account is looked at.
const deviceRow = (state: State, device: IDevice) =>
  selectRowOf(state, device.accountId || selectActiveAccountId(state))
