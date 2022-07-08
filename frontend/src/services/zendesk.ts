import { insertScript } from './Browser'
import { ZENDESK_KEY } from '../shared/constants'

export default function loadChat() {
  const url = `https://static.zdassets.com/ekr/snippet.js?key=${ZENDESK_KEY}`
  insertScript(url, 'ze-snippet')

  // @ts-ignore
  window.zESettings = {
    webWidget: {
      launcher: {
        offset: '50px',
        chatLabel: { '*': 'Online' },
        desktop: {
          labelVisible: false,
        },
      },
      chat: {
        suppress: false,
      },
      contactForm: {
        suppress: true,
      },
      helpCenter: {
        suppress: true,
      },
    },
  }
}
