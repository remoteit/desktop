import { store } from '../store'
import { EventEmitter } from 'events'

class Network extends EventEmitter {
  // connect, disconnect, change events are emitted

  tickDuration = 60 * 1000 // 1 minute
  sleepDuration = 60 * this.tickDuration // 1 hour
  then = Date.now()
  interval?: NodeJS.Timeout
  shouldConnect: boolean = false

  constructor() {
    super()
    this.monitorSleep()
    window.addEventListener('online', this.online)
    window.addEventListener('offline', this.offline)
    window.addEventListener('focus', this.focus)
  }

  log(...args) {
    console.log(`%c${args[0]}`, 'color:red;font-weight:bold', ...args.slice(1))
  }

  monitorSleep() {
    this.then = Date.now()
    this.interval = setInterval(this.tick, this.tickDuration)
  }

  isActive() {
    return document.hasFocus() && navigator.onLine
  }

  tick = () => {
    var now = Date.now()
    if (now - this.then > this.sleepDuration) this.awake()
    this.then = now
  }

  awake = () => {
    this.log('WAKE')
    this.shouldConnect = true
  }

  focus = () => {
    this.connect()
  }

  offline = () => {
    if (navigator.onLine) return
    this.log('DISCONNECT')
    store.dispatch.ui.set({
      offline: { title: 'Disconnected', message: 'Internet access is required.', severity: 'warning' },
    })
    this.shouldConnect = true
    this.emit('disconnect')
  }

  online = () => {
    if (!navigator.onLine) return
    this.log('NETWORK ONLINE')
    store.dispatch.ui.set({ offline: undefined })
    this.connect()
  }

  connect = () => {
    if (this.shouldConnect && this.isActive()) {
      this.shouldConnect = false
      this.emit('connect')
      this.log('CONNECT')
    }
  }

  emit(event: string | symbol, ...args: any[]) {
    super.emit('change', ...args)
    super.emit(event, ...args)
    return true
  }
}

export default new Network()
