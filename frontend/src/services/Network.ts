import { dispatch } from '../store'
import { EventEmitter } from 'events'

class Network extends EventEmitter {
  // connect, disconnect, change events are emitted

  tickDuration = 60 * 1000 // 1 minute
  sleepDuration = 30 * this.tickDuration // 30 minutes
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
    this.connect()
  }

  focus = () => {
    this.connect()
  }

  offline = () => {
    if (navigator.onLine) return
    this.log('DISCONNECT')
    dispatch.ui.set({
      offline: { title: 'Disconnected', message: 'Internet access is required.', severity: 'warning' },
      network: false,
    })
    this.shouldConnect = true
    this.emit('disconnect')
  }

  online = () => {
    if (!navigator.onLine) return
    this.log('NETWORK ONLINE')
    dispatch.ui.set({ offline: undefined })
    this.connect()
  }

  connect = () => {
    if (this.shouldConnect && this.isActive()) {
      this.shouldConnect = false
      dispatch.ui.set({ network: true })
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
