import * as Platform from '../services/Platform'
import { REMOTEIT_BINARY_PATH } from '../constants'

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
