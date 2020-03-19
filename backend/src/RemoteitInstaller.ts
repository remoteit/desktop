import Installer from './Installer'

export default new Installer({
  name: 'remoteit',
  repoName: 'remoteit/cli',
  version: '1.0.1',
  dependencies: ['connectd', 'muxer', 'demuxer'],
})
