import { createModel } from '@rematch/core'
import { emit } from '../services/Controller'
import { RootModel } from '.'

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

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async install() {
      dispatch.binaries.clearError()
      dispatch.binaries.installing()
      emit('binaries/install')
    },
  }),
  reducers: {
    installing(state: BinariesState) {
      state.installing = true
      return state
    },
    installed(state: BinariesState, info: InstallationInfo) {
      console.log('BINARY INSTALLED', info)
      state.installing = false
      state.error = undefined
      state.installed = true
      state.path = info.path
      state.version = info.version
      state.installedVersion = info.installedVersion
      return state
    },
    notInstalled(state: BinariesState, name: BinaryName) {
      console.log('BINARY NOT INSTALLED', name)
      state.installed = false
      state.path = undefined
      state.version = undefined
      return state
    },
    installError(state: BinariesState, error: string) {
      console.error('BINARY INSTALL ERROR', error)
      state.error = error
      state.installing = false
      return state
    },
    clearError(state: BinariesState) {
      state.error = undefined
      state.installing = false
      return state
    },
  },
})
