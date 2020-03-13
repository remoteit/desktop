import { createModel } from '@rematch/core'

interface UIState {
  connected: boolean
  uninstalling: boolean
}

const state: UIState = { connected: false, uninstalling: false }

export default createModel({
  state,
  effects: (dispatch: any) => ({
    async connected() {
      dispatch.ui.setConnected(true)
      dispatch.backend.set({ key: 'error', value: false })
    },
    async disconnected() {
      dispatch.ui.setConnected(false)
    },
  }),
  reducers: {
    setUninstalling(state: UIState) {
      state.uninstalling = true
    },
    setConnected(state: UIState, connected: boolean) {
      state.connected = connected
    },
  },
})
