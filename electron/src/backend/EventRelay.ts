import { EventEmitter } from 'events'

/**
 * Forward a set of events from one EventEmitter to another.
 */
export default class EventRelay {
  constructor(events: string[], from: EventEmitter, to: EventEmitter) {
    events.map(event =>
      from.on(event, (...args: any[]) => to.emit(event, ...args))
    )
  }
}
