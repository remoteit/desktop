import axios from 'axios'
import { IFeedbackState } from '../models/feedback'
import { ZENDESK_TOKEN, ZENDESK_URL } from '../shared/constants'
import { version } from '../../package.json'

export async function createTicketZendesk(params: IFeedbackState) {
  const bodyVersion = ` \n\n\n ================ \n Version: ${version}`
  const data = {
    ticket: {
      subject: params.subject,
      comment: {
        body: params.body + bodyVersion,
      },
      requester: {
        name: params.name,
        email: params.email,
      },
      custom_fields: [{ desktopVersion: version }],
    },
  }
  if (params.body.length > 0) {
    await axios.post(`${ZENDESK_URL}tickets.json`, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ZENDESK_TOKEN}`,
      },
    })
  }

}
