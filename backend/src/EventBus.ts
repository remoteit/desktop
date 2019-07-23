import { EventEmitter } from 'events'

class EventBus extends EventEmitter {}

export default new EventBus()
