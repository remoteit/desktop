import os from 'os'

/**
 * Return the binary name of connectd based on the current
 * platform and architecture. This name is what we use for
 * the name of the release on Github.
 *
 * Options:
 * - Arch: 'arm' 'arm64' 'ia32' 'mips' 'mipsel' 'ppc' 'ppc64' 's390' 's390x' 'x32' 'x64'.
 * - Platform: 'aix' 'darwin' 'freebsd' 'linux' 'openbsd' 'sunos' 'win32'
 */
export function binaryName() {
  const platform = os.platform()
  const arch = os.arch()

  if (platform === 'win32') return 'connectd.exe'

  if (platform === 'darwin') {
    return arch === 'x64' ? 'connectd.x86_64-osx' : 'connectd.x86-osx'
  }

  // TODO: Handle Linux....
  throw new Error('Platform not supported yet!')
}

/**
 * Returns the absolute path to the connectd binary on
 * this system.
 */
export function targetPath() {
  // TODO: make cross platform
  return '/usr/local/bin/connectd'
}

/**
 * Returns a temporary path on the given platform where
 * the connectd binary can be downloaded before moving to its
 * final location in the user's "PATH".
 */
export function tempDownloadPath() {
  // TODO: Make cross platform
  return `/tmp/${binaryName()}`
}
