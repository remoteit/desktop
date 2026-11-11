import { describe, it, expect, vi, beforeEach } from 'vitest'

const { offered, deviceExit } = vi.hoisted(() => ({ offered: vi.fn(), deviceExit: vi.fn() }))
vi.mock('../../services/graphQLExits', () => ({ graphQLOfferedExits: offered, graphQLDeviceExit: deviceExit }))

import { readCloudExits } from './readCloudExits'

const two = { devices: 2, carrying: 2, healthy: 2, draining: 0 }
const one = { devices: 1, carrying: 1, healthy: 1, draining: 0 }

beforeEach(() => {
  offered.mockReset()
  deviceExit.mockReset()
})

describe('what the account knows of the machine’s exits', () => {
  it('each offered exit’s devices counted, and the device of the exit in use', async () => {
    offered.mockResolvedValue([
      { id: 'pdx1a', serving: two },
      { id: 'xoffice', serving: one },
    ])
    deviceExit.mockResolvedValue({ usesExit: { id: 'pdx1a', serving: two }, usesExitThrough: { id: 'E2', name: 'e2' } })
    const exits = await readCloudExits('MAC')
    expect(offered).toHaveBeenCalledWith('MAC')
    expect(deviceExit).toHaveBeenCalledWith('MAC')
    expect([...exits!.serving]).toEqual([
      ['pdx1a', two],
      ['xoffice', one],
    ])
    expect(exits!.inUse).toEqual({ id: 'pdx1a', through: { id: 'E2', name: 'e2' }, serving: two })
  })

  it('the exit in use counted though no longer offered; none in use, none said', async () => {
    offered.mockResolvedValue([])
    deviceExit.mockResolvedValue({ usesExit: { id: 'xold', serving: one }, usesExitThrough: null })
    let exits = await readCloudExits('MAC')
    expect(exits!.serving.get('xold')).toEqual(one)
    expect(exits!.inUse).toEqual({ id: 'xold', through: null, serving: one })
    deviceExit.mockResolvedValue({ usesExit: null, usesExitThrough: null })
    exits = await readCloudExits('MAC')
    expect(exits!.inUse).toBeNull()
  })

  it('what one read gives where the other fails; nothing where both do', async () => {
    offered.mockResolvedValue('ERROR')
    deviceExit.mockResolvedValue({ usesExit: { id: 'pdx1a', serving: two }, usesExitThrough: null })
    expect([...(await readCloudExits('MAC'))!.serving]).toEqual([['pdx1a', two]])
    offered.mockResolvedValue([{ id: 'pdx1a', serving: two }])
    deviceExit.mockResolvedValue('UNSUPPORTED')
    expect((await readCloudExits('MAC'))!.inUse).toBeNull()
    offered.mockResolvedValue('UNSUPPORTED')
    deviceExit.mockResolvedValue('ERROR')
    expect(await readCloudExits('MAC')).toBeNull()
  })
})
