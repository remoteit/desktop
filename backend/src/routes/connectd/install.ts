import debug from 'debug'
import socketIO from 'socket.io'
import { LATEST_CONNECTD_RELEASE } from '../../constants'
import { toPercent } from '../../utils/toPercent'
import * as track from '../../utils/analytics'
import * as connectd from '../../connectd/install'

const d = debug('r3:desktop:backend:routes:connectd:install')

export function install(socket: socketIO.Socket) {
  return async () => {
    d('Starting connectd install')

    await connectd.install(LATEST_CONNECTD_RELEASE, percent => {
      d(`Progress: ${toPercent(percent)}%`)
      socket.emit('connectd/install/progress', toPercent(percent))
    })

    socket.emit('connectd/install/done', LATEST_CONNECTD_RELEASE)

    d('Install of connectd complete')

    track.event('connectd', 'install', 'Installing connectd')
  }
}
