import axios from 'axios'
import { createModel } from '@rematch/core'
import { ZENDESK_URL } from '../shared/constants'
import { RootModel } from './rootModel'
import { apiError } from '../helpers/apiHelper'
import { fullVersion } from '../helpers/versionHelper'

type FeedbackParams = { [key: string]: any }

export type IFeedbackState = {
  body: string
}

const defaultState: IFeedbackState = {
  body: '',
}

export default createModel<RootModel>()({
  state: defaultState,
  effects: dispatch => ({
    async sendFeedback(_, state) {
      const { body } = state.feedback
      const { user } = state.auth
      try {
        await createTicketZendesk({
          subject: `${fullVersion()} Feedback`,
          body,
          name: user?.email,
          email: user?.email,
        })
        dispatch.ui.set({ successMessage: 'Thank you. Your feedback was sent!' })
      } catch (error) {
        dispatch.ui.set({ errorMessage: 'Sending feedback encountered an error. Please try again.' })
        await apiError(error)
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

async function createTicketZendesk(params: FeedbackParams) {
  const bodyVersion = ` \n\n\n ================ \n ${fullVersion()}`
  if (params.body.trim().length > 0) {
    const result = await axios.post(
      `${ZENDESK_URL}requests.json`,
      {
        request: {
          subject: params.subject,
          comment: {
            body: params.body + bodyVersion,
          },
          requester: {
            name: params.name,
            email: params.email,
          },
          custom_fields: [{ version: fullVersion() }],
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    console.log('FEEDBACK RESULT', result)
  }
}
