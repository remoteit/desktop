import fs from 'fs'
import path from 'path'
import UserCredentialsFile from './UserCredentialsFile'
import { REMOTEIT_ROOT_DIR } from '../constants'

describe('connectd/UserCredentialsFile', () => {
  /**
   * Cache current developer's (that's you!) existing connections
   * user and restore after test run. This way, you can run a real
   * test locally (no mocking) yet not destroy your existing connections.
   */
  let cachedUserCredentials: User | undefined
  beforeAll(() => (cachedUserCredentials = UserCredentialsFile.read()))
  afterAll(() =>
    cachedUserCredentials
      ? UserCredentialsFile.write(cachedUserCredentials)
      : UserCredentialsFile.remove()
  )

  beforeEach(() => UserCredentialsFile.remove())

  describe('.directory', () => {
    test('should be correct', async () => {
      expect(UserCredentialsFile.directory).toBe(REMOTEIT_ROOT_DIR)
    })
  })

  describe('.exists', () => {
    test('should return false if it does not exist', async () => {
      UserCredentialsFile.remove()
      expect(UserCredentialsFile.exists()).toBe(false)
    })

    test('should return true if it exists', async () => {
      createBlankUserObjectFile()
      expect(UserCredentialsFile.exists()).toBe(true)
    })
  })

  describe('.location', () => {
    test('should be located in user home directory .remoteit folder', async () => {
      expect(UserCredentialsFile.location).toBe(
        path.join(REMOTEIT_ROOT_DIR, 'user.json')
      )
    })
  })

  describe('.read', () => {
    test('should return undefined if missing', async () => {
      expect(UserCredentialsFile.read()).toBe(undefined)
    })

    test('should return undefined if invalid', async () => {
      createInvalidFile()
      expect(UserCredentialsFile.read()).toBe(undefined)
    })

    test('should return undefined if user is valid but empty', async () => {
      createBlankUserObjectFile()
      expect(UserCredentialsFile.read()).toBeUndefined()
    })

    test('should return content', async () => {
      const content = createFileWithContent()
      expect(UserCredentialsFile.read()).toEqual(content)
    })
  })

  describe('.create', () => {
    test('creates a new user credential file with an empty object', async () => {
      const u = {
        username: 'foo@bar.com',
        authHash: 'some-auth-hash',
      }
      UserCredentialsFile.write(u)
      expect(UserCredentialsFile.read()).toEqual(u)
    })
  })

  describe('.isValid', () => {
    test('should return true if exists and is parsable', async () => {
      createFileWithContent()
      expect(UserCredentialsFile.isValid()).toBe(true)
    })

    test('should return false if user is missing', async () => {
      expect(UserCredentialsFile.isValid()).toBe(false)
    })

    test('should return false if user is empty', async () => {
      createEmptyFile()
      expect(UserCredentialsFile.isValid()).toBe(false)
    })

    test('should return false if not parsable', async () => {
      createInvalidFile()
      expect(UserCredentialsFile.isValid()).toBe(false)
    })
  })
})

function createFileWithContent() {
  const content = {
    username: 'someone@example.com',
    authHash: 'some-auth-hash',
  } as User
  fs.writeFileSync(UserCredentialsFile.location, JSON.stringify(content))
  return content
}

function createInvalidFile() {
  fs.writeFileSync(UserCredentialsFile.location, 'invalid content!')
}

function createEmptyFile() {
  fs.writeFileSync(UserCredentialsFile.location, '')
}

function createBlankUserObjectFile() {
  fs.writeFileSync(UserCredentialsFile.location, '')
}
