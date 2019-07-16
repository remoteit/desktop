import { createModel } from '@rematch/core'

interface NavigationState {
  page: Page
}

const state: NavigationState = { page: 'devices' }

export default createModel({
  state,
  reducers: {
    setPage(state: NavigationState, page: Page) {
      state.page = page
    },
  },
})
