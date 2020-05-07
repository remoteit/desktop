import { createModel } from '@rematch/core'

export const DEFAULT_INTERFACE = 'searching'

type UIParams = { [key: string]: any }
type UIState = UIParams & {
  connected: boolean
  uninstalling: boolean
  scanLoading: { [interfaceName: string]: boolean }
  scanTimestamp: { [interfaceName: string]: number }
  scanInterface: string
  setupDeletingService: boolean
  setupServicesCount: number
  setupServicesNew: boolean
}

const state: UIState = {
  connected: false,
  uninstalling: false,
  scanLoading: {},
  scanTimestamp: {},
  scanInterface: DEFAULT_INTERFACE,
  setupDeletingService: false,
  setupServicesCount: 0,
  setupServicesNew: false,
}

export default createModel({
  state,
  reducers: {
    set(state: UIState, params: UIParams) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
    },
  },
})
