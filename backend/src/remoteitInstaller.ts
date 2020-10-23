import Installer from './Installer'
import { RESOURCES } from './constants'

export default new Installer({
  repoName: 'remoteit/cli',
  resources: RESOURCES,
  dependencies: ['connectd', 'muxer', 'demuxer'],
})
