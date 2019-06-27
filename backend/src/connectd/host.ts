import os from 'os'
import * as Platform from '../services/Platform'
import { REMOTEIT_BINARY_PATH } from '../constants'

const arch = os.arch()

/**
 * Return the binary name of connectd based on the current
 * platform and architecture. This name is what we use for
 * the name of the release on Github.
 *
 * Options:
 * - Arch: 'arm' 'arm64' 'ia32' 'mips' 'mipsel' 'ppc' 'ppc64' 's390' 's390x' 'x32' 'x64'.
 * - Platform: 'aix' 'darwin' 'freebsd' 'linux' 'openbsd' 'sunos' 'win32'
 */
export const binaryName = Platform.isWindows
  ? 'connectd.exe'
  : arch === 'x64'
  ? 'connectd.x86_64-osx'
  : 'connectd.x86-osx'

/**
 * Returns a temporary path on the given platform where
 * the connectd binary can be downloaded before moving to its
 * final location in the user's "PATH".
 */
export const tempDownloadPath = REMOTEIT_BINARY_PATH

// TODO: make cross platform
export function moveAndUpdatePermissionsCommand() {
  if (Platform.isMac) {
    // const copyCmd = `cp ${tempDownloadPath} ${REMOTEIT_BINARY_PATH}`
    // const permissionCmd = `chmod 755 ${REMOTEIT_BINARY_PATH}`
    // return `${copyCmd} && ${permissionCmd}`
    return `chmod 755 ${REMOTEIT_BINARY_PATH}`
  }

  if (Platform.isWindows) {
    const copyCmd = `copy ${tempDownloadPath} ${REMOTEIT_BINARY_PATH}`
    // const permissionCmd = `attrib 755 ${REMOTEIT_BINARY_PATH}`
    return copyCmd //`${copyCmd} && ${permissionCmd}`
  }

  throw new Error('Platform not supported!')
}
