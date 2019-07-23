import { createModel } from '@rematch/core'
import BackendAdapter from '../services/BackendAdapter'

export interface BinariesState {
  error?: string
  installing: boolean
  connectdInstalled: boolean
  connectdPath?: string
  connectdVersion?: string
  muxerInstalled: boolean
  muxerPath?: string
  muxerVersion?: string
  demuxerInstalled: boolean
  demuxerPath?: string
  demuxerVersion?: string
  demuxerErrork?: string
}

const state: BinariesState = {
  error: undefined,
  installing: false,
  connectdInstalled: false,
  connectdPath: undefined,
  connectdVersion: undefined,
  muxerInstalled: false,
  muxerPath: undefined,
  muxerVersion: undefined,
  demuxerInstalled: false,
  demuxerPath: undefined,
  demuxerVersion: undefined,
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async install() {
      dispatch.binaries.clearError()
      dispatch.binaries.installing()
      BackendAdapter.emit('binaries/install')
    },
  }),
  reducers: {
    installing(state: BinariesState) {
      state.installing = true
    },
    installed(state: BinariesState, info: InstallationInfo) {
      state.installing = false

      // Clear errors
      state.error = undefined

      // @ts-ignore
      state[info.name + 'Installed'] = true
      // @ts-ignore
      state[info.name + 'Path'] = info.path
      // @ts-ignore
      state[info.name + 'Version'] = info.version
    },
    notInstalled(state: BinariesState, binary: BinaryName) {
      state.installing = false

      // @ts-ignore
      state[binary + 'Installed'] = false
      // @ts-ignore
      state[binary + 'Path'] = undefined
      // @ts-ignore
      state[binary + 'Version'] = undefined
    },
    installError(state: BinariesState, error: string) {
      state.error = error
      state.installing = false
    },
    clearError(state: BinariesState) {
      state.error = undefined
      state.installing = false
    },
  },
})
