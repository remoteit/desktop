import { HEARTBEAT_INTERVAL } from '../shared/constants'
import { emit } from './Controller'
import { store } from '../store'

export default class Heartbeat {
  constructor() {
    setInterval(this.heartbeat, HEARTBEAT_INTERVAL)
    window.onfocus = this.heartbeat
  }

  heartbeat() {
    const { auth } = store.getState()
    document.hasFocus() && auth.authenticated && emit('heartbeat')
  }
}
