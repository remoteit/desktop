import network from './Network'
import { isPortal } from './Browser'
import { store } from '../store'
import { emit } from './Controller'

const HEARTBEAT_INTERVAL = 1000 * 15 // 15 SEC
const CAFFEINATE_INTERVAL = 1000 // 1 SEC

class Heartbeat {
  count = 0
  interval?: number = undefined

  init() {
    if (!isPortal()) {
      window.setInterval(this.beat, HEARTBEAT_INTERVAL)
      window.onfocus = this.beat
    }
  }

  beat() {
    const { auth } = store.getState()
    network.isActive() && auth.backendAuthenticated && emit('heartbeat')
  }

  caffeinate() {
    this.count = 0
    if (this.interval) window.clearInterval(this.interval)
    this.interval = window.setInterval(() => {
      if (this.count++ > 10) {
        window.clearInterval(this.interval)
        this.interval = undefined
      }
      this.beat()
    }, CAFFEINATE_INTERVAL)
  }
}

export default new Heartbeat()
