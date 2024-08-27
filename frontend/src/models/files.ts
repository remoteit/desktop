import structuredClone from '@ungap/structured-clone'
import { createModel } from '@rematch/core'
import { graphQLFiles } from '../services/graphQLRequest'
import { AxiosResponse } from 'axios'
import { selectActiveAccountId } from '../selectors/accounts'
import { postFile } from '../services/post'
import { RootModel } from '.'

type FilesState = {
  fetching: boolean
  all: {
    [accountId: string]: IFile[]
  }
}

const defaultState: FilesState = {
  fetching: true,
  all: {},
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async fetch(accountId: string | void, state) {
      dispatch.files.set({ fetching: true })
      accountId = accountId || selectActiveAccountId(state)
      const result = await graphQLFiles(accountId)
      if (result === 'ERROR') return
      const files = await dispatch.files.parse(result)
      console.log('LOADED FILES', accountId, files)
      dispatch.files.setAccount({ accountId, files })
      dispatch.files.set({ fetching: false })
    },
    async fetchIfEmpty(accountId: string | void, state) {
      accountId = accountId || selectActiveAccountId(state)
      if (!state.files.all[accountId]) dispatch.files.fetch(accountId)
    },
    async parse(result: AxiosResponse<any> | undefined) {
      const data = result?.data?.data?.login?.account
      let parsed = data?.files.map(file => ({
        ...file,
        created: new Date(file.created).getTime(),
        updated: new Date(file.updated).getTime(),
        versions: file.versions.items,
      }))
      return parsed
    },
    async upload(form: IFileForm, state) {
      if (!form.file) return

      const data = {
        owner: selectActiveAccountId(state),
        executable: form.executable,
        shortDesc: form.description,
        name: form.name,
      }

      console.log('UPLOAD FILE', form, data)

      const result = await postFile(form.file, data, `/file/upload`)
      if (result === 'ERROR') {
        dispatch.ui.set({ errorMessage: 'Error uploading file' })
        return
      }
    },
    async setAccount(params: { files: IFile[]; accountId: string }, state) {
      let all = structuredClone(state.files.all)
      all[params.accountId] = params.files
      dispatch.files.set({ all })
    },
  }),
  reducers: {
    reset(state) {
      state = { ...defaultState }
      return state
    },
    set(state, params: Partial<FilesState>) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})