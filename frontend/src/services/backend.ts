import { store } from '../store'
import io from 'socket.io-client'
import { PORT } from '../constants'

export const socket = io(`http://localhost:${PORT}`)
socket.on('connect', () => console.log('Socket connect'))
socket.on('disconnect', () => console.log('Socket disconnect'))

export const MESSAGE_TYPES: ServerMessageType[] = [
  'service/error',
  // 'service/status',
  'service/updated',
  'service/request',
  'service/connecting',
  'service/connected',
  'service/tunnel/opened',
  'service/tunnel/closed',
  'service/disconnected',
  'service/unknown-event',
  // 'service/throughput',
  // 'service/uptime',
  'connectd/install/error',
]

export function recordConnectdEvents() {
  const { addLog } = store.dispatch.logs
  addLog({
    type: 'general',
    message: 'Application starting up',
    createdAt: new Date(),
  })

  MESSAGE_TYPES.map(event =>
    socket.on(event, (data: ConnectLogMessage) =>
      addLog({
        type: data.error ? 'alert' : 'connectd',
        message: data.error ? data.error : data.raw,
        data,
        createdAt: new Date(),
      } as Log)
    )
  )
}

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
