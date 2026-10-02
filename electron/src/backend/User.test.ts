import axios from 'axios'
import cli from './cliInterface'
import { User } from './User'

jest.mock('axios')
jest.mock('./cliInterface', () => ({ __esModule: true, default: { signIn: jest.fn() } }))

describe('backend/User checkSignIn before a switch', () => {
  const credentials = { username: 'b@test', authHash: 'hash-b', guid: 'guid-b' }
  const post = axios.post as jest.Mock
  const signIn = cli.signIn as jest.Mock

  beforeEach(() => {
    post.mockReset().mockResolvedValue({ data: { guid: 'guid-b', service_authhash: 'service-b' } })
    signIn.mockReset()
  })

  it('validates the new account before the agent is released, then signs in', async () => {
    const user = new User()
    const release = jest.fn(async () => true)
    expect(await user.checkSignIn(credentials, release)).toBe(true)
    expect(post.mock.invocationCallOrder[0]).toBeLessThan(release.mock.invocationCallOrder[0])
    expect(signIn).toHaveBeenCalledTimes(1)
    expect(user.id).toBe('guid-b')
  })

  it('never releases the agent for a login the API refuses', async () => {
    post.mockRejectedValue(new Error('401'))
    const release = jest.fn(async () => true)
    expect(await new User().checkSignIn(credentials, release)).toBe(false)
    expect(release).not.toHaveBeenCalled()
  })

  it('stops when the release fails, keeping the old identity', async () => {
    const user = new User()
    Object.assign(user, { id: 'guid-a', username: 'a@test', authHash: 'hash-a', signedIn: true })
    expect(await user.checkSignIn(credentials, async () => false)).toBe(false)
    expect(signIn).not.toHaveBeenCalled()
    expect(user.id).toBe('guid-a')
  })
})
