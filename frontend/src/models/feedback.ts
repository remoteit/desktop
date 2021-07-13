import { createModel } from '@rematch/core'
import { graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { ApplicationState } from '../store'
import { RootModel } from './rootModel'

type FeedbackParams = { [key: string]: any }

type IFeedbackState = {
  sending: boolean
}

const state: IFeedbackState = {
  sending: false,
}

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async sendFeedback() {
      const { set } = dispatch.feedback
      set({ sending: true })
      try {
        // TODO: integrate with API
        // const response = await graphQLSendFeedback({ })
        // const errors = graphQLGetErrors(response)
        // if (!errors) {

        if (true) {
          dispatch.ui.set({ successMessage: `Feedback sent!.` })
        }
      } catch (error) {
        await graphQLCatchError(error)
      }
      set({ sending: false })
    },
  }),
  reducers: {
    set(state: IFeedbackState, params: FeedbackParams) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
