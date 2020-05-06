import { createModel } from '@rematch/core'

type UIParams = { [key: string]: boolean | string | number }
type UIState = UIParams & {
  connected: boolean
  uninstalling: boolean
}

const state: UIState = { connected: false, uninstalling: false }

export default createModel({
  state,
  reducers: {
    set(state: UIState, params: UIParams) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
    },
  },
})
