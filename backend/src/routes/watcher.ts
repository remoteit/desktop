import socketIO from 'socket.io'
import { watch } from '../connectd/watch'
import logger from '../utils/logger'

export function watcher(socket: socketIO.Socket) {
  logger.info('Watching for file change')
  return watch()
    .on('ready', () => socket.emit('connectd/file/watching'))
    .on('added', (file: string) => socket.emit('connectd/file/added', file))
    .on('updated', (file: string) => socket.emit('connectd/file/updated', file))
    .on('removed', (file: string) => socket.emit('connectd/file/removed', file))
    .on('error', (error: Error) => socket.emit('connectd/file/error', error))
}
