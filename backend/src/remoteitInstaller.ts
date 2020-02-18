import Installer from './Installer'

export default new Installer({
  name: 'remoteit',
  repoName: 'remoteit/cli',
  version: '0.37.6',
  dependencies: ['connectd', 'muxer', 'demuxer'],
})
