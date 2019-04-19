import { targetPath } from './platform'
import chokidar from 'chokidar'
import debug from 'debug'
import { EventEmitter } from 'events'

const d = debug('r3:connectd:watch')

/**
 * Watch the connectd binary target path for changes. If
 * it is created, updated or removed, report that event
 * so we can display that information in the UI.
 *
 * We return our own EventEmitter so we can have a more
 * standard event API than chokidar comes with by default.
 *
 * @example
 * watch()
 *   .on('ready', () => console.log('watching for changes'))
 *   .on('added', file => console.log('added file', file))
 *   .on('updated', file => console.log('updated file', file))
 *   .on('removed', file => console.log('removed file', file))
 *   .on('error', error => console.log('error', error))
 */
export function watch() {
  const emitter = new EventEmitter()

  chokidar
    .watch(targetPath())
    .on('ready', () => {
      d('Initial scan complete. Ready for changes')
      emitter.emit('ready')
    })
    .on('add', path => {
      d(`File ${path} has been added`)
      emitter.emit('added', path)
    })
    .on('change', path => {
      d(`File ${path} has been changed`)
      emitter.emit('updated', path)
    })
    .on('unlink', path => {
      d(`File ${path} has been removed`)
      emitter.emit('removed', path)
    })
    .on('error', error => {
      console.error(`Watcher error: ${error}`)
      emitter.emit('error', error)
    })
  // .on('raw', (event, path, details) => {
  //   console.log('Raw event info:', event, path, details)
  // })

  return emitter
}
