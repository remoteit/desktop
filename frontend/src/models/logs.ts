import { createModel } from '@rematch/core'

const MAX_LOG_LENGTH = 250

interface LogState {
  all: Log[]
}

const state: LogState = { all: [] }

export default createModel({
  state,
  reducers: {
    addLog(state: LogState, log: Log) {
      // Remove the first item from the array of logs
      // so it doesn't get too long and crash the browser.
      if (state.all.length === MAX_LOG_LENGTH) {
        state.all.shift()
      }
      state.all.push({ ...log, createdAt: new Date() })
    },
  },
})
