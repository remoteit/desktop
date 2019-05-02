import io from 'socket.io-client'

// TODO: move to env var
const PORT = 29999

export const socket = io(`http://localhost:${PORT}`)
socket.on('connect', () => console.log('connect'))
socket.on('disconnect', () => console.log('connect'))

/**
 * A promisified version of the Socket.io event emitter
 * that has a built in timeout.
 */
export function emit<T>(
  message: string,
  data: any = {},
  timeout: number = 0
): Promise<T> {
  return new Promise((success, failure) => {
    // If the user sets a timeout, create a timer that
    // will fail the promise if it elapses.
    let timer: NodeJS.Timeout | undefined
    if (timeout > 0) {
      timer = setTimeout(() => {
        failure(new Error('Request timed out'))
      }, timeout)
    }

    socket.emit(message, data, (resp: T) => {
      success(resp)
      if (timer) clearTimeout(timer)
    })
  })
}
