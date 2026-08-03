import { dispatch } from '../store'
import { EventEmitter } from 'events'

class Network extends EventEmitter {
  // connect, active, disconnect, change events are emitted
  //
  // connect - connectivity is back, so anything holding a socket should re-open it.
  //   Fires whether or not the window has focus: a backgrounded app that waits for
  //   focus sits with dead sockets, and the cloud socket in particular has no other
  //   way back (close() drops its listeners, so it can't self-retry).
  // active - connectivity is back AND the window has focus. For the expensive work
  //   (a full cloud sync) that's only worth doing when someone is looking at it.

  tickDuration = 60 * 1000 // 1 minute
  sleepDuration = 10 * this.tickDuration // 10 minutes
  shouldConnect: boolean = false
  shouldSync: boolean = false
  interval?: NodeJS.Timeout
  then = 0

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
    this.interval = setInterval(this.tick, this.tickDuration)
    if (Date.now() - this.then > this.sleepDuration) this.log('SHOULD AWAKE')
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
    })
    this.shouldConnect = true
    this.emit('disconnect')
  }

  online = () => {
    if (!navigator.onLine) return
    this.log('NETWORK ONLINE')
    dispatch.ui.set({ offline: undefined })
    // the browser only fires this on a transition, so it's the definitive
    // "connectivity restored" signal - don't depend on a matching offline event
    // having set this, it may have been consumed or missed
    this.shouldConnect = true
    this.connect()
  }

  connect = () => {
    if (this.shouldConnect && navigator.onLine) {
      this.shouldConnect = false
      this.shouldSync = true // every reconnect owes a sync, paid once in front
      this.log('CONNECT')
      this.emit('connect')
    }
    if (this.shouldSync && this.isActive()) {
      this.shouldSync = false
      this.log('ACTIVE')
      this.emit('active')
    }
  }

  emit(event: string | symbol, ...args: any[]) {
    super.emit('change', ...args)
    super.emit(event, ...args)
    return true
  }
}

export default new Network()
