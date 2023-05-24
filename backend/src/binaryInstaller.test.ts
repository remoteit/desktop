import { BinaryInstaller } from './binaryInstaller'
import environment from './environment'
import versionJson from './cli-version.json'
import Command from './Command'
import rimraf from 'rimraf'
import Binary from './Binary'
import preferences from './preferences'
import EventBus from './EventBus'
import path from 'path'
import cli from './cliInterface'
import fs from 'fs'

describe('Test framework is working', () => {
  expect(true).toBeTruthy()
})

describe('backend/binaryInstaller', () => {
  const version = '0.37.6'
  const agentVersion = '0.37.6'
  const desktopVersion = '3.0.0'
  const cliBinary = new Binary({ name: 'remoteit', version, isCli: true })
  const binaryInstaller = new BinaryInstaller(
    [
      cliBinary,
      new Binary({ name: 'muxer', version: '1' }),
      new Binary({ name: 'demuxer', version: '1' }),
      new Binary({ name: 'connectd', version: '1' }),
    ],
    cliBinary
  )

  describe('installBinaries', () => {
    let commandSpy: jest.SpyInstance

    beforeAll(() => {
      environment.userPath = '../jest/user'
      environment.adminPath = '../jest/admin'
      environment.binPath = '../jest/bin'

      commandSpy = jest.spyOn(Command.prototype, 'push').mockImplementation()
    })

    beforeEach(() => {
      commandSpy.mockClear()
    })

    test('restarts and installs the system service', () => {
      // test here
    })

    test('creates the symlinks on mac', () => {
      // test here
    })

    test('adds the PATH on windows', () => {
      // test here
    })

    test('uninstalls the previous version', () => {
      // test here
    })
  })

  describe('uninstallBinary', () => {
    let installSpy: jest.SpyInstance
    let commandSpy: jest.SpyInstance
    let existsSpy: jest.SpyInstance
    let lstatSpy: jest.SpyInstance

    beforeAll(() => {
      environment.symlinkPath = path.resolve('../jest/symlink/')
      environment.binPath = path.resolve('../jest/bin/')
      installSpy = jest.spyOn(rimraf, 'sync').mockImplementation()
      commandSpy = jest.spyOn(Command.prototype, 'push').mockImplementation()
      existsSpy = jest.spyOn(fs, 'existsSync').mockImplementation(() => true)
      lstatSpy = jest.spyOn(fs, 'lstatSync').mockImplementation(() => ({ isSymbolicLink: () => false } as any))
    })

    beforeEach(() => {
      installSpy.mockClear()
      commandSpy.mockClear()
      existsSpy.mockClear()
      lstatSpy.mockClear()
    })

    test('removes the files from a mac installer when not headless', async () => {
      environment.isWindows = false
      environment.isHeadless = false

      await binaryInstaller.uninstall()

      expect(commandSpy).toBeCalledWith(`"${environment.binPath}/remoteit" -j agent uninstall`)
      expect(commandSpy).toBeCalledWith(`rm -f "${environment.symlinkPath}/remoteit"`)
      expect(commandSpy).toBeCalledWith(`rm -f "${environment.symlinkPath}/connectd"`)
      expect(commandSpy).toBeCalledWith(`rm -f "${environment.symlinkPath}/muxer"`)
      expect(commandSpy).toBeCalledWith(`rm -f "${environment.symlinkPath}/demuxer"`)
      expect(commandSpy).toHaveBeenCalledTimes(5)
    })

    test('does not remove files if headless', async () => {
      environment.isWindows = false
      environment.isHeadless = true

      await binaryInstaller.uninstall()
      expect(commandSpy).toBeCalledWith('"remoteit" -j agent uninstall')
      expect(commandSpy).toHaveBeenCalledTimes(1)
    })

    test('removes no files from a Windows installer', async () => {
      environment.isWindows = true
      environment.isHeadless = false

      await binaryInstaller.uninstall()
      expect(commandSpy).toBeCalledWith(`"${environment.binPath}/remoteit.exe" -j agent uninstall`)
      expect(commandSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('check', () => {
    const outdated = '0.30.1'
    const name = 'remoteit'

    let installSpy: jest.SpyInstance
    let eventSpy: jest.SpyInstance
    let versionSpy: jest.SpyInstance
    let agentVersionSpy: jest.SpyInstance
    let prefSpy: jest.SpyInstance
    let agentSpy: jest.SpyInstance
    let binary: Binary
    let path: string

    beforeAll(() => {
      environment.isWindows = false
      binary = new Binary({ name, version })
      path = binary.path
    })

    beforeEach(() => {
      prefSpy = jest
        .spyOn(preferences, 'get')
        .mockImplementation(() => ({ version: desktopVersion, cliVersion: versionJson.cli }))
      installSpy = jest.spyOn(binaryInstaller, 'install').mockImplementation()
      eventSpy = jest.spyOn(EventBus, 'emit').mockImplementation()
      agentSpy = jest.spyOn(cli, 'agentRunning').mockImplementation(() => Promise.resolve(true))
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve(version))
      agentVersionSpy = jest.spyOn(cli, 'agentVersion').mockImplementation(() => Promise.resolve(agentVersion))
      jest.spyOn(fs, 'existsSync').mockImplementation(() => true)
      environment.version = desktopVersion
    })

    afterEach(() => {
      prefSpy.mockClear()
      installSpy.mockClear()
      eventSpy.mockClear()
      versionSpy.mockClear()
      agentVersionSpy.mockClear()
      agentSpy.mockClear()
    })

    test('should notify if installed', async () => {
      await binaryInstaller.check()

      expect(installSpy).toBeCalledTimes(0)
      expect(eventSpy).toBeCalledTimes(1)
      expect(versionSpy).toBeCalledTimes(1)
      expect(eventSpy).toBeCalledWith('binary/installed', { path, version, name, installedVersion: version })
      expect(versionSpy).toBeCalledTimes(1)
    })

    test('should notify if agent is not installed', async () => {
      jest.spyOn(fs, 'existsSync').mockImplementation(() => true)
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve(version))
      agentVersionSpy = jest.spyOn(cli, 'agentVersion').mockImplementation(() => Promise.resolve(agentVersion))
      agentSpy = jest.spyOn(cli, 'agentRunning').mockImplementation(() => Promise.resolve(false))

      await binaryInstaller.check()

      expect(installSpy).toBeCalledTimes(0)
      expect(eventSpy).toBeCalledTimes(1)
      expect(versionSpy).toBeCalledTimes(1)
      expect(eventSpy).toBeCalledWith('binary/not-installed', name)
      expect(versionSpy).toBeCalledTimes(1)
    })

    test('should notify if agent version is wrong', async () => {
      jest.spyOn(fs, 'existsSync').mockImplementation(() => true)
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve(version))
      agentVersionSpy = jest.spyOn(cli, 'agentVersion').mockImplementation(() => Promise.resolve('2.0.0'))

      await binaryInstaller.check()

      expect(installSpy).toBeCalledTimes(0)
      expect(eventSpy).toBeCalledTimes(1)
      expect(agentVersionSpy).toBeCalledTimes(2)
      expect(eventSpy).toBeCalledWith('binary/not-installed', name)
      expect(agentVersionSpy).toBeCalledTimes(2)
    })

    test('should notify with different installed cli version', async () => {
      const installedVersion = '0.40.0'

      jest.spyOn(fs, 'existsSync').mockImplementation(() => true)
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve(installedVersion))
      agentVersionSpy = jest.spyOn(cli, 'agentVersion').mockImplementation(() => Promise.resolve(agentVersion))

      await binaryInstaller.check()

      expect(installSpy).toBeCalledTimes(0)
      expect(eventSpy).toBeCalledTimes(1)
      expect(eventSpy).toBeCalledWith('binary/installed', { path, version, name, installedVersion })
      expect(versionSpy).toBeCalledTimes(1)
    })

    test('should notify if cli outdated', async () => {
      jest.spyOn(fs, 'existsSync').mockImplementation(() => true)
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve(outdated))
      agentVersionSpy = jest.spyOn(cli, 'agentVersion').mockImplementation(() => Promise.resolve(agentVersion))

      await binaryInstaller.check()

      expect(installSpy).toBeCalledTimes(0)
      expect(eventSpy).toBeCalledTimes(1)
      expect(eventSpy).toBeCalledWith('binary/not-installed', name)
      expect(versionSpy).toBeCalledTimes(1)
    })

    test('should notify if desktop version updated', async () => {
      const newerVersion = '3.0.1'
      environment.version = newerVersion

      await binaryInstaller.check()

      expect(installSpy).toBeCalledTimes(0)
      expect(eventSpy).toBeCalledTimes(1)
      expect(eventSpy).toBeCalledWith('binary/not-installed', name)
      expect(versionSpy).toBeCalledTimes(1)
    })

    test('should not notify as installed if desktop version same', async () => {
      await binaryInstaller.check()

      console.log('eventSpy', eventSpy.mock.calls)
      console.log('versions', versionSpy.mock.calls, environment.version, prefSpy.mock.calls)

      expect(installSpy).toBeCalledTimes(0)
      expect(eventSpy).toBeCalledTimes(1)
      expect(eventSpy).toBeCalledWith('binary/installed', { path, version, name, installedVersion: version })
      expect(versionSpy).toBeCalledTimes(1)
    })

    test('should install if outdated and elevated permissions', async () => {
      environment.isElevated = true
      jest.spyOn(fs, 'existsSync').mockImplementation(() => true)
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve(outdated))
      agentVersionSpy = jest.spyOn(cli, 'agentVersion').mockImplementation(() => Promise.resolve(agentVersion))

      await binaryInstaller.check()

      expect(installSpy).toBeCalledTimes(1)
      expect(eventSpy).toBeCalledTimes(0)
      expect(versionSpy).toBeCalledTimes(1)
    })
  })
})
