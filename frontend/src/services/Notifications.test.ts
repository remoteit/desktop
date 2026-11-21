import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DEVICE_TYPE } from '@common/applications'

const { browser, emit, open, created } = vi.hoisted(() => ({
  browser: { isElectron: false, isPortal: false },
  emit: vi.fn(),
  open: vi.fn(),
  created: [] as any[],
}))

vi.mock('../store', () => ({ store: { getState: () => ({ user: { notificationSettings: {} } }) } }))
vi.mock('../models/accounts', () => ({ getAccountIds: () => [] }))
vi.mock('../selectors/organizations', () => ({ selectOrganization: () => undefined }))
vi.mock('../platforms', () => ({ platforms: { name: () => 'Linux' } }))
vi.mock('./Controller', () => ({ emit }))
vi.mock('./openNotification', () => ({ openNotification: open }))
vi.mock('./browser', () => ({ default: browser }))

import { notify } from './Notifications'

class FakeNotification {
  static permission = 'granted'
  static requestPermission = vi.fn()
  onclick?: () => void
  onclose?: () => void
  constructor(public title: string, public options: NotificationOptions) {
    created.push(this)
  }
}
vi.stubGlobal('Notification', FakeNotification)

const TIME = Date.parse('2026-11-09T12:00:00Z')

const wentOffline = {
  type: 'DEVICE_STATE',
  state: 'inactive',
  timestamp: TIME,
  authUserId: 'U1',
  target: [
    {
      typeID: DEVICE_TYPE,
      name: 'pi',
      deviceId: 'D1',
      owner: { id: 'U1' },
      device: { notificationSettings: { desktopNotifications: true } },
    },
  ],
} as unknown as ICloudEvent

beforeEach(() => {
  vi.clearAllMocks()
  created.length = 0
})

describe('clicking a desktop notification', () => {
  it('opens its page with what was clicked, and brings the Electron window out of the tray', async () => {
    browser.isElectron = true
    const focus = vi.spyOn(window, 'focus').mockImplementation(() => {})
    await notify(wentOffline)
    created[0].onclick()

    expect(created[0].title).toBe('pi went offline')
    expect(focus).toHaveBeenCalled()
    expect(emit).toHaveBeenCalledWith('open')
    expect(open).toHaveBeenCalledWith('/devices/D1', { title: 'pi went offline', body: 'Linux', time: TIME })
  })

  it('in a browser, focuses the tab and asks no app for a window', async () => {
    browser.isElectron = false
    vi.spyOn(window, 'focus').mockImplementation(() => {})
    await notify(wentOffline)
    created[0].onclick()

    expect(emit).not.toHaveBeenCalled()
    expect(open).toHaveBeenCalledWith('/devices/D1', { title: 'pi went offline', body: 'Linux', time: TIME })
  })
})
