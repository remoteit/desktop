import os from 'os'
import path from 'path'
import { isWindows, isMac, pathDir } from '../services/Platform'

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
export const binaryName = isWindows
  ? 'connectd.exe'
  : arch === 'x64'
  ? 'connectd.x86_64-osx'
  : 'connectd.x86-osx'

/**
 * Returns the absolute path to the connectd binary on
 * this system.
 */
export const targetPath = path.join(
  pathDir,
  isWindows ? 'connectd.exe' : 'connectd'
)

/**
 * Returns a temporary path on the given platform where
 * the connectd binary can be downloaded before moving to its
 * final location in the user's "PATH".
 */
export const tempDownloadPath = targetPath
// export const tempDownloadPath = path.join(tmpDir, binaryName)

// TODO: make cross platform
export function moveAndUpdatePermissionsCommand() {
  if (isMac) {
    // const copyCmd = `cp ${tempDownloadPath} ${targetPath}`
    // const permissionCmd = `chmod 755 ${targetPath}`
    // return `${copyCmd} && ${permissionCmd}`
    return `chmod 755 ${targetPath}`
  }

  if (isWindows) {
    const copyCmd = `copy ${tempDownloadPath} ${targetPath}`
    // const permissionCmd = `attrib 755 ${targetPath}`
    return copyCmd //`${copyCmd} && ${permissionCmd}`
  }

  throw new Error('Platform not supported!')
}
