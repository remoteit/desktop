import Installer from './Installer'
import { RESOURCES } from './constants'

export default new Installer({
  repoName: 'remoteit/cli',
  name: 'remoteit',
  version: RESOURCES[0].version,
  dependencies: ['connectd', 'muxer', 'demuxer'],
})
