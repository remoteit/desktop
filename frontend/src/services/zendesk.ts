import { insertScript } from './Browser'
import { ZENDESK_KEY } from '../shared/constants'
import sleep from '../services/sleep'

declare const window: Window & {
  zE?: any
  zESettings?: any
}

class Zendesk {
  async initChat(user?: IUser) {
    if (!window.zE) await this.loadChat()

    if (user)
      window.zE?.('webWidget', 'identify', {
        name: user.email.split('@')[0],
        email: user.email,
      })

    window.zE?.('webWidget', 'show')
  }

  async loadChat() {
    window.zESettings = {
      webWidget: {
        launcher: {
          chatLabel: { '*': 'Chat' },
          mobile: {
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

    const url = `https://static.zdassets.com/ekr/snippet.js?key=${ZENDESK_KEY}`
    await insertScript(url, 'ze-snippet')
    await sleep(5000)
  }

  endChat() {
    window.zE?.('webWidget', 'logout')
    window.zE?.('webWidget', 'hide')
  }
}

export default new Zendesk()
