import fs from 'fs'
import path from 'path'
import os from 'os'
import * as user from './UserCredentialsFile'
import * as Platform from '../services/Platform'
import { PATH_DIR } from '../constants'

describe('connectd/UserCredentialsFile', () => {
  /**
   * Cache current developer's (that's you!) existing connections
   * user and restore after test run. This way, you can run a real
   * test locally (no mocking) yet not destroy your existing connections.
   */
  let cachedUserCredentials: User | undefined
  beforeAll(() => (cachedUserCredentials = user.read()))
  afterAll(() =>
    cachedUserCredentials ? user.write(cachedUserCredentials) : user.remove()
  )

  beforeEach(() => user.remove())

  describe('.directory', () => {
    test('should be correct', async () => {
      expect(user.directory).toBe(PATH_DIR)
    })
  })

  describe('.exists', () => {
    test('should return false if it does not exist', async () => {
      user.remove()
      expect(user.exists()).toBe(false)
    })

    test('should return true if it exists', async () => {
      createBlankUserObjectFile()
      expect(user.exists()).toBe(true)
    })
  })

  describe('.location', () => {
    test('should be located in user home directory .remoteit folder', async () => {
      expect(user.location).toBe(path.join(PATH_DIR, 'user.json'))
    })
  })

  describe('.read', () => {
    test('should return undefined if missing', async () => {
      expect(user.read()).toBe(undefined)
    })

    test('should return undefined if invalid', async () => {
      createInvalidFile()
      expect(user.read()).toBe(undefined)
    })

    test('should return undefined if user is valid but empty', async () => {
      createBlankUserObjectFile()
      expect(user.read()).toBeUndefined()
    })

    test('should return content', async () => {
      const content = createFileWithContent()
      expect(user.read()).toEqual(content)
    })
  })

  describe('.create', () => {
    test('creates a new user credential file with an empty object', async () => {
      const u = {
        username: 'foo@bar.com',
        authHash: 'some-auth-hash',
      }
      user.write(u)
      expect(user.read()).toEqual(u)
    })
  })

  describe('.isValid', () => {
    test('should return true if exists and is parsable', async () => {
      createFileWithContent()
      expect(user.isValid()).toBe(true)
    })

    test('should return false if user is missing', async () => {
      expect(user.isValid()).toBe(false)
    })

    test('should return false if user is empty', async () => {
      createEmptyFile()
      expect(user.isValid()).toBe(false)
    })

    test('should return false if not parsable', async () => {
      createInvalidFile()
      expect(user.isValid()).toBe(false)
    })
  })
})

function createFileWithContent() {
  const content = {
    username: 'someone@example.com',
    authHash: 'some-auth-hash',
  } as User
  fs.writeFileSync(user.location, JSON.stringify(content))
  return content
}

function createInvalidFile() {
  fs.writeFileSync(user.location, 'invalid content!')
}

function createEmptyFile() {
  fs.writeFileSync(user.location, '')
}

function createBlankUserObjectFile() {
  fs.writeFileSync(user.location, '')
}
