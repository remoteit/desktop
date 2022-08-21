import axios from 'axios'
import { createModel } from '@rematch/core'
import { ZENDESK_URL } from '../shared/constants'
import { RootModel } from '.'
import { apiError } from '../helpers/apiHelper'
import { fullVersion } from '../helpers/versionHelper'

type FeedbackParams = { [key: string]: any }

export type IFeedbackState = {
  subject: string
  body: string
  data: string
}

const defaultState: IFeedbackState = {
  subject: '',
  body: '',
  data: '',
}

export default createModel<RootModel>()({
  state: { ...defaultState },
  effects: dispatch => ({
    async sendFeedback(_: void, state) {
      const { subject, body, data } = state.feedback
      const { user } = state.auth
      if (body.trim().length === 0) return
      try {
        const env = await dispatch.backend.environment()
        let finalBody = body
        if (data) finalBody += '\n\n-- data\n\n' + data
        finalBody += '\n\n--\n\n' + fullVersion()
        finalBody += '\n\n' + env + '\n\n' + navigator.userAgent
        await createTicketZendesk({
          subject,
          body: finalBody,
          name: user?.email,
          email: user?.email,
        })
        dispatch.ui.set({ successMessage: 'Thank you. Your feedback was sent!' })
        dispatch.feedback.reset()
      } catch (error) {
        dispatch.ui.set({ errorMessage: 'Sending feedback encountered an error. Please try again.' })
        await apiError(error)
      }
    },
  }),
  reducers: {
    reset(state: IFeedbackState) {
      state = { ...defaultState }
      return state
    },
    set(state: IFeedbackState, params: FeedbackParams) {
      Object.keys(params).forEach(key => (state[key] = params[key]))
      return state
    },
  },
})

async function createTicketZendesk(params: FeedbackParams) {
  const result = await axios.post(
    `${ZENDESK_URL}requests.json`,
    {
      request: {
        subject: params.subject,
        comment: {
          body: params.body,
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
