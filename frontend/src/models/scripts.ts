import structuredClone from '@ungap/structured-clone'
import { createModel } from '@rematch/core'
import { graphQLFiles } from '../services/graphQLRequest'
import { AxiosResponse } from 'axios'
import { selectActiveAccountId } from '../selectors/accounts'
import { RootModel } from '.'

type ScriptsState = {
  fetching: boolean
  files: { [accountId: string]: IFile[] }
}

const defaultState: ScriptsState = {
  fetching: false,
  files: {},
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async fetch(accountId: string | void, state) {
      dispatch.scripts.set({ fetching: true })
      accountId = accountId || selectActiveAccountId(state)
      const result = await graphQLFiles(accountId)
      if (result === 'ERROR') return
      const files = await dispatch.scripts.parse(result)
      console.log('LOADED FILES', accountId, files)
      dispatch.scripts.setFiles({ accountId, files })
      dispatch.scripts.set({ fetching: false })
    },
    async fetchIfEmpty(accountId: string | void, state) {
      accountId = accountId || selectActiveAccountId(state)
      if (!state.scripts[accountId]) dispatch.scripts.fetch(accountId)
    },
    async parse(result: AxiosResponse<any> | undefined) {
      const data = result?.data?.data?.login?.account
      const parsed = data?.files.map(file => ({
        ...file,
        created: new Date(file.created).getTime(),
        updated: new Date(file.updated).getTime(),
        versions: file.versions.items,
      }))
      return parsed
    },
    async setFiles(params: { files: IFile[]; accountId: string }, state) {
      let files = structuredClone(state.scripts.files)
      files[params.accountId] = params.files
      dispatch.scripts.set({ files })
    },
  }),
  reducers: {
    reset(state) {
      state = { ...defaultState }
      return state
    },
    set(state, params: Partial<ScriptsState>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
