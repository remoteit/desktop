import { HEARTBEAT_INTERVAL } from '../shared/constants'
import { isActive } from '../services/Browser'
import { store } from '../store'
import { emit } from './Controller'

class Heartbeat {
  count = 0
  interval?: number = undefined

  init() {
    window.setInterval(this.beat, HEARTBEAT_INTERVAL)
    window.onfocus = this.beat
  }

  beat() {
    const { auth } = store.getState()
    isActive() && auth.backendAuthenticated && emit('heartbeat')
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
