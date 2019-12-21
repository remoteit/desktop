import { createModel } from '@rematch/core'
import Controller from '../services/Controller'

export interface BinariesState {
  error?: any
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
  remoteitInstalled: boolean
  remoteitPath?: string
  remoteitVersion?: string
  remoteitErrork?: string
}

const state: BinariesState = {
  error: undefined,
  installing: false,
  connectdInstalled: true,
  connectdPath: undefined,
  connectdVersion: undefined,
  muxerInstalled: true,
  muxerPath: undefined,
  muxerVersion: undefined,
  demuxerInstalled: true,
  demuxerPath: undefined,
  demuxerVersion: undefined,
  remoteitInstalled: true,
  remoteitPath: undefined,
  remoteitVersion: undefined,
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async install() {
      dispatch.binaries.clearError()
      dispatch.binaries.installing()
      Controller.emit('binaries/install')
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
    notInstalled(state: BinariesState, name: BinaryName) {
      state.installing = false

      // @ts-ignore
      state[name + 'Installed'] = false
      // @ts-ignore
      state[name + 'Path'] = undefined
      // @ts-ignore
      state[name + 'Version'] = undefined
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
