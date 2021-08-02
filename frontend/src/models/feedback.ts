import { createModel } from '@rematch/core'
import { createTicketZendesk } from '../services/Feedback'
import { graphQLCatchError } from '../services/graphQL'
import { RootModel } from './rootModel'

type FeedbackParams = { [key: string]: any }

export type IFeedbackState = {
  sending: boolean
  sent: boolean
  body: string
  subject: string
  name?: string
  email?: string
}

const state: IFeedbackState = {
  sending: false,
  sent: false,
  body: '',
  subject: 'App Desktop',
  name: '',
  email: '',
}

export default createModel<RootModel>()({
  state,
  effects: dispatch => ({
    async sendFeedback(_, globalState) {
      const { set } = dispatch.feedback
      const { body, subject } = globalState.feedback
      const { user } = globalState.auth
      set({ sending: true })
      try {
        const params: IFeedbackState = {
          subject,
          body,
          sending: true,
          sent: true,
          name: user?.email,
          email: user?.email,
        }
        await createTicketZendesk(params)
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
