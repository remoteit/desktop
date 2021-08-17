import { createModel } from '@rematch/core'
import { createTicketZendesk } from '../services/Feedback'
import { graphQLCatchError } from '../services/graphQL'
import { RootModel } from './rootModel'

type FeedbackParams = { [key: string]: any }

export type IFeedbackState = {
  body: string
  subject: string
  name?: string
  email?: string
}

const state: IFeedbackState = {
  body: '',
  subject: 'Desktop App Feedback',
  name: '',
  email: '',
}

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async sendFeedback(_, globalState) {
      const { body, subject } = globalState.feedback
      const { user } = globalState.auth
      try {
        await createTicketZendesk({
          subject,
          body,
          name: user?.email,
          email: user?.email,
        })
        dispatch.ui.set({ successMessage: 'Thank you. Your feedback was sent!' })
      } catch (error) {
        dispatch.ui.set({ warningMessage: 'Sending feedback encountered an error. Please try again.' })
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
