const mockExecFile = jest.fn()
const mockNetworkInterfaces = jest.fn()

jest.mock('child_process', () => ({ execFile: (...args: any[]) => mockExecFile(...args) }))
jest.mock('os', () => ({ ...jest.requireActual('os'), networkInterfaces: () => mockNetworkInterfaces() }))
jest.mock('./Logger', () => ({ __esModule: true, default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }))

import windowsInterfaces from './windowsInterfaces'
import Logger from './Logger'

const NICS = {
  Ethernet: [
    {
      address: 'fe80::1c2b:3d4e:5f60:7182',
      netmask: 'ffff:ffff:ffff:ffff::',
      family: 'IPv6',
      mac: '00:15:5d:01:02:03',
      internal: false,
      scopeid: 12,
    },
    { address: '192.168.1.20', netmask: '255.255.255.0', family: 'IPv4', mac: '00:15:5d:01:02:03', internal: false },
  ],
  'Wi-Fi': [
    { address: '10.0.0.15', netmask: '255.255.255.0', family: 'IPv4', mac: 'a4:c3:f0:11:22:33', internal: false },
  ],
  'vEthernet (Default Switch)': [
    { address: '172.27.96.1', netmask: '255.255.240.0', family: 'IPv4', mac: '00:15:5d:aa:bb:cc', internal: false },
  ],
  'Bluetooth Network Connection': [
    {
      address: 'fe80::99',
      netmask: 'ffff:ffff:ffff:ffff::',
      family: 'IPv6',
      mac: '5c:f3:70:00:00:01',
      internal: false,
      scopeid: 7,
    },
  ],
  'Loopback Pseudo-Interface 1': [
    { address: '127.0.0.1', netmask: '255.0.0.0', family: 'IPv4', mac: '00:00:00:00:00:00', internal: true },
  ],
}

const DETAILS = {
  adapters: [
    { Name: 'Ethernet', NdisPhysicalMedium: 14 },
    { Name: 'Wi-Fi', NdisPhysicalMedium: 9 },
    { Name: 'vEthernet (Default Switch)', NdisPhysicalMedium: 0 },
  ],
  routes: [
    { InterfaceAlias: 'Wi-Fi', NextHop: '10.0.0.1', RouteMetric: 0, InterfaceMetric: 35 },
    { InterfaceAlias: 'Ethernet', NextHop: '192.168.1.1', RouteMetric: 0, InterfaceMetric: 25 },
  ],
}

function powershell(error: Error | null, stdout = '') {
  mockExecFile.mockImplementation((_file, _args, _options, callback) => callback(error, stdout, ''))
}

describe('backend/windowsInterfaces', () => {
  beforeEach(() => {
    mockExecFile.mockReset()
    mockNetworkInterfaces.mockReturnValue(NICS)
    jest.mocked(Logger.warn).mockClear()
  })

  test('lists IPv4 interfaces, active on the lowest-metric default route, without WMIC', async () => {
    powershell(null, JSON.stringify(DETAILS))

    expect(await windowsInterfaces()).toEqual([
      {
        active: true,
        gateway: '192.168.1.1',
        ip: '192.168.1.20',
        mac: '00:15:5d:01:02:03',
        netmask: '255.255.255.0',
        name: 'Ethernet',
        type: 'Wired',
      },
      {
        active: false,
        gateway: '10.0.0.1',
        ip: '10.0.0.15',
        mac: 'a4:c3:f0:11:22:33',
        netmask: '255.255.255.0',
        name: 'Wi-Fi',
        type: 'Wireless',
      },
      {
        active: false,
        gateway: undefined,
        ip: '172.27.96.1',
        mac: '00:15:5d:aa:bb:cc',
        netmask: '255.255.240.0',
        name: 'vEthernet (Default Switch)',
        type: 'Wired',
      },
    ])
    expect(mockExecFile).toHaveBeenCalledWith(
      'powershell.exe',
      expect.any(Array),
      expect.any(Object),
      expect.any(Function)
    )
  })

  test('marks nothing active without a default route', async () => {
    powershell(null, JSON.stringify({ adapters: DETAILS.adapters, routes: [] }))

    const interfaces = await windowsInterfaces()
    expect(interfaces.map(i => i.name)).toEqual(['Ethernet', 'Wi-Fi', 'vEthernet (Default Switch)'])
    expect(interfaces.some(i => i.active)).toBe(false)
  })

  test.each([
    ['PowerShell is missing', () => powershell(new Error('spawn powershell.exe ENOENT'))],
    ['PowerShell prints something other than JSON', () => powershell(null, 'Get-NetAdapter : Access is denied.')],
  ])('still lists the addresses when %s', async (_, setup) => {
    setup()

    const interfaces = await windowsInterfaces()
    expect(interfaces.map(i => [i.name, i.ip, i.active, i.type])).toEqual([
      ['Ethernet', '192.168.1.20', false, 'Wired'],
      ['Wi-Fi', '10.0.0.15', false, 'Wired'],
      ['vEthernet (Default Switch)', '172.27.96.1', false, 'Wired'],
    ])
    expect(Logger.warn).toHaveBeenCalledWith('INTERFACE details unavailable', expect.anything())
  })
})
