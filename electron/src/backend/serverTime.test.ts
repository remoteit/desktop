import serverTime from './serverTime'

describe('serverTime', () => {
  const date = 'Thu, 19 Nov 2026 02:10:22 GMT'
  let fetchSpy: jest.SpyInstance

  beforeEach(() => {
    fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ headers: { get: (name: string) => (name === 'date' ? date : null) } } as unknown as Response)
  })

  afterEach(() => fetchSpy.mockRestore())

  it("reads a sign-in server's clock from its Date header, without following redirects", async () => {
    expect(await serverTime('https://login.remote.it/token')).toBe(Date.parse(date))
    expect(await serverTime('https://login.dev.remote.it/token')).toBe(Date.parse(date))
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://login.remote.it/token',
      expect.objectContaining({ method: 'HEAD', redirect: 'manual' })
    )
  })

  it('asks no other server', async () => {
    for (const url of [
      'https://evil.example/',
      'https://login.remote.it.evil.example/token',
      'https://user@evil.example/login.remote.it',
      'http://login.remote.it/token',
      'http://192.168.0.1/admin',
      'file:///etc/passwd',
      'not a url',
    ])
      expect(await serverTime(url)).toBeUndefined()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('has no answer when the server is unreachable or sends no Date', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('offline'))
    expect(await serverTime('https://login.remote.it/token')).toBeUndefined()

    fetchSpy.mockResolvedValueOnce({ headers: { get: () => null } } as unknown as Response)
    expect(await serverTime('https://login.remote.it/token')).toBeUndefined()
  })
})
