import network from '../services/Network'
import { isPortal } from './Browser'
import { store } from '../store'
import { emit } from './Controller'

const HEARTBEAT_INTERVAL = 1000 * 20 // 20 SEC
const CAFFEINATE_INTERVAL = 1000 // 1 SEC
const CAFFEINATE_COUNT = 12

class Heartbeat {
  count = 0
  restInterval?: number = undefined
  caffeineInterval?: number = undefined

  init() {
    if (!isPortal()) {
      window.onfocus = this.start
      window.onblur = this.stop
      network.on('connect', this.start)
      network.on('disconnect', this.stop)
      if (document.hasFocus()) this.start()
    }
  }

  start = () => {
    if (network.isActive() && !this.restInterval) {
      console.log('START HEARTBEAT')
      this.restInterval = window.setInterval(this.beat, HEARTBEAT_INTERVAL)
    }
  }

  stop = () => {
    if (this.restInterval) {
      console.log('STOP HEARTBEAT')
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
    console.log('START CAFFEINATE')
    if (this.caffeineInterval) window.clearInterval(this.caffeineInterval)
    this.caffeineInterval = window.setInterval(() => {
      if (this.count++ > CAFFEINATE_COUNT) {
        window.clearInterval(this.caffeineInterval)
        this.caffeineInterval = undefined
      }
      this.beat()
    }, CAFFEINATE_INTERVAL)
  }
}

export default new Heartbeat()
