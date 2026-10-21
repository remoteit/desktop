import { beforeEach, describe, expect, it } from 'vitest'
import {
  SAMPLE_GATEWAY_ID,
  isSampleId,
  resetSample,
  sampleAdd,
  sampleConvert,
  sampleDelete,
  sampleDevices,
  sampleMove,
  sampleUpdate,
} from './virtualDevicesSample'

const byName = (name: string) => sampleDevices().find(d => d.name === name)
const gateway = (id = SAMPLE_GATEWAY_ID, state: IDevice['state'] = 'active') =>
  ({ id, name: 'Office gateway', state, services: [] } as unknown as IDevice)

beforeEach(resetSample)

describe('sample virtual devices', () => {
  it('a gateway counts and lists the devices it hosts; a hosted device names it', () => {
    const gw = byName('Office gateway')
    expect(gw.virtual).toBe(false)
    expect(gw.hosts).toBe(2)
    expect(gw.hostedDevices.map((h: any) => h.name)).toEqual(['Office NAS', 'Line 2 PLC'])
    expect(byName('Office NAS').hostedBy).toMatchObject({
      visible: true,
      id: SAMPLE_GATEWAY_ID,
      name: 'Office gateway',
    })
  })

  it('a gateway the viewer cannot see has no id or name; a deleted one leaves the device not hosted', () => {
    expect(byName('Dock camera').hostedBy).toEqual({ visible: false, state: 'inactive' })
    expect(byName('Front desk printer').hostedBy).toBeNull()
  })

  it('every device and service id is unique and recognised as a sample', () => {
    sampleAdd(gateway(), { name: 'A', host: 'a.local', services: [{ name: 'Web', application: 7, port: 80 }] })
    sampleAdd(gateway(), { name: 'B', host: 'b.local', services: [{ name: 'Web', application: 7, port: 80 }] })
    const ids = sampleDevices().flatMap(d => [d.id, ...d.services.map((s: any) => s.id)])
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every(isSampleId)).toBe(true)
  })

  it('an added device takes its gateway and state; its services default to its address', () => {
    const id = sampleAdd(gateway(), {
      name: 'Shop PC',
      host: '192.168.1.9',
      platform: 4,
      services: [
        { name: 'RDP', application: 5, port: 3389 },
        { name: 'Other', application: 1, port: 9, host: '192.168.1.10' },
      ],
    })
    const added = sampleDevices([id])[0]
    expect(added).toMatchObject({ virtual: true, platform: 4, state: 'active', hostedBy: { id: SAMPLE_GATEWAY_ID } })
    expect(added.services.map((s: any) => s.host)).toEqual(['192.168.1.9', '192.168.1.10'])
    expect(byName('Office gateway').hosts).toBe(3)
  })

  it('an address change moves the services that used it', () => {
    const nas = byName('Office NAS')
    expect(sampleUpdate(nas.id, { host: 'nas.local', platform: 1282 })).toBe(true)
    expect(byName('Office NAS')).toMatchObject({ host: 'nas.local', platform: 1282 })
    expect(byName('Office NAS').services.every((s: any) => s.host === 'nas.local')).toBe(true)
    expect(sampleUpdate(SAMPLE_GATEWAY_ID, { platform: 1 })).toBe(false) // a daemon's platform is its own
  })

  it('moving one takes the new gateway and its state', () => {
    const printer = byName('Front desk printer')
    sampleMove(printer.id, gateway(SAMPLE_GATEWAY_ID))
    expect(byName('Front desk printer')).toMatchObject({ state: 'active', hostedBy: { id: SAMPLE_GATEWAY_ID } })
  })

  it('a gateway deleted keeps its devices, not hosted and offline, by default', () => {
    expect(sampleDelete(SAMPLE_GATEWAY_ID)).toEqual([SAMPLE_GATEWAY_ID])
    expect(byName('Office NAS')).toMatchObject({ hostedBy: null, state: 'inactive' })
  })

  it('or deletes them with it', () => {
    const gone = sampleDelete(SAMPLE_GATEWAY_ID, false)
    expect(gone).toHaveLength(3)
    expect(byName('Office NAS')).toBeUndefined()
  })

  it('a jump service converts with every service of the gateway on its host', () => {
    const gw = {
      ...gateway('80:00:00:00:00:00:00:99'),
      services: [
        { id: 's1', name: 'Files', typeID: 34, port: 445, host: '192.168.1.20' },
        { id: 's2', name: 'DSM', typeID: 7, port: 5000, host: '192.168.1.20' },
        { id: 's3', name: 'SSH', typeID: 28, port: 22, host: '127.0.0.1' },
      ],
    } as unknown as IDevice
    const id = sampleConvert(gw, gw.services[0], 'NAS')
    expect(sampleDevices([id])[0].services.map((s: any) => s.name)).toEqual(['Files', 'DSM'])
  })
})
