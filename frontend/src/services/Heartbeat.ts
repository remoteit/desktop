import { isPortal } from './Browser'
import { store } from '../store'
import { emit } from './Controller'

const HEARTBEAT_INTERVAL = 1000 * 20 // 20 SEC
const CAFFEINATE_INTERVAL = 1000 // 1 SEC

class Heartbeat {
  count = 0
  restInterval?: number = undefined
  caffeineInterval?: number = undefined

  init() {
    if (!isPortal()) {
      window.onfocus = this.focus
      window.onblur = this.blur
      if (document.hasFocus()) this.focus()
    }
  }

  focus = () => {
    this.restInterval = window.setInterval(this.beat, HEARTBEAT_INTERVAL)
  }

  blur = () => {
    if (this.restInterval) {
      window.clearInterval(this.restInterval)
      this.restInterval = undefined
    }
  }

  beat = () => {
    const { auth } = store.getState()
    if (navigator.onLine && auth.backendAuthenticated) {
      emit('heartbeat')
    }
  }

  caffeinate = () => {
    this.count = 0
    if (this.caffeineInterval) window.clearInterval(this.caffeineInterval)
    this.caffeineInterval = window.setInterval(() => {
      if (this.count++ > 15) {
        window.clearInterval(this.caffeineInterval)
        this.caffeineInterval = undefined
      }
      this.beat()
    }, CAFFEINATE_INTERVAL)
  }
}

export default new Heartbeat()
