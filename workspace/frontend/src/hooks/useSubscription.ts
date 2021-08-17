import React from 'react'
import Controller from '../services/Controller'

/**
 * Subscribe to a given WebSocket event and call the
 * function when the event is fired. Returns a function
 * to fire an event, if desired.
 *
 * @param event Socket event
 * @param handler Function to call when event is fired
 * @returns EventEmitter.emit function to emit a WS event
 */
export default function useSubscription(event: SocketEvent, handler: (...args: any[]) => void) {
  React.useEffect(() => {
    Controller.on(event, handler)
    return () => {
      Controller.off(event) //, handler)
    }
  })

  return Controller.emit
}
