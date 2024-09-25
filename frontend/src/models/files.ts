import structuredClone from '@ungap/structured-clone'
import { createModel } from '@rematch/core'
import { graphQLFiles } from '../services/graphQLRequest'
import { graphQLDeleteFile } from '../services/graphQLMutation'
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
      return data?.files.map(file => ({ ...file, versions: file.versions.items }))
    },
    async upload(form: IFileForm, state) {
      if (!form.file) return

      const data = {
        accountId: selectActiveAccountId(state),
        executable: form.executable,
        shortDesc: form.description,
        name: form.name,
      }

      const result = await postFile(form.file, data, `/file/upload`)
      if (result === 'ERROR') return

      console.log('UPLOADED FILE', { form, data, result })

      return result?.data.fileId
    },
    async download(fileId: string, state) {
      // const result = await post({}
    },
    async delete(fileId: string, state) {
      console.log('DELETE FILE', fileId)

      const result = await graphQLDeleteFile(fileId)
      if (result === 'ERROR') {
        dispatch.ui.set({ errorMessage: 'Error deleting file' })
        return
      }

      await dispatch.files.fetch()
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
