import Installer from './Installer'
import {
  BASE_URL,
  CLI_URL,
  CLI_VERSION,
  CONNECTD_URL,
  CONNECTD_VERSION,
  DEMUXER_VERSION,
  MUXER_VERSION,
} from './constants'

export default new Installer({
  name: 'remoteit',
  repoName: 'remoteit/cli',
  version: CLI_VERSION,
  versionMuxer: MUXER_VERSION,
  versionDemuxer: DEMUXER_VERSION,
  versionConnectd: CONNECTD_VERSION,
  baseUrl: BASE_URL,
  cliUrl: CLI_URL,
  connectdUrl: CONNECTD_URL,
  dependencies: ['connectd', 'muxer', 'demuxer'],
})
