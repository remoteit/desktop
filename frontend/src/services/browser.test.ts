import { describe, it, expect, vi, beforeEach } from 'vitest'

const { open, openUrl, set } = vi.hoisted(() => ({ open: vi.fn(), openUrl: vi.fn(), set: vi.fn() }))

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true, getPlatform: () => 'ios' } }))
vi.mock('@capacitor/browser', () => ({ Browser: { open, close: vi.fn() } }))
vi.mock('@capacitor/app-launcher', () => ({ AppLauncher: { openUrl } }))
vi.mock('../store', () => ({ store: { dispatch: { ui: { set } } } }))
vi.mock('../helpers/versionHelper', () => ({ fullVersion: () => 'test' }))

import { windowOpen } from './browser'

const URL = 'https://homeassistant-evan.on.solo.remote.it'

beforeEach(() => {
  open.mockReset()
  openUrl.mockReset()
  set.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('windowOpen on a phone', () => {
  it('opens a web link in the in-app browser', async () => {
    open.mockResolvedValue(undefined)
    await windowOpen(URL, '_blank')
    expect(open).toHaveBeenCalledWith({ url: URL, windowName: '_blank' })
    expect(openUrl).not.toHaveBeenCalled()
    expect(set).not.toHaveBeenCalled()
  })

  it('hands a web link the in-app browser refuses to the system browser', async () => {
    open.mockRejectedValue(new Error('Unable to display URL'))
    openUrl.mockResolvedValue({ completed: true })
    await windowOpen(URL, '_blank')
    expect(openUrl).toHaveBeenCalledWith({ url: URL })
    expect(set).not.toHaveBeenCalled()
  })

  it('names the whole URL and the reason when nothing opens it', async () => {
    open.mockRejectedValue(new Error('Unable to display URL'))
    openUrl.mockResolvedValue({ completed: false })
    await windowOpen(URL, '_blank')
    expect(set).toHaveBeenCalledWith({ errorMessage: `We couldn't open ${URL} (Unable to display URL)` })
  })

  it('does not retry an app link the system could not open', async () => {
    openUrl.mockRejectedValue(new Error('Invalid URL'))
    await windowOpen('vnc://user@host:5900', '_blank', true)
    expect(openUrl).toHaveBeenCalledOnce()
    expect(set).toHaveBeenCalledWith({ errorMessage: "We couldn't open vnc://user@host:5900 (Invalid URL)" })
  })
})
