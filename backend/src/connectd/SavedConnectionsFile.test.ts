import fs from 'fs'
import path from 'path'
import os from 'os'
import * as file from './SavedConnectionsFile'
import { REMOTEIT_ROOT_DIR } from '../constants'

describe('connectd/SavedConnectionsFile', () => {
  /**
   * Cache current developer's (that's you!) existing connections
   * file and restore after test run. This way, you can run a real
   * test locally (no mocking) yet not destroy your existing connections.
   */
  let cachedConnectionsFile: ConnectionInfo[] | undefined
  beforeAll(() => (cachedConnectionsFile = file.read()))
  afterAll(() =>
    cachedConnectionsFile ? file.write(cachedConnectionsFile) : file.remove()
  )

  beforeEach(() => file.remove())

  describe('.fileName', () => {
    test('should be correct', async () => {
      expect(file.fileName).toBe('connections.json')
    })
  })

  describe('.exists', () => {
    test('should return false if it does not exist', async () => {
      file.remove()
      expect(file.exists()).toBe(false)
    })

    test('should return true if it exists', async () => {
      file.write()
      expect(file.exists()).toBe(true)
    })
  })

  describe('.location', () => {
    test('should be located in user home directory .remoteit folder', async () => {
      expect(file.location).toBe(
        path.join(os.homedir(), REMOTEIT_ROOT_DIR, file.fileName)
      )
    })
  })

  describe('.read', () => {
    test('should return undefined if missing', async () => {
      expect(file.read()).toBe(undefined)
    })

    test('should return undefined if invalid', async () => {
      createInvalidFile()
      expect(file.read()).toBe(undefined)
    })

    test('should return empty array if file is valid but empty', async () => {
      file.write()
      expect(file.read()).toEqual([])
    })

    test('should return content', async () => {
      const content = createFileWithContent()
      expect(file.read()).toEqual(content)
    })
  })

  describe('.addConnection', () => {
    test('should create the connections file if missing before adding', async () => {
      const conn = {
        deviceID: '80:00:00:00:01',
        serviceID: '80:00:00:00:02',
        serviceName: 'Some Service',
        type: 'SSH',
        port: 33000,
      }

      expect(file.addConnection(conn)).toEqual([conn])
    })

    test('should not add a duplicate connection', async () => {
      const conn = {
        deviceID: '80:00:00:00:01',
        serviceID: '80:00:00:00:02',
        serviceName: 'Some Service',
        type: 'SSH',
        port: 33000,
      }
      const serviceMatch = {
        deviceID: '80:00:00:00:01',
        serviceID: '80:00:00:00:02',
        serviceName: 'Service Match',
        type: 'SSH',
        port: 33333,
      }
      const portMatch = {
        deviceID: '80:00:00:00:01',
        serviceID: '80:00:00:00:02',
        serviceName: 'Port Match',
        type: 'SSH',
        port: 33000,
      }

      file.write([conn])

      expect(file.addConnection(portMatch)).toEqual([conn])
      expect(file.addConnection(serviceMatch)).toEqual([conn])
    })

    test('should add a new connection to the file', async () => {
      const existing = {
        deviceID: '80:00:00:00:01',
        serviceID: '80:00:00:00:02',
        serviceName: 'Some Service',
        type: 'SSH',
        port: 33000,
      }
      const added = {
        deviceID: '80:00:00:00:03',
        serviceID: '80:00:00:00:04',
        serviceName: 'Other Service',
        type: 'HTTP',
        port: 33001,
      }

      file.write([existing])

      expect(file.addConnection(added)).toEqual([existing, added])
    })
  })

  describe('.create', () => {
    test('creates a new file with an empty array', async () => {
      file.write()
      expect(file.read()).toEqual([])
    })
  })

  describe('.isValid', () => {
    test('should return true if exists and is parsable', async () => {
      file.write()
      expect(file.isValid()).toBe(true)
    })

    test('should return false if file is missing', async () => {
      expect(file.isValid()).toBe(false)
    })

    test('should return false if file is empty', async () => {
      createEmptyFile()
      expect(file.isValid()).toBe(false)
    })

    test('should return false if not parsable', async () => {
      createInvalidFile()
      expect(file.isValid()).toBe(false)
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
  fs.writeFileSync(file.location, JSON.stringify(content))
  return content
}

function createInvalidFile() {
  fs.writeFileSync(file.location, 'invalid content!')
}

function createEmptyFile() {
  fs.writeFileSync(file.location, '')
}
