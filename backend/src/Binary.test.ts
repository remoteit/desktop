import Binary from './Binary'
import cli from './cliInterface'

describe('backend/Binary', () => {
  describe('isCurrent', () => {
    const name = 'remoteit'
    const version = '0.37.6'
    const isCli = true

    let versionSpy: jest.SpyInstance
    let installedSpy: jest.SpyInstance
    let binary: Binary

    beforeAll(() => {
      binary = new Binary({ name, version, isCli })
      installedSpy = jest.spyOn(binary, 'isInstalled').mockImplementation(() => true)
    })

    afterEach(() => {
      versionSpy.mockClear()
      installedSpy.mockClear()
    })

    test('should detect old version', async () => {
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve('0.30.1'))

      const isCurrent = await binary.isCurrent()

      expect(versionSpy).toBeCalledTimes(1)
      expect(isCurrent).toBe(false)
    })

    test('should detect same version', async () => {
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve('0.37.6'))

      const isCurrent = await binary.isCurrent()

      expect(versionSpy).toBeCalledTimes(1)
      expect(isCurrent).toBe(true)
    })

    test('should consider a bad response as not current', async () => {
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve('Error'))

      const isCurrent = await binary.isCurrent()

      expect(versionSpy).toBeCalledTimes(1)
      expect(isCurrent).toBe(false)
    })

    test('should consider a newer version as current', async () => {
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve('1.0.0'))

      const isCurrent = await binary.isCurrent()

      expect(versionSpy).toBeCalledTimes(1)
      expect(isCurrent).toBe(true)
    })

    test('should handle beta tags', async () => {
      versionSpy = jest.spyOn(cli, 'version').mockImplementation(() => Promise.resolve('0.37.7-Beta'))

      const isCurrent = await binary.isCurrent()

      expect(versionSpy).toBeCalledTimes(1)
      expect(isCurrent).toBe(true)
    })
  })
})
