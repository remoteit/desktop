import { download } from './download'
import { renameSync, chmodSync } from 'fs'
import * as host from './host'

/**
 * Download connectd, move it to the PATH on the user's
 * system and then make it writable.
 *
 * @param version connectd version
 */
export async function install(
  version: string,
  progress = (percent: number) => {}
) {
  const targetPath = host.targetPath()
  const binaryName = host.binaryName()
  const tempDownloadPath = host.tempDownloadPath()

  // Download the connectd binary from Github
  await download(version, binaryName, tempDownloadPath, progress)

  // Move the downloaded file to the user's "PATH"
  renameSync(tempDownloadPath, targetPath)

  // Make the file executable
  chmodSync(targetPath, 0o755)
}
