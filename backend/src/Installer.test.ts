import binaryInstaller from './binaryInstaller'
import Installer from './Installer'
import environment from './environment'
import preferences from './preferences'
import EventBus from './EventBus'
import cli from './cliInterface'
import fs from 'fs'
import { RESOURCES } from './constants'
import version from './cli-version.json'

describe('backend/Installer', () => {
  describe('check', () => {
    const outdated = '0.30.1'
    const name = RESOURCES[0].name

    let installSpy: jest.SpyInstance,
      eventSpy: jest.SpyInstance,
      versionSpy: jest.SpyInstance,
      prefSpy: jest.SpyInstance
    let installer: Installer
    let path: string

    beforeAll(() => {
      installer = new Installer({
        resources: RESOURCES,
        repoName: 'remoteit/cli',
        dependencies: ['connectd', 'muxer', 'demuxer'],
      })

      path = installer.binaryPathCLI()
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
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve(RESOURCES[0].version))

      await installer.check()

      expect(installSpy).toBeCalledTimes(0)
      expect(eventSpy).toBeCalledTimes(1)
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
    })

    test('should install if does not exist and elevated permissions', async () => {
      environment.isElevated = true
      jest.spyOn(fs, 'existsSync').mockImplementation(() => false)
      versionSpy = jest.spyOn(cli, 'version').mockImplementation()

      await installer.check()

      expect(installSpy).toBeCalledTimes(1)
      expect(eventSpy).toBeCalledTimes(0)
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
    let versionSpy: jest.SpyInstance
    let installer: Installer

    beforeAll(
      () =>
        (installer = new Installer({
          resources: RESOURCES,
          repoName: 'remoteit/cli',
          dependencies: [],
        }))
    )
    afterEach(() => versionSpy.mockClear())

    test('should detect old version', async () => {
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve('0.30.1'))

      const isCurrent = await installer.isCliCurrent()

      expect(versionSpy).toBeCalledTimes(1)
      expect(isCurrent).toBe(false)
    })

    test('should consider a bad response as not current', async () => {
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve('Error'))

      const isCurrent = await installer.isCliCurrent()

      expect(versionSpy).toBeCalledTimes(1)
      expect(isCurrent).toBe(false)
    })

    test('should handle beta tags', async () => {
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve('0.37.7-Beta'))

      const isCurrent = await installer.isCliCurrent()

      expect(versionSpy).toBeCalledTimes(1)
    })
  })
})
