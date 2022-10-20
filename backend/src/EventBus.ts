import { EventEmitter } from 'events'
import Logger from './Logger'

class EventBus extends EventEmitter {
  emit(event: string | symbol, ...args: any[]): boolean {
    // Logger.info('EMIT:', { event, length: args.length })
    return EventEmitter.prototype.emit.apply(this, [event, ...args])
  }
}

export default new EventBus()
