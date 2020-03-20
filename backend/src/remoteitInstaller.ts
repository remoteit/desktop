import Installer from './Installer'
import { CLI_VERSION } from './constants'

export default new Installer({
  name: 'remoteit',
  repoName: 'remoteit/cli',
  version: CLI_VERSION,
  dependencies: ['connectd', 'muxer', 'demuxer'],
})
