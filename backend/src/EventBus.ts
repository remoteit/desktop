import { EventEmitter } from 'events'
import Logger from './Logger'

class EventBus extends EventEmitter {
  emit(event: string | symbol, ...args: any[]): boolean {
    Logger.debug('EMIT:', event)
    return EventEmitter.prototype.emit.apply(this, arguments as any)
  }
}

export default new EventBus()
