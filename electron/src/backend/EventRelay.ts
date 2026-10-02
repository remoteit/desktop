import { EventEmitter } from 'events'

type Emitter = { emit: (event: string, ...args: any[]) => unknown }

/**
 * Forward a set of events from one EventEmitter to another.
 */
export default class EventRelay {
  constructor(events: string[], from: EventEmitter, to: Emitter) {
    events.map(event =>
      from.on(event, (...args: any[]) => to.emit(event, ...args))
    )
  }
}
