const mockGetList = jest.fn()
const mockGetActive = jest.fn()
const mockWindowsInterfaces = jest.fn()
const mockEnvironment = { isWindows: false, privateIP: '', EVENTS: { send: 'send' }, frontend: {} }

jest.mock('network', () => ({
  __esModule: true,
  default: {
    get_interfaces_list: (callback: Function) => mockGetList(callback),
    get_active_interface: (callback: Function) => mockGetActive(callback),
  },
}))
jest.mock('./windowsInterfaces', () => ({ __esModule: true, default: () => mockWindowsInterfaces() }))
jest.mock('./environment', () => ({ __esModule: true, default: mockEnvironment }))
jest.mock('./Logger', () => ({ __esModule: true, default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }))
jest.mock('./EventBus', () => ({ __esModule: true, default: { emit: jest.fn() } }))
jest.mock('./cliInterface', () => ({ __esModule: true, default: { EVENTS: {} } }))

const EN0 = {
  name: 'en0',
  ip_address: '192.168.1.5',
  mac_address: 'aa:bb:cc:dd:ee:ff',
  netmask: '255.255.255.0',
  type: 'Wireless',
}
const EN1 = {
  name: 'en1',
  ip_address: '10.0.0.7',
  mac_address: '11:22:33:44:55:66',
  netmask: '255.255.255.0',
  type: 'Wired',
}
const BRIDGE = { name: 'bridge0', ip_address: null, mac_address: '36:aa:bb:cc:dd:ee', type: 'Wired' }

// The network package answers from child-process callbacks, so a throw inside one is uncaught.
function later(callback: Function, ...args: any[]) {
  setImmediate(() => callback(...args))
}

describe('backend/LAN getInterfaces', () => {
  let lan: typeof import('./LAN').default
  let Logger: typeof import('./Logger').default

  beforeEach(() => {
    jest.resetModules()
    mockGetList.mockReset()
    mockGetActive.mockReset()
    mockWindowsInterfaces.mockReset()
    mockEnvironment.isWindows = false
    lan = require('./LAN').default
    Logger = require('./Logger').default
    mockGetList.mockClear()
  })

  test('a failed interface list keeps the last interfaces and does not throw', async () => {
    const previous = [{ name: 'en0', ip: '192.168.1.5', active: true }]
    lan.interfaces = previous
    mockGetList.mockImplementation(callback => later(callback, new Error('spawn wmic ENOENT')))
    mockGetActive.mockImplementation(callback => later(callback, new Error('spawn wmic ENOENT')))

    await expect(lan.getInterfaces()).resolves.toBeUndefined()
    expect(lan.interfaces).toBe(previous)
    expect(mockGetActive).not.toHaveBeenCalled()
    expect(Logger.warn).toHaveBeenCalledWith('GET INTERFACES error', expect.anything())
  })

  test('lists interfaces with addresses and marks the active one', async () => {
    mockGetList.mockImplementation(callback => later(callback, null, [EN0, BRIDGE, EN1]))
    mockGetActive.mockImplementation(callback => later(callback, null, { name: 'en1' }))

    await lan.getInterfaces()
    expect(lan.interfaces).toEqual([
      {
        active: false,
        gateway: undefined,
        ip: '192.168.1.5',
        mac: 'aa:bb:cc:dd:ee:ff',
        netmask: '255.255.255.0',
        name: 'en0',
        type: 'Wireless',
      },
      {
        active: true,
        gateway: undefined,
        ip: '10.0.0.7',
        mac: '11:22:33:44:55:66',
        netmask: '255.255.255.0',
        name: 'en1',
        type: 'Wired',
      },
    ])
    expect(lan.privateIP).toBe('10.0.0.7')
  })

  test('still lists interfaces when the active lookup fails', async () => {
    mockGetList.mockImplementation(callback => later(callback, null, [EN0, EN1]))
    mockGetActive.mockImplementation(callback => later(callback, new Error('No active interfaces detected.')))

    await lan.getInterfaces()
    expect(lan.interfaces?.map(i => [i.name, i.active])).toEqual([
      ['en0', false],
      ['en1', false],
    ])
    expect(lan.privateIP).toBe('192.168.1.5')
  })

  test('Windows reads interfaces without the network package', async () => {
    mockEnvironment.isWindows = true
    mockWindowsInterfaces.mockResolvedValue([
      { name: 'Wi-Fi', ip: '10.0.0.15', active: false },
      { name: 'Ethernet', ip: '192.168.1.20', active: true },
    ])

    await lan.getInterfaces()
    expect(mockGetList).not.toHaveBeenCalled()
    expect(lan.privateIP).toBe('192.168.1.20')
  })

  test('Windows lookup failure does not throw', async () => {
    mockEnvironment.isWindows = true
    mockWindowsInterfaces.mockRejectedValue(new Error('A system error occurred: uv_interface_addresses'))

    await expect(lan.getInterfaces()).resolves.toBeUndefined()
    expect(Logger.warn).toHaveBeenCalledWith('GET INTERFACES error', expect.anything())
  })
})
