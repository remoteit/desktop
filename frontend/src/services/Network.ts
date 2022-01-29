import { store } from '../store'
import { EventEmitter } from 'events'

class Network extends EventEmitter {
  // connect, disconnect, change events are emitted

  tickDuration = 1000
  sleepDuration = 60 * this.tickDuration
  then = Date.now()
  interval?: NodeJS.Timeout

  constructor() {
    super()
    this.monitorSleep()
    window.addEventListener('online', this.online)
    window.addEventListener('offline', this.offline)
  }

  log(...args) {
    console.log(`%c${args[0]}`, 'color:red;font-weight:bold', ...args.slice(1))
  }

  monitorSleep() {
    this.then = Date.now()
    this.interval = setInterval(this.tick, this.tickDuration)
  }

  tick = () => {
    var now = Date.now()
    if (now - this.then > this.sleepDuration) this.awake()
    this.then = now
  }

  awake = () => {
    this.log('SYSTEM WAKE')
    this.emit('connect')
  }

  offline = () => {
    this.log('NETWORK OFFLINE')
    store.dispatch.ui.set({ offline: !navigator.onLine })
    this.emit('disconnect')
  }

  online = () => {
    this.log('NETWORK ONLINE')
    const online = navigator.onLine
    store.dispatch.ui.set({ offline: !online })
    if (online) this.emit('connect')
  }

  emit(event: string | symbol, ...args: any[]) {
    super.emit('change', ...args)
    super.emit(event, ...args)
    return true
  }
}

export default new Network()
