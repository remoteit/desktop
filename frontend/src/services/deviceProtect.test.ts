import { describe, it, expect, vi, beforeEach } from 'vitest'

const { post, request } = vi.hoisted(() => ({ post: vi.fn(), request: vi.fn() }))
vi.mock('./post', () => ({ post }))
vi.mock('./graphQL', () => ({ graphQLRequestWithReason: request }))

beforeEach(() => {
  vi.resetModules()
  post.mockReset()
  request.mockReset()
})

const schema = (keepProtect: boolean, usesExit: boolean) => ({
  mutation: {
    fields: [
      { name: 'setDeviceSetting', args: [{ name: 'deviceId' }] },
      {
        name: 'setDeviceExit',
        args: [{ name: 'deviceId' }, { name: 'via' }, ...(keepProtect ? [{ name: 'keepProtect' }] : [])],
      },
    ],
  },
  device: { fields: [{ name: 'id' }, ...(usesExit ? [{ name: 'usesExit' }] : [])] },
})

describe('Protect and its route apart, asked only where the API has them', () => {
  it('keepProtect where setDeviceExit takes it; the list’s field where Device has usesExit', async () => {
    const { parseDeviceProtect } = await import('./deviceProtect')
    expect(parseDeviceProtect(schema(true, true))).toEqual({
      keepProtect: true,
      listFields: expect.stringContaining('usesExit { id name }'),
    })
    expect(parseDeviceProtect(schema(false, true)).keepProtect).toBe(false)
    expect(parseDeviceProtect(schema(true, false)).listFields).toBe('')
    expect(parseDeviceProtect(undefined)).toEqual({ keepProtect: false, listFields: '' })
  })

  it('read once; asked again after a failed request', async () => {
    const { keepProtectServed, protectListFields } = await import('./deviceProtect')
    post.mockResolvedValueOnce('ERROR')
    expect(await keepProtectServed()).toBe(false)
    post.mockResolvedValue({ data: { data: schema(true, true) } })
    expect(await keepProtectServed()).toBe(true)
    expect(await protectListFields()).toContain('usesExit')
    expect(post).toHaveBeenCalledTimes(2)
    expect(post.mock.calls[0][0].query).toContain('__type(name: "Mutation")')
  })

  it('the list’s device: Protect on by its exit, null while off, nothing where not asked', async () => {
    const { protectAdaptor } = await import('./deviceProtect')
    expect(protectAdaptor({ usesExit: { id: 'xoffice', name: 'Office' } })).toEqual({
      protectExit: { id: 'xoffice', name: 'Office' },
    })
    expect(protectAdaptor({ usesExit: { id: 'pdx1a', name: null } })).toEqual({
      protectExit: { id: 'pdx1a', name: 'pdx1a' },
    })
    expect(protectAdaptor({ usesExit: null })).toEqual({ protectExit: null })
    expect(protectAdaptor({ id: 'LAPTOP' })).toEqual({})
  })

  it('the route alone: setDeviceExit with keepProtect', async () => {
    const { graphQLSetDeviceRoute } = await import('./deviceProtect')
    request.mockResolvedValue({})
    await graphQLSetDeviceRoute('LAPTOP', 'xoffice')
    expect(request.mock.calls[0][0]).toContain('keepProtect: true')
    expect(request.mock.calls[0][1]).toEqual({ deviceId: 'LAPTOP', via: 'xoffice' })
  })
})
