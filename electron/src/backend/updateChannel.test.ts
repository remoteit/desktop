import { detectNativeWindowsArch, resolveNativeArchSteering, releaseChannel, isEligibleRelease } from './updateChannel'

describe('detectNativeWindowsArch', () => {
  const env = (PROCESSOR_ARCHITECTURE?: string, PROCESSOR_ARCHITEW6432?: string) => ({
    PROCESSOR_ARCHITECTURE,
    PROCESSOR_ARCHITEW6432,
  })

  test('native builds report their own arch', () => {
    expect(detectNativeWindowsArch('arm64', false, env('ARM64'))).toBe('arm64')
    expect(detectNativeWindowsArch('x64', false, env('AMD64'))).toBe('x64')
    expect(detectNativeWindowsArch('ia32', false, env('x86'))).toBe('ia32')
  })

  test('32-bit build on x64 Windows sees the machine through WOW64', () => {
    expect(detectNativeWindowsArch('ia32', false, env('x86', 'AMD64'))).toBe('x64')
  })

  test('emulated builds on ARM64 are detected by Electron or by the WOW variables', () => {
    expect(detectNativeWindowsArch('ia32', true, env('x86'))).toBe('arm64')
    expect(detectNativeWindowsArch('ia32', false, env('x86', 'ARM64'))).toBe('arm64')
    expect(detectNativeWindowsArch('x64', true, env('AMD64'))).toBe('arm64')
  })
})

describe('resolveNativeArchSteering', () => {
  test('native builds are not steered', () => {
    expect(resolveNativeArchSteering('arm64', 'arm64')).toBeNull()
    expect(resolveNativeArchSteering('x64', 'x64')).toBeNull()
    expect(resolveNativeArchSteering('ia32', 'ia32')).toBeNull()
  })

  test('emulated builds are steered to the native arch', () => {
    expect(resolveNativeArchSteering('ia32', 'arm64')).toBe('arm64')
    expect(resolveNativeArchSteering('x64', 'arm64')).toBe('arm64')
    expect(resolveNativeArchSteering('ia32', 'x64')).toBe('x64')
  })
})

describe('releaseChannel', () => {
  test('reads the pre-release id, with or without a v prefix', () => {
    expect(releaseChannel('3.48.4')).toBeNull()
    expect(releaseChannel('v3.48.4')).toBeNull()
    expect(releaseChannel('v3.49.0-beta.2')).toBe('beta')
    expect(releaseChannel('3.49.0-nightly.7')).toBe('nightly')
  })
})

describe('isEligibleRelease', () => {
  test('stable releases are always eligible', () => {
    expect(isEligibleRelease('3.48.4', 'v3.48.5', false)).toBe(true)
    expect(isEligibleRelease('3.49.0-beta.1', 'v3.49.0', true)).toBe(true)
  })

  test('pre-releases need the flag', () => {
    expect(isEligibleRelease('3.48.4', 'v3.49.0-beta.1', false)).toBe(false)
    expect(isEligibleRelease('3.48.4', 'v3.49.0-beta.1', true)).toBe(true)
  })

  test('beta never moves onto alpha, alpha may move onto beta', () => {
    expect(isEligibleRelease('3.49.0-beta.1', 'v3.49.0-alpha.3', true)).toBe(false)
    expect(isEligibleRelease('3.49.0-alpha.1', 'v3.49.0-beta.1', true)).toBe(true)
    expect(isEligibleRelease('3.49.0-beta.1', 'v3.49.0-beta.2', true)).toBe(true)
  })

  test('custom channels follow only themselves', () => {
    expect(isEligibleRelease('3.49.0-nightly.1', 'v3.49.0-nightly.2', true)).toBe(true)
    expect(isEligibleRelease('3.49.0-nightly.1', 'v3.49.0-beta.2', true)).toBe(false)
    expect(isEligibleRelease('3.49.0-beta.1', 'v3.49.0-nightly.2', true)).toBe(false)
  })
})
