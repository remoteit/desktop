import { describe, expect, it } from 'vitest'
import { platforms } from '.'
import { VIRTUAL_PLATFORM_TYPES, allPlatformChoices, suggestPlatform, virtualPlatformChoices } from './virtual'

// The machines a virtual device can be (graphql-api docs/VIRTUAL-DEVICES.md): new catalogue entries with icons of
// their own, offered to a virtual device and to no picker of a daemon's platform.
describe('virtual device platforms', () => {
  it.each([
    [1282, 'PLC', 'plc'],
    [1283, 'IP camera', 'ipcamera'],
    [1284, 'Printer', 'printer'],
    [1285, 'HMI / industrial PC', 'hmi'],
    [1286, 'Router / switch', 'router'],
  ])('%i is "%s", drawn as %s', async (type, label, route) => {
    await platforms.initialize()
    expect(platforms.name(type)).toBe(label)
    expect(platforms.componentByType(type)).toBe(platforms.component(route))
    expect(platforms.component(route)).not.toBe(platforms.component('unknown'))
    expect(platforms.virtualTypes[type]).toBe(label)
    expect(platforms.pageTypes[type]).toBeUndefined()
  })

  it('the picker leads with the common machines, each named, and searches the whole catalogue', async () => {
    await platforms.initialize()
    const common = virtualPlatformChoices()
    expect(common.map(c => c.type)).toEqual(VIRTUAL_PLATFORM_TYPES)
    expect(common.every(c => c.name)).toBe(true)
    expect(common.at(-1)?.name).toBe('Other')
    const all = allPlatformChoices()
    expect(all.some(c => c.type === 1282)).toBe(true)
    expect(new Set(all.map(c => c.name)).size).toBe(all.length)
  })

  it('discovery suggests from what a machine advertises, or nothing', () => {
    expect(suggestPlatform([{ type: '_ipp._tcp' }])).toBe(1284)
    expect(suggestPlatform([{ type: '_smb._tcp', txt: { model: 'DS920+' } }])).toBe(1210)
    expect(suggestPlatform([{ type: '_smb._tcp' }])).toBeUndefined()
    expect(suggestPlatform([{ type: '_rtsp._tcp' }])).toBe(1283)
    expect(suggestPlatform([{ type: '_rfb._tcp' }], 'DESKTOP-4QK.local')).toBe(4)
    expect(suggestPlatform([{ type: '_http._tcp' }])).toBeUndefined()
  })
})
