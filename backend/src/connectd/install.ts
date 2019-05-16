import debug from 'debug'
import { download } from './download'
import * as host from './host'
import * as sudo from 'sudo-prompt'
import { LATEST_CONNECTD_RELEASE } from '../constants'
import { existsSync } from 'fs'

const d = debug('r3:desktop:backend:connectd:install')

/**
 * Download connectd, move it to the PATH on the user's
 * system and then make it writable.
 */
export function install(version: string, progress = (percent: number) => {}) {
  const targetPath = host.targetPath()
  const binaryName = host.binaryName()
  const tempDownloadPath = host.tempDownloadPath()
  const permission = 0o755

  d('Attempting to install connectd: %O', {
    targetPath,
    binaryName,
    tempDownloadPath,
    permission,
  })

  // Download the connectd binary from Github
  return download(version, binaryName, tempDownloadPath, progress).then(
    moveAndUpdatePermissions
  )
}

/**
 * Install connectd if it is missing from the host system.
 */
export async function installConnectdIfMissing() {
  if (isConnectdInstalled()) return

  d('connectd is not installed, attempting to install now')

  return install(LATEST_CONNECTD_RELEASE)
}

/**
 * Return whether or not connectd exists where we expect it. Used
 * to decide if we install connectd or not on startup.
 */
export function isConnectdInstalled() {
  // TODO: we should probably make sure the output of connectd is what
  // we expect it to be and it is the right version
  return existsSync(host.targetPath())
}

function moveAndUpdatePermissions() {
  return new Promise((success, failure) => {
    var options = {
      name: 'remoteit',
      // icns: '/Applications/Electron.app/Contents/Resources/Electron.icns', // (optional)
    }
    const cmd = host.moveAndUpdatePermissionsCommand()
    d('Running command:', cmd)
    sudo.exec(cmd, options, (error: Error, stdout: any, stderr: any) => {
      d('Command error:', error)
      d('Command stderr:', stderr)
      d('Command stdout:', stdout)
      if (error) return failure(error)
      if (stderr) return failure(stderr)
      success(stdout)
    })
  })
}
