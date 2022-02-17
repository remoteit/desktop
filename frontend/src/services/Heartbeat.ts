import network from './Network'
import { isPortal } from './Browser'
import { HEARTBEAT_INTERVAL } from '../shared/constants'
import { store } from '../store'
import { emit } from './Controller'

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
    }, 1000)
  }
}

export default new Heartbeat()
