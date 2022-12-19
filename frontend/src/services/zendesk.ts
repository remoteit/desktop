import { insertScript } from './Browser'
import { ZENDESK_KEY } from '../shared/constants'
import { selectLimitsLookup } from '../selectors/organizations'
import { store } from '../store'
import sleep from '../services/sleep'

declare const window: Window & {
  zE?: any
  zESettings?: any
}

class Zendesk {
  visible?: boolean

  async initChat(user?: IUser) {
    if (!window.zE) await this.loadChat()

    if (user)
      window.zE?.('webWidget', 'identify', {
        name: user.email.split('@')[0],
        email: user.email,
      })

    this.subscribe()
  }

  subscribe() {
    store.subscribe(() => {
      const state = store.getState()
      const limits = selectLimitsLookup(state)
      const visible = limits.support > 10
      if (visible !== this.visible) {
        visible ? this.showChat() : this.hideChat()
      }
    })
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

  showChat() {
    window.zE?.('webWidget', 'show')
    this.visible = true
    console.log('SHOW CHAT')
  }

  hideChat() {
    window.zE?.('webWidget', 'hide')
    this.visible = false
    console.log('HIDE CHAT')
  }

  endChat() {
    this.hideChat()
    window.zE?.('webWidget', 'logout')
  }
}

export default new Zendesk()
