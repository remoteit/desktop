import binaryInstaller from './binaryInstaller'
import Installer from './Installer'
import environment from './environment'
import preferences from './preferences'
import EventBus from './EventBus'
import cli from './cliInterface'
import fs from 'fs'

describe('backend/Installer', () => {
  describe('check', () => {
    const version = '0.37.6'
    const outdated = '0.30.1'
    const name = 'remoteit'

    let installSpy: jest.SpyInstance,
      eventSpy: jest.SpyInstance,
      versionSpy: jest.SpyInstance,
      prefSpy: jest.SpyInstance
    let installer: Installer
    let path: string

    beforeAll(() => {
      installer = new Installer({
        name,
        version,
        repoName: 'remoteit/cli',
        dependencies: ['connectd', 'muxer', 'demuxer'],
      })

      path = installer.binaryPath()
      prefSpy = jest.spyOn(preferences, 'get').mockImplementation(() => ({ version: environment.version }))
      installSpy = jest.spyOn(binaryInstaller, 'install').mockImplementation()
      eventSpy = jest.spyOn(EventBus, 'emit').mockImplementation()
    })

    afterEach(() => {
      prefSpy.mockClear()
      installSpy.mockClear()
      eventSpy.mockClear()
      versionSpy.mockClear()
    })

    test('should notify if installed', async () => {
      jest.spyOn(fs, 'existsSync').mockImplementation(() => true)
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve(version))

      await installer.check()

      expect(installSpy).toBeCalledTimes(0)
      expect(eventSpy).toBeCalledTimes(1)
      expect(eventSpy).toBeCalledWith('binary/installed', { path, version, name, installedVersion: version })
      expect(versionSpy).toBeCalledTimes(1)
    })

    test('should notify with different installed version', async () => {
      const installedVersion = '0.40.0'

      jest.spyOn(fs, 'existsSync').mockImplementation(() => true)
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve(installedVersion))

      await installer.check()

      expect(installSpy).toBeCalledTimes(0)
      expect(eventSpy).toBeCalledTimes(1)
      expect(eventSpy).toBeCalledWith('binary/installed', { path, version, name, installedVersion })
      expect(versionSpy).toBeCalledTimes(1)
    })

    test('should notify if cli outdated', async () => {
      jest.spyOn(fs, 'existsSync').mockImplementation(() => true)
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve(outdated))

      await installer.check()

      expect(installSpy).toBeCalledTimes(0)
      expect(eventSpy).toBeCalledTimes(1)
      expect(eventSpy).toBeCalledWith('binary/not-installed', name)
      expect(versionSpy).toBeCalledTimes(1)
    })

    test('should notify if does not exist', async () => {
      jest.spyOn(fs, 'existsSync').mockImplementation(() => false)
      versionSpy = jest.spyOn(cli, 'version').mockImplementation()

      await installer.check()

      expect(installSpy).toBeCalledTimes(0)
      expect(eventSpy).toBeCalledTimes(1)
      expect(eventSpy).toBeCalledWith('binary/not-installed', name)
      expect(versionSpy).toBeCalledTimes(0)
    })

    test('should install if does not exist and elevated permissions', async () => {
      environment.isElevated = true
      jest.spyOn(fs, 'existsSync').mockImplementation(() => false)
      versionSpy = jest.spyOn(cli, 'version').mockImplementation()

      await installer.check()

      expect(installSpy).toBeCalledTimes(1)
      expect(eventSpy).toBeCalledTimes(0)
      expect(versionSpy).toBeCalledTimes(0)
    })

    test('should install if outdated and elevated permissions', async () => {
      environment.isElevated = true
      jest.spyOn(fs, 'existsSync').mockImplementation(() => true)
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve(outdated))

      await installer.check()

      expect(installSpy).toBeCalledTimes(1)
      expect(eventSpy).toBeCalledTimes(0)
      expect(versionSpy).toBeCalledTimes(1)
    })
  })

  describe('isCurrent', () => {
    const name = 'remoteit'
    const version = '0.37.6'

    let versionSpy: jest.SpyInstance
    let installer: Installer

    beforeAll(() => (installer = new Installer({ name, version, repoName: 'remoteit/cli', dependencies: [] })))
    afterEach(() => versionSpy.mockClear())

    test('should detect old version', async () => {
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve('0.30.1'))

      const isCurrent = await installer.isCliCurrent()

      expect(versionSpy).toBeCalledTimes(1)
      expect(isCurrent).toBe(false)
    })

    test('should detect same version', async () => {
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve('0.37.6'))

      const isCurrent = await installer.isCliCurrent()

      expect(versionSpy).toBeCalledTimes(1)
      expect(isCurrent).toBe(true)
    })

    test('should consider a bad response as not current', async () => {
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve('Error'))

      const isCurrent = await installer.isCliCurrent()

      expect(versionSpy).toBeCalledTimes(1)
      expect(isCurrent).toBe(false)
    })

    test('should consider a newer version as current', async () => {
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve('1.0.0'))

      const isCurrent = await installer.isCliCurrent()

      expect(versionSpy).toBeCalledTimes(1)
      expect(isCurrent).toBe(true)
    })

    test('should handle beta tags', async () => {
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve('0.37.7-Beta'))

      const isCurrent = await installer.isCliCurrent()

      expect(versionSpy).toBeCalledTimes(1)
      expect(isCurrent).toBe(true)
    })
  })
})
