import { EventEmitter } from 'events'
import debug from 'debug'

const d = debug('r3:backend:event')

class EventBus extends EventEmitter {
  emit(event: string | symbol, ...args: any[]): boolean {
    d('EMIT:', event)
    return EventEmitter.prototype.emit.apply(this, arguments as any)
  }
}

export default new EventBus()
