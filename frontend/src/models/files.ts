import axios, { AxiosResponse } from 'axios'
import structuredClone from '@ungap/structured-clone'
import { DEMO_SCRIPT_URL, BINARY_DATA_TOKEN } from '../constants'
import { createModel } from '@rematch/core'
import { graphQLFiles } from '../services/graphQLRequest'
import { graphQLDeleteFile, graphQLModifyFile } from '../services/graphQLMutation'
import { selectActiveAccountId } from '../selectors/accounts'
import { RootModel } from '.'
import { postFile } from '../services/post'
import { get } from '../services/get'

type FilesState = {
  initialized: boolean
  fetching: boolean
  all: {
    [accountId: string]: IFile[]
  }
}

export const initialForm: IFileForm = {
  name: '',
  description: '',
  executable: true,
  tag: { operator: 'ALL', values: [] },
  deviceIds: [],
  access: 'NONE',
  fileId: '',
  script: '',
  argumentDefinitions: [],
  argumentValues: [],
}

const defaultState: FilesState = {
  initialized: false,
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
      dispatch.files.set({ fetching: false, initialized: true })
    },
    async fetchSingle({ accountId, fileId }: { accountId?: string; fileId: string }, state) {
      dispatch.files.set({ fetching: true })
      accountId = accountId || selectActiveAccountId(state)
      const result = await graphQLFiles(accountId, [fileId])
      if (result === 'ERROR') {
        dispatch.files.set({ fetching: false })
        return
      }
      const files = await dispatch.files.parse(result)
      if (files?.[0]) {
        dispatch.files.setFile({ accountId, file: files[0] })
      }
      dispatch.files.set({ fetching: false })
    },
    async fetchIfEmpty(accountId: string | void, state) {
      accountId = accountId || selectActiveAccountId(state)
      if (!state.files.all[accountId]) dispatch.files.fetch(accountId)
    },
    async parse(result: AxiosResponse<any> | undefined): Promise<IFile[]> {
      const data = result?.data?.data?.login?.account
      return data?.files.map(file => ({ ...file, versions: file.versions.items }))
    },
    async upload(form: IFileForm, state): Promise<string> {
      if (!form.file) return ''

      const data: Record<string, any> = {
        accountId: selectActiveAccountId(state),
        executable: form.executable,
        shortDesc: form.description,
        name: form.name,
      }

      // Include argument definitions if provided
      if (form.argumentDefinitions?.length) {
        data.arguments = JSON.stringify(form.argumentDefinitions)
      }

      const result = await postFile(form.file, data, `/file/upload`)
      if (result === 'ERROR') return ''

      console.log('UPLOADED FILE', { form, data, result })

      const fileId: string = result?.data.fileId
      await dispatch.files.fetchSingle({ fileId })
      return fileId
    },
    async download(fileId: string) {
      const result = await get(`/file/download/${fileId}`)
      if (!result || result === 'ERROR') return

      const contentType = result.headers['content-type']
      if (!result.data && contentType === 'application/octet-stream') {
        result.data = BINARY_DATA_TOKEN
      }

      console.log('DOWNLOADED FILE', result)
      return result.data
    },
    async downloadDemoScript() {
      try {
        const result = await axios.get(DEMO_SCRIPT_URL)
        return result.data
      } catch (error) {
        console.error('Error downloading demo script', error)
        return
      }
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
    async updateMetadata(params: { fileId: string; name?: string; shortDesc?: string }, state) {
      console.log('UPDATE FILE METADATA', params)

      const result = await graphQLModifyFile(params)
      if (result === 'ERROR') {
        dispatch.ui.set({ errorMessage: 'Error updating file' })
        return false
      }

      await dispatch.files.fetchSingle({ fileId: params.fileId })
      return true
    },
    async setFile({ accountId, file }: { accountId: string; file: IFile }, state) {
      const files = structuredClone(state.files.all[accountId] || [])
      const index = files.findIndex(f => f.id === file.id)
      if (index === -1) files.unshift(file)
      else files[index] = file
      dispatch.files.setAccount({ accountId, files })
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
