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
  test('a stable client follows anything', () => {
    expect(isEligibleRelease('3.48.4', 'v3.48.5')).toBe(true)
    expect(isEligibleRelease('3.48.4', 'v3.49.0-alpha.1')).toBe(true)
  })

  test('alpha and beta clients rank against each other and may move to stable', () => {
    expect(isEligibleRelease('3.49.0-alpha.1', 'v3.49.0-beta.1')).toBe(true)
    expect(isEligibleRelease('3.49.0-beta.1', 'v3.49.0-alpha.3')).toBe(false)
    expect(isEligibleRelease('3.49.0-beta.1', 'v3.49.0-beta.2')).toBe(true)
    expect(isEligibleRelease('3.49.0-beta.1', 'v3.49.0')).toBe(true)
    expect(isEligibleRelease('3.49.0-alpha.1', 'v3.49.0-nightly.2')).toBe(false)
  })

  test('a custom channel follows only itself', () => {
    expect(isEligibleRelease('3.49.0-nightly.1', 'v3.49.0-nightly.2')).toBe(true)
    expect(isEligibleRelease('3.49.0-nightly.1', 'v3.49.0-beta.2')).toBe(false)
    expect(isEligibleRelease('3.49.0-nightly.1', 'v3.49.0')).toBe(false)
  })
})
