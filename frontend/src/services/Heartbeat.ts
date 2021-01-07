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
}

export default new Heartbeat()
