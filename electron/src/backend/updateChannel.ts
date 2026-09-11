import { prerelease } from 'semver'

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

// The arch to steer updates to, or null when this build already matches the machine.
// electron-updater matches `files` entries on process.arch, so a native build finds
// itself in latest.yml; a build running under emulation would re-install the emulated
// arch forever and needs latest-<arch>.yml (scripts/finalize-win-update-manifests.js).
export function resolveNativeArchSteering(processArch: string, nativeArch: WindowsArch): WindowsArch | null {
  return nativeArch === processArch ? null : nativeArch
}

export function releaseChannel(version: string): string | null {
  const id = prerelease(version)?.[0]
  return id == null ? null : String(id)
}

// Mirrors GitHubProvider's rule for which release a client may move to: stable follows
// anything, alpha/beta rank against each other, a custom pre-release id only follows itself.
export function isEligibleRelease(currentVersion: string, tag: string, allowPrerelease: boolean): boolean {
  const target = releaseChannel(tag)
  if (target === null) return true
  if (!allowPrerelease) return false
  const current = releaseChannel(currentVersion)
  if (current === null) return true
  if (current === 'alpha' || current === 'beta') {
    if (target !== 'alpha' && target !== 'beta') return false
    return !(current === 'beta' && target === 'alpha')
  }
  return target === current
}
