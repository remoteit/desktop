import { HEARTBEAT_INTERVAL } from '../shared/constants'
import { emit } from './Controller'
import { store } from '../store'

class Heartbeat {
  count = 0
  interval?: number = undefined

  init() {
    window.setInterval(this.beat, HEARTBEAT_INTERVAL)
    window.onfocus = this.beat
  }

  beat() {
    const { auth } = store.getState()
    document.hasFocus() && auth.authenticated && emit('heartbeat')
  }

  caffeinate() {
    // DISABLED because we should be getting state updates from the cloudController
    // this.count = 0
    // if (this.interval) window.clearInterval(this.interval)
    // this.interval = window.setInterval(() => {
    //   if (this.count++ > 6) {
    //     window.clearInterval(this.interval)
    //     this.interval = undefined
    //   }
    //   this.beat()
    // }, 1000)
  }
}

export default new Heartbeat()
