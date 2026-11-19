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

  it("reads a server's clock from its Date header", async () => {
    expect(await serverTime('https://login.remote.it')).toBe(Date.parse(date))
    expect(fetchSpy).toHaveBeenCalledWith('https://login.remote.it', expect.objectContaining({ method: 'HEAD' }))
  })

  it('asks only https servers', async () => {
    expect(await serverTime('http://192.168.0.1/admin')).toBeUndefined()
    expect(await serverTime('file:///etc/passwd')).toBeUndefined()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('has no answer when the server is unreachable or sends no Date', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('offline'))
    expect(await serverTime('https://login.remote.it')).toBeUndefined()

    fetchSpy.mockResolvedValueOnce({ headers: { get: () => null } } as unknown as Response)
    expect(await serverTime('https://login.remote.it')).toBeUndefined()
  })
})
