import axios from 'axios'
import { IFeedbackState } from '../models/feedback'
import { ZENDESK_TOKEN, ZENDESK_URL } from '../shared/constants'

export async function createTicketZendesk(params: IFeedbackState) {
  const data = JSON.stringify({
    ticket: {
      subject: params.subject,
      comment: {
        body: params.body,
      },
    },
  })
  try {
    if (params.body.length > 0) {
      await axios.post(`${ZENDESK_URL}tickets.json`, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ZENDESK_TOKEN}`,
        },
      })
    }
  } catch (error) {
    console.log(`Error trying to send to zendesk`, { error })
  }
}
