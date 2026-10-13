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
import { fetchFileSizes } from '../services/fileStorage'
import { directUpload, NOT_ENABLED, CANCELLED, UploadError, UploadProgress } from '../services/directUpload'
import i18n from '../i18n'

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

// Kept out of the store: an AbortController is not state, and cancel stops every upload in progress.
const uploads = new Set<AbortController>()

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
      if (result === 'ERROR') {
        dispatch.files.set({ fetching: false, initialized: true })
        return
      }
      const files = await dispatch.files.parse(result)
      console.log('LOADED FILES', accountId, files)
      dispatch.files.setAccount({ accountId, files })
      dispatch.files.set({ fetching: false, initialized: true })
      dispatch.files.fetchSizes(accountId)
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
        await dispatch.files.setFile({ accountId, file: files[0] })
      }
      dispatch.files.set({ fetching: false })
      dispatch.files.fetchSizes(accountId)
    },
    // What each file stores, all its versions (services/fileStorage): read on its own and silently, so an API without
    // it lists files as before.
    async fetchSizes(accountId: string) {
      const sizes = await fetchFileSizes(accountId)
      if (sizes && typeof sizes === 'object') dispatch.files.setSizes({ accountId, sizes })
    },
    async fetchIfEmpty(accountId: string | void, state) {
      accountId = accountId || selectActiveAccountId(state)
      if (!state.files.all[accountId]) dispatch.files.fetch(accountId)
    },
    async parse(result: AxiosResponse<any>): Promise<IFile[]> {
      const data = result.data?.data?.login?.account
      return data?.files.map(file => ({ ...file, versions: file.versions.items }))
    },
    async upload(form: IFileForm, state): Promise<string> {
      if (!form.file) return ''

      const accountId = selectActiveAccountId(state)
      const controller = new AbortController()
      uploads.add(controller)

      let shown = ''
      const onProgress = ({ phase, loaded, total }: UploadProgress) => {
        const percent = total ? Math.floor((loaded / total) * 100) : 100
        if (`${phase}${percent}` === shown) return
        shown = `${phase}${percent}`
        dispatch.ui.set({ fileUpload: { phase, percent } })
      }

      try {
        const result = await directUpload(
          {
            file: form.file,
            name: form.name,
            accountId,
            executable: form.executable,
            shortDesc: form.description,
            arguments: form.argumentDefinitions?.length ? form.argumentDefinitions : undefined,
          },
          { onProgress, signal: controller.signal }
        )
        const fileId = result === NOT_ENABLED ? await dispatch.files.uploadForm({ form, accountId }) : result.fileId
        console.log('UPLOADED FILE', { name: form.name, direct: result !== NOT_ENABLED, fileId })
        if (!fileId) return ''
        await dispatch.files.fetchSingle({ fileId })
        return fileId
      } catch (error) {
        const uploadError = error instanceof UploadError ? error : undefined
        console.error('UPLOAD FILE FAILED', error)
        if (uploadError?.code !== CANCELLED && !uploadError?.reported)
          dispatch.ui.set({
            errorMessage: i18n.t('notices:file.uploadError', {
              message: (error as Error)?.message,
              defaultValue: 'Error uploading file: {{message}}',
            }),
          })
        return ''
      } finally {
        uploads.delete(controller)
        if (!uploads.size) dispatch.ui.set({ fileUpload: undefined })
      }
    },
    // The whole file in one POST, for an API without direct uploads; its body limit caps the file size.
    async uploadForm({ form, accountId }: { form: IFileForm; accountId: string }): Promise<string> {
      if (!form.file) return ''
      const data: Record<string, any> = {
        accountId,
        executable: form.executable,
        shortDesc: form.description,
        name: form.name,
      }
      if (form.argumentDefinitions?.length) data.arguments = JSON.stringify(form.argumentDefinitions)

      dispatch.ui.set({ fileUpload: { phase: 'uploading' } })
      const result = await postFile(form.file, data, `/file/upload`)
      if (result === 'ERROR') return ''
      return result?.data.fileId
    },
    async cancelUpload() {
      uploads.forEach(controller => controller.abort())
    },
    async download(fileId: string) {
      const result = await get(`/file/download/${fileId}`)
      if (result === 'ERROR') return

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
    async delete(fileId: string) {
      console.log('DELETE FILE', fileId)

      const result = await graphQLDeleteFile(fileId)
      if (result === 'ERROR') {
        dispatch.ui.set({ errorMessage: i18n.t('notices:file.deleteError', { defaultValue: 'Error deleting file' }) })
        return
      }

      await dispatch.files.fetch()
    },
    async updateMetadata(params: { fileId: string; name?: string; shortDesc?: string }) {
      console.log('UPDATE FILE METADATA', params)

      const result = await graphQLModifyFile(params)
      if (result === 'ERROR') {
        dispatch.ui.set({ errorMessage: i18n.t('notices:file.updateError', { defaultValue: 'Error updating file' }) })
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
    setSizes(state, { accountId, sizes }: { accountId: string; sizes: ILookup<number> }) {
      const files = state.all[accountId]
      if (!files) return state
      state.all = { ...state.all, [accountId]: files.map(file => (file.id in sizes ? { ...file, storedSize: sizes[file.id] } : file)) }
      return state
    },
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
