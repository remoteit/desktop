export type WindowsArch = 'ia32' | 'x64' | 'arm64'

// The CPU Windows is running on, as opposed to process.arch, which is the arch this
// build was compiled for. A 32-bit or x64 build under Windows' emulation reports
// itself, so it would keep choosing the emulated installer.
export function detectNativeWindowsArch(
  processArch: string,
  runningUnderARM64Translation: boolean,
  env: NodeJS.ProcessEnv
): WindowsArch {
  const archVars = `${env.PROCESSOR_ARCHITECTURE || ''} ${env.PROCESSOR_ARCHITEW6432 || ''}`.toUpperCase()
  if (processArch === 'arm64' || runningUnderARM64Translation || archVars.includes('ARM64')) return 'arm64'
  if (processArch === 'x64' || archVars.includes('AMD64')) return 'x64'
  return 'ia32'
}

// Which manifest to ask the release for. electron-updater matches `files` entries on
// process.arch, so a native build finds itself in latest.yml. An emulated build needs
// latest-<arch>.yml (written by scripts/finalize-win-update-manifests.js) to move to
// the native installer. GitHubProvider resolves pre-release tags by channel name, so a
// custom channel cannot be combined with allowPrerelease - those users stay put.
export function resolveWindowsUpdateChannel(
  processArch: string,
  nativeArch: WindowsArch,
  allowPrerelease: boolean
): string {
  if (allowPrerelease || nativeArch === processArch) return 'latest'
  return `latest-${nativeArch}`
}
