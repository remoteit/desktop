import { createModel } from '@rematch/core'
import { graphQLGetErrors, graphQLCatchError } from '../services/graphQL'
import { ApplicationState } from '../store'
import { RootModel } from './rootModel'

type FeedbackParams = { [key: string]: any }

type IFeedbackState = {
  sending: boolean
  sent: boolean
}

const state: IFeedbackState = {
  sending: false,
  sent: false,
}

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async sendFeedback() {
      const { set } = dispatch.feedback

      set({ sending: true })
      try {
        // TO DO
        // const response = await graphQLSendFeedback({ })
        // const errors = graphQLGetErrors(response)
        // if (!errors) {

        await new Promise(resolve => {
          setTimeout(resolve, 500)
        })

        set({ sending: false, sent: true })
      } catch (error) {
        await graphQLCatchError(error)
      }
    },
  }),
  reducers: {
    set(state: IFeedbackState, params: FeedbackParams) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})
