import { createModel } from '@rematch/core'

const MAX_LOG_LENGTH = 250

const state: ILog = {}

export default createModel({
  state,
  reducers: {
    reset(state: ILog) {
      state = {}
    },
    clear(state: ILog, id: string) {
      if (state[id]) state[id] = []
    },
    add(state: ILog, { id, log }: { id: string; log: string }) {
      state[id] = state[id] || []
      // Remove the first item from the array of logs
      // so it doesn't get too long and crash the browser.
      if (state[id].length > MAX_LOG_LENGTH) state[id].shift()
      state[id].push(log)
    },
  },
})
