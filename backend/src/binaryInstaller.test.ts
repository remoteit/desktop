import binaryInstaller from './binaryInstaller'
import remoteitInstaller from './remoteitInstaller'
import Installer from './Installer'
import environment from './environment'
import Command from './Command'
import rimraf from 'rimraf'
import tmp from 'tmp'

describe('Test framework is working', () => {
  expect(true).toBeTruthy()
})

describe('backend/binaryInstaller', () => {
  describe('installEach', () => {
    let commandSpy: jest.SpyInstance, downloadSpy: jest.SpyInstance

    beforeAll(() => {
      environment.userPath = '../jest/user'
      environment.adminPath = '../jest/admin'
      environment.binPath = '../jest/bin'

      commandSpy = jest.spyOn(Command.prototype, 'push').mockImplementation()
      downloadSpy = jest
        .spyOn(binaryInstaller, 'download')
        .mockImplementation((i: Installer, t: tmp.DirResult) => Promise.resolve())
    })

    beforeEach(() => {
      commandSpy.mockClear()
      downloadSpy.mockClear()
    })

    test('downloads and sets up an installer for Unix', async () => {
      environment.isWindows = false

      await binaryInstaller.installBinary(remoteitInstaller)

      expect(commandSpy).toBeCalledWith('mkdir -p ../jest/bin')
      expect(commandSpy).toBeCalledWith('mv undefined ../jest/bin/remoteit')
      expect(commandSpy).toBeCalledWith('chmod 755 ../jest/bin/remoteit')
      expect(commandSpy).toBeCalledWith('"../jest/bin/remoteit" tools install --update -j')

      expect(commandSpy).toBeCalledTimes(4)
      expect(downloadSpy).toBeCalledTimes(1)
    })

    test('downloads and sets up an installer for Windows', async () => {
      environment.isWindows = true

      await binaryInstaller.installBinary(remoteitInstaller)

      expect(commandSpy).toBeCalledWith('md "../jest/bin"')
      expect(commandSpy).toBeCalledWith('move /y "undefined" "../jest/bin/remoteit.exe"')
      expect(commandSpy).toBeCalledWith('icacls "../jest/bin/remoteit.exe" /T /Q /grant "*S-1-5-32-545:RX"')
      expect(commandSpy).toBeCalledWith('"../jest/bin/remoteit.exe" tools install --update -j')

      expect(commandSpy).toBeCalledTimes(4)
      expect(downloadSpy).toBeCalledTimes(1)
    })
  })

  describe('uninstallBinary', () => {
    let installSpy: jest.SpyInstance

    beforeAll(() => {
      environment.userPath = '../jest/user'
      environment.adminPath = '../jest/admin'
      environment.binPath = '../jest/bin'
      installSpy = jest.spyOn(rimraf, 'sync').mockImplementation()
    })

    beforeEach(() => {
      installSpy.mockClear()
    })

    test('removes the files from a Unix installer', async () => {
      environment.isWindows = false

      await binaryInstaller.uninstallBinary(remoteitInstaller)

      expect(installSpy).toBeCalledWith('../jest/bin/remoteit', { disableGlob: true })
      expect(installSpy).toBeCalledWith('../jest/user', { disableGlob: true })
      expect(installSpy).toHaveBeenCalledTimes(2)
    })

    test('removes the files from a Windows installer', async () => {
      environment.isWindows = true

      await binaryInstaller.uninstallBinary(remoteitInstaller)

      expect(installSpy).toBeCalledWith('../jest/bin/remoteit.exe', { disableGlob: true })
      expect(installSpy).toBeCalledWith('../jest/user', { disableGlob: true })
      expect(installSpy).toHaveBeenCalledTimes(2)
    })
  })
})
