import { describe, it, expect, vi, beforeEach } from 'vitest'

// The real module reaches the store through post(); the model needs only its names.
const { directUpload, postFile, UploadError, NOT_ENABLED, CANCELLED } = vi.hoisted(() => ({
  NOT_ENABLED: 'NOT_ENABLED',
  CANCELLED: 'CANCELLED',
  directUpload: vi.fn(),
  postFile: vi.fn(),
  UploadError: class extends Error {
    constructor(message: string, public code?: string, public reported?: boolean) {
      super(message)
    }
  },
}))
vi.mock('../services/directUpload', () => ({ directUpload, UploadError, NOT_ENABLED, CANCELLED }))
vi.mock('../services/post', () => ({ postFile }))
vi.mock('../services/graphQLRequest', () => ({ graphQLFiles: vi.fn() }))
vi.mock('../services/graphQLMutation', () => ({ graphQLDeleteFile: vi.fn(), graphQLModifyFile: vi.fn() }))
vi.mock('../services/get', () => ({ get: vi.fn() }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'acct' }))
vi.mock('../i18n', () => ({
  default: { t: (_key: string, options: any) => options.defaultValue.replace('{{message}}', options.message) },
}))

import files from './files'

const form: IFileForm = {
  name: 'run.sh',
  description: 'Runs it',
  executable: true,
  deviceIds: [],
  access: 'NONE',
  fileId: '',
  file: new File(['echo hi'], 'run.sh'),
  argumentDefinitions: [{ name: 'host', type: 'StringEntry', desc: 'Host' }],
}

let dispatch: any
const effects = () => (files as any).effects(dispatch)

beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
  dispatch = { ui: { set: vi.fn() }, files: { fetchSingle: vi.fn() } }
  dispatch.files.uploadForm = (payload: any) => effects().uploadForm(payload)
})

describe('files.upload', () => {
  it('uploads directly with the form and the active account, then reads the file', async () => {
    directUpload.mockResolvedValue({ fileId: 'f1' })
    expect(await effects().upload(form, {})).toBe('f1')
    expect(directUpload.mock.calls[0][0]).toEqual({
      file: form.file,
      name: 'run.sh',
      accountId: 'acct',
      executable: true,
      shortDesc: 'Runs it',
      arguments: form.argumentDefinitions,
    })
    expect(postFile).not.toHaveBeenCalled()
    expect(dispatch.files.fetchSingle).toHaveBeenCalledWith({ fileId: 'f1' })
    expect(dispatch.ui.set).toHaveBeenLastCalledWith({ fileUpload: undefined })
  })

  it('shows progress as whole percents per phase', async () => {
    directUpload.mockImplementation(async (_input, { onProgress }) => {
      onProgress({ phase: 'hashing', loaded: 0, total: 200 })
      onProgress({ phase: 'hashing', loaded: 1, total: 200 })
      onProgress({ phase: 'hashing', loaded: 200, total: 200 })
      onProgress({ phase: 'uploading', loaded: 100, total: 200 })
      return { fileId: 'f1' }
    })
    await effects().upload(form, {})
    expect(dispatch.ui.set.mock.calls.map(call => call[0].fileUpload)).toEqual([
      { phase: 'hashing', percent: 0 },
      { phase: 'hashing', percent: 100 },
      { phase: 'uploading', percent: 50 },
      undefined,
    ])
  })

  it('falls back to /file/upload when the API does not offer direct uploads', async () => {
    directUpload.mockResolvedValue(NOT_ENABLED)
    postFile.mockResolvedValue({ data: { fileId: 'f2' } })
    expect(await effects().upload(form, {})).toBe('f2')
    expect(postFile).toHaveBeenCalledWith(
      form.file,
      {
        accountId: 'acct',
        executable: true,
        shortDesc: 'Runs it',
        name: 'run.sh',
        arguments: JSON.stringify(form.argumentDefinitions),
      },
      '/file/upload'
    )
    expect(dispatch.files.fetchSingle).toHaveBeenCalledWith({ fileId: 'f2' })
  })

  it("shows the server's refusal", async () => {
    directUpload.mockRejectedValue(
      new UploadError('Storage quota exceeded: delete old versions', 'STORAGE_QUOTA_EXCEEDED')
    )
    expect(await effects().upload(form, {})).toBe('')
    expect(dispatch.ui.set).toHaveBeenCalledWith({
      errorMessage: 'Error uploading file: Storage quota exceeded: delete old versions',
    })
    expect(dispatch.files.fetchSingle).not.toHaveBeenCalled()
  })

  it('says nothing when the upload was cancelled', async () => {
    directUpload.mockImplementation(
      (_input, { signal }) =>
        new Promise((_resolve, reject) =>
          signal.addEventListener('abort', () => reject(new UploadError('Upload cancelled', CANCELLED)))
        )
    )
    const result = effects().upload(form, {})
    await effects().cancelUpload()
    expect(await result).toBe('')
    expect(dispatch.ui.set).not.toHaveBeenCalledWith(expect.objectContaining({ errorMessage: expect.anything() }))
  })
})
