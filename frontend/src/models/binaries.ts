import { createModel } from '@rematch/core'
import { emit } from '../services/Controller'
import analyticsHelper from '../helpers/analyticsHelper'

export interface BinariesState {
  error?: any
  installing: boolean
  installed: boolean
  path?: string
  version?: string
  installedVersion?: string
}

const state: BinariesState = {
  error: undefined,
  installing: false,
  installed: true,
  path: undefined,
  version: undefined,
  installedVersion: undefined,
}

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async install(force?: boolean) {
      dispatch.binaries.clearError()
      dispatch.binaries.installing()
      emit('binaries/install', force)
      analyticsHelper.track('install')
    },
  }),
  reducers: {
    installing(state: BinariesState) {
      state.installing = true
    },
    installed(state: BinariesState, info: InstallationInfo) {
      console.log('BINARY INSTALLED', info)
      state.installing = false
      state.error = undefined
      state.installed = true
      state.path = info.path
      state.version = info.version
      state.installedVersion = info.installedVersion
    },
    notInstalled(state: BinariesState, name: BinaryName) {
      console.log('BINARY NOT INSTALLED', name)
      state.installing = false
      state.installed = false
      state.path = undefined
      state.version = undefined
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
