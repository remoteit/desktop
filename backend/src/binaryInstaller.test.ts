import binaryInstaller from './binaryInstaller'
import remoteiInstaller from './remoteiInstaller'
import environment from./Binaryment'
import user from './User'
import Command from './Command'
import rimraf from 'rimraf'

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
    })

    beforeEach(() => {
      commandSpy.mockClear()
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

      await binaryInstaller.uninstallBinaries(remoteiInstaller)

      expect(installSpy).toBeCalledWith('../jest/bin/remoteit', { disableGlob: true })
      expect(installSpy).toBeCalledWith('../jest/user', { disableGlob: true })
      expect(installSpy).toHaveBeenCalledTimes(2)
    })

    test('removes the files from a Windows installer', async () => {
      environment.isWindows = true

      await binaryInstaller.uninstallBinaries(remoteiInstaller)

      expect(installSpy).toBeCalledWith('../jest/bin/remoteit.exe', { disableGlob: true })
      expect(installSpy).toBeCalledWith('../jest/user', { disableGlob: true })
      expect(installSpy).toHaveBeenCalledTimes(2)
    })
  })
})
