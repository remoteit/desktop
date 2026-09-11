import { prerelease } from 'semver'

export type WindowsArch = 'ia32' | 'x64' | 'arm64'

// process.arch is the arch this build was compiled for, not the CPU; a 32-bit or x64 build
// under Windows' emulation reports itself and would keep choosing the emulated installer.
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
export function resolveNativeArchSteering(processArch: string, nativeArch: WindowsArch): WindowsArch | null {
  return nativeArch === processArch ? null : nativeArch
}

export function releaseChannel(version: string): string | null {
  const id = prerelease(version)?.[0]
  return id == null ? null : String(id)
}

// GitHubProvider's rule with pre-releases on: stable follows anything, alpha may move onto
// beta or stable, beta onto beta or stable, a custom pre-release id only onto itself.
export function isEligibleRelease(currentVersion: string, tag: string): boolean {
  const current = releaseChannel(currentVersion)
  if (current === null) return true
  const target = releaseChannel(tag)
  if (current === 'alpha') return target === null || target === 'alpha' || target === 'beta'
  if (current === 'beta') return target === null || target === 'beta'
  return target === current
}
