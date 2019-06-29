import fs from 'fs'
import path from 'path'
import SavedConnectionsFile from './SavedConnectionsFile'
import { REMOTEIT_ROOT_DIR } from '../constants'

describe('connectd/SavedConnectionsFile', () => {
  /**
   * Cache current developer's (that's you!) existing connections
   * file and restore after test run. This way, you can run a real
   * test locally (no mocking) yet not destroy your existing connections.
   */
  let cachedConnectionsFile: ConnectionInfo[] | undefined
  beforeAll(() => (cachedConnectionsFile = SavedConnectionsFile.read()))
  afterAll(() =>
    cachedConnectionsFile
      ? SavedConnectionsFile.write(cachedConnectionsFile)
      : SavedConnectionsFile.remove()
  )

  beforeEach(() => SavedConnectionsFile.remove())

  describe('.fileName', () => {
    test('should be correct', async () => {
      expect(SavedConnectionsFile.fileName).toBe('connections.json')
    })
  })

  describe('.exists', () => {
    test('should return false if it does not exist', async () => {
      SavedConnectionsFile.remove()
      expect(SavedConnectionsFile.exists()).toBe(false)
    })

    test('should return true if it exists', async () => {
      SavedConnectionsFile.write()
      expect(SavedConnectionsFile.exists()).toBe(true)
    })
  })

  describe('.location', () => {
    test('should be located in user home directory .remoteit folder', async () => {
      expect(SavedConnectionsFile.location).toBe(
        path.join(REMOTEIT_ROOT_DIR, SavedConnectionsFile.fileName)
      )
    })
  })

  describe('.read', () => {
    test('should return undefined if missing', async () => {
      expect(SavedConnectionsFile.read()).toBe(undefined)
    })

    test('should return undefined if invalid', async () => {
      createInvalidFile()
      expect(SavedConnectionsFile.read()).toBe(undefined)
    })

    test('should return empty array if file is valid but empty', async () => {
      SavedConnectionsFile.write()
      expect(SavedConnectionsFile.read()).toEqual([])
    })

    test('should return content', async () => {
      const content = createFileWithContent()
      expect(SavedConnectionsFile.read()).toEqual(content)
    })
  })

  describe('.create', () => {
    test('creates a new file with an empty array', async () => {
      SavedConnectionsFile.write()
      expect(SavedConnectionsFile.read()).toEqual([])
    })
  })

  describe('.isValid', () => {
    test('should return true if exists and is parsable', async () => {
      SavedConnectionsFile.write()
      expect(SavedConnectionsFile.isValid()).toBe(true)
    })

    test('should return false if file is missing', async () => {
      expect(SavedConnectionsFile.isValid()).toBe(false)
    })

    test('should return false if file is empty', async () => {
      createEmptyFile()
      expect(SavedConnectionsFile.isValid()).toBe(false)
    })

    test('should return false if not parsable', async () => {
      createInvalidFile()
      expect(SavedConnectionsFile.isValid()).toBe(false)
    })
  })
})

function createFileWithContent() {
  const content = [
    {
      deviceID: '80:00:00:00:01',
      serviceID: '80:00:00:00:02',
      serviceName: 'Some Service',
      type: 'SSH',
      port: 33000,
    },
  ] as ConnectionInfo[]
  fs.writeFileSync(SavedConnectionsFile.location, JSON.stringify(content))
  return content
}

function createInvalidFile() {
  fs.writeFileSync(SavedConnectionsFile.location, 'invalid content!')
}

function createEmptyFile() {
  fs.writeFileSync(SavedConnectionsFile.location, '')
}
