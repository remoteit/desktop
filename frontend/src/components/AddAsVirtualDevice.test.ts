import { describe, it, expect, vi } from 'vitest'

vi.mock('react-redux', () => ({ useSelector: vi.fn() }))
vi.mock('react-router-dom', () => ({ useHistory: vi.fn() }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))
vi.mock('./HostedDevices', () => ({ openVirtualDeviceAdd: vi.fn() }))
vi.mock('../hooks/useVirtualDevices', () => ({ useVirtualDevices: () => true }))

import { discoveredMachine, mayHostVirtualDevices } from './AddAsVirtualDevice'
import type { DiscoveryMachine, DiscoveryOffer } from '../services/graphQLDiscovery'

const offer = (more: Partial<DiscoveryOffer>): DiscoveryOffer => ({
  kind: 'network',
  type: '_smb._tcp',
  name: 'DSM',
  host: 'nas.local',
  addresses: ['192.168.1.20'],
  port: 445,
  protocol: 'tcp',
  application: 34,
  process: null,
  tls: null,
  txt: null,
  ...more,
})

describe('discoveredMachine', () => {
  it('takes the machine as discovery grouped it: its host the key, an offer host only where it differs', () => {
    const machine: DiscoveryMachine = {
      key: 'nas.local',
      name: 'nas',
      addresses: ['192.168.1.20'],
      offers: [
        offer({}),
        offer({ name: 'Printer', type: '_ipp._tcp', port: 631, application: 50, txt: ['ty=HP LaserJet', 'note=a=b'] }),
        offer({ name: 'Admin', type: '_http._tcp', port: 5001, application: 8, host: '192.168.1.21' }),
      ],
    }
    expect(discoveredMachine(machine)).toEqual({
      name: 'nas',
      host: 'nas.local',
      addresses: ['192.168.1.20'],
      offers: [
        {
          name: 'DSM',
          application: 34,
          port: 445,
          protocol: 'tcp',
          type: '_smb._tcp',
          txt: undefined,
          host: undefined,
        },
        {
          name: 'Printer',
          application: 50,
          port: 631,
          protocol: 'tcp',
          type: '_ipp._tcp',
          txt: { ty: 'HP LaserJet', note: 'a=b' },
          host: undefined,
        },
        {
          name: 'Admin',
          application: 8,
          port: 5001,
          protocol: 'tcp',
          type: '_http._tcp',
          txt: undefined,
          host: '192.168.1.21',
        },
      ],
    })
  })
})

describe('mayHostVirtualDevices', () => {
  const device = (more: Partial<IDevice>) => ({ permissions: ['VIEW', 'CONNECT', 'MANAGE'], ...more } as IDevice)

  it('a device-session device the viewer manages, not itself virtual', () => {
    expect(mayHostVirtualDevices(device({}), true)).toBe(true)
    expect(mayHostVirtualDevices(device({}), false)).toBe(false)
    expect(mayHostVirtualDevices(device({ permissions: ['VIEW', 'CONNECT'] }), true)).toBe(false)
    expect(mayHostVirtualDevices(device({ virtual: true }), true)).toBe(false)
  })
})
