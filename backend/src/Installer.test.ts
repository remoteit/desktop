import binaryInstaller from './binaryInstaller'
import Installer from './Installer'
import environment from './environment'
import EventBus from './EventBus'
import cli from './cliInterface'
import fs from 'fs'

describe('backend/Installer', () => {
  describe('check', () => {
    const version = '0.37.6'
    const outdated = '0.30.1'
    const name = 'remoteit'

    let installSpy: jest.SpyInstance, eventSpy: jest.SpyInstance, versionSpy: jest.SpyInstance
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
      installSpy = jest.spyOn(binaryInstaller, 'install').mockImplementation()
      eventSpy = jest.spyOn(EventBus, 'emit').mockImplementation()
    })

    afterEach(() => {
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
      expect(eventSpy).toBeCalledWith('binary/installed', { path, version, name })
      expect(versionSpy).toBeCalledTimes(1)
    })

    test('should notify if outdated', async () => {
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
})
