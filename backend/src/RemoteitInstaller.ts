import Installer from './Installer'

export default new Installer({
  name: 'remoteit',
  repoName: 'remoteit/cli',
  version: '0.37.2',
  dependencies: ['connectd', 'muxer', 'demuxer'],
})
