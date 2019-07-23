import React from 'react'
import BackendAdapter from '../services/BackendAdapter'

/**
 * Subscribe to a given WebSocket event and call the
 * function when the event is fired. Returns a function
 * to fire an event, if desired.
 *
 * @param event Socket event
 * @param handler Function to call when event is fired
 * @returns EventEmitter.emit function to emit a WS event
 */
export default function useSubscription(
  event: SocketEvent,
  handler: (...args: any[]) => void
) {
  React.useEffect(() => {
    BackendAdapter.on(event, handler)
    return () => {
      BackendAdapter.off(event) //, handler)
    }
  })

  return BackendAdapter.emit
}
