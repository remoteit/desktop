import { EventEmitter } from 'events'

class EventBus extends EventEmitter {
  emit(event: string | symbol, ...args: any[]): boolean {
    // console.log('EMIT:', event, args)
    return EventEmitter.prototype.emit.apply(this, arguments as any)
  }
}

export default new EventBus()
