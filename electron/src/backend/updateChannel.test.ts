import { detectNativeWindowsArch, resolveWindowsUpdateChannel } from './updateChannel'

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

describe('resolveWindowsUpdateChannel', () => {
  test('native builds stay on latest.yml', () => {
    expect(resolveWindowsUpdateChannel('arm64', 'arm64', false)).toBe('latest')
    expect(resolveWindowsUpdateChannel('x64', 'x64', false)).toBe('latest')
    expect(resolveWindowsUpdateChannel('ia32', 'ia32', false)).toBe('latest')
  })

  test('emulated builds ask for the native manifest', () => {
    expect(resolveWindowsUpdateChannel('ia32', 'arm64', false)).toBe('latest-arm64')
    expect(resolveWindowsUpdateChannel('x64', 'arm64', false)).toBe('latest-arm64')
    expect(resolveWindowsUpdateChannel('ia32', 'x64', false)).toBe('latest-x64')
  })

  test('pre-release users are never given a custom channel', () => {
    expect(resolveWindowsUpdateChannel('ia32', 'arm64', true)).toBe('latest')
  })
})
