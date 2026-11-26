import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { service, state, uiSet } = vi.hoisted(() => ({
  service: {
    decideWebAddress: vi.fn(),
    opensAtWebAddress: vi.fn(),
    openWebAddress: vi.fn(),
    openWebService: vi.fn(),
    webAddressAllowed: vi.fn(),
    webAddressGate: vi.fn(),
    listeners: new Set<() => void>(),
  },
  state: { ui: { proxyFleet: undefined as string | undefined } },
  uiSet: vi.fn(),
}))
vi.mock('../services/webAddress', () => ({
  ...service,
  subscribeWebAddresses: (listener: () => void) => {
    service.listeners.add(listener)
    return () => service.listeners.delete(listener)
  },
  knownWebAddress: () => undefined,
  requestWebAddress: vi.fn(),
  webTarget: vi.fn(),
}))
vi.mock('../services/deviceSessionInfo', () => ({
  deviceSessionInfo: () => undefined,
  subscribeDeviceSessionInfo: () => () => {},
}))
vi.mock('./useDeviceSessions', () => ({ useDeviceSessions: () => true }))
vi.mock('./useReadAgain', async () => ({ useReadAgain: () => 0, useReadEffect: (await import('react')).useEffect }))
vi.mock('react-redux', () => ({
  useSelector: (select: any) => select(state),
  useDispatch: () => ({ ui: { set: uiSet } }),
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))

import { useOpenWebService, useRecheck, useWebAddress } from './useWebAddress'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const target = { id: 'S1', deviceID: 'D1', web: true }
let seen: boolean | undefined | 'UNCHECKED'
let open: () => Promise<void>
let recheck: () => Promise<void>
let panel: ReturnType<typeof useRecheck>
const Shown: React.FC = () => {
  seen = useWebAddress(target)
  ;({ open, recheck } = useOpenWebService(target))
  panel = useRecheck(target)
  return null
}
let root: Root
let answer: (value: boolean | undefined) => void
beforeEach(() => {
  vi.clearAllMocks()
  state.ui.proxyFleet = undefined
  service.webAddressAllowed.mockReturnValue(true)
  service.opensAtWebAddress.mockReturnValue(undefined)
  service.webAddressGate.mockReturnValue(undefined)
  service.decideWebAddress.mockImplementation(() => new Promise(resolve => (answer = resolve)))
  root = createRoot(document.createElement('div'))
})
afterEach(async () => {
  await act(async () => root.unmount())
})
const render = () => act(async () => root.render(<Shown />))

describe('whether a service is opened at its web address', () => {
  it('is asked for, and not known until it is answered', async () => {
    await render()
    expect(seen).toBeUndefined()
    expect(service.decideWebAddress).toHaveBeenCalledExactlyOnceWith(target)
    service.opensAtWebAddress.mockReturnValue(true)
    await act(async () => answer(true))
    expect(seen).toBe(true)
  })

  it('is said not to be checked, as against not, where it could not be, until it is after all', async () => {
    await render()
    await act(async () => answer(undefined))
    expect(seen).toBe('UNCHECKED')
    // Nothing is asked again by itself.
    await render()
    expect(service.decideWebAddress).toHaveBeenCalledTimes(1)
    service.opensAtWebAddress.mockReturnValue(true)
    service.webAddressGate.mockReturnValue(true)
    await act(async () => service.listeners.forEach(listener => listener()))
    expect(seen).toBe(true)
  })

  it('is not, at once and with nothing asked, where it cannot be', async () => {
    service.webAddressAllowed.mockReturnValue(false)
    service.opensAtWebAddress.mockReturnValue(false)
    await render()
    expect(seen).toBe(false)
    expect(service.decideWebAddress).not.toHaveBeenCalled()
  })

  it('is asked for again when the Test setting changes', async () => {
    await render()
    await act(async () => answer(undefined))
    expect(seen).toBe('UNCHECKED')
    state.ui.proxyFleet = 'CONNECTD'
    await render()
    expect(service.decideWebAddress).toHaveBeenCalledTimes(2)
    expect(seen).toBeUndefined()
    service.opensAtWebAddress.mockReturnValue(true)
    await act(async () => answer(true))
    expect(seen).toBe(true)
    state.ui.proxyFleet = 'LEGACY'
    service.opensAtWebAddress.mockReturnValue(false)
    await render()
    expect(seen).toBe(false)
  })
})

describe('one that did not open from a row', () => {
  it('is said as an error of the app’s, in graphql’s words where it refused', async () => {
    await render()
    service.openWebService.mockResolvedValueOnce(true)
    await act(() => open())
    expect(uiSet).not.toHaveBeenCalled()
    service.openWebService.mockResolvedValueOnce({ reason: 'No proxy is in service' })
    await act(() => open())
    expect(uiSet).toHaveBeenLastCalledWith({ errorMessage: 'No proxy is in service' })
    service.openWebService.mockRejectedValueOnce(new Error('gone'))
    await act(() => open())
    expect(uiSet).toHaveBeenLastCalledWith({ errorMessage: 'Could not open it: try again' })
  })
})

describe('trying again what could not be checked', () => {
  it('asks once, however often it is pressed meanwhile', async () => {
    await render()
    await act(async () => answer(undefined))
    service.decideWebAddress.mockClear()
    let first: Promise<unknown>
    await act(async () => void (first = panel.recheck()))
    expect(panel.checking).toBe(true)
    await act(async () => void panel.recheck())
    expect(service.decideWebAddress).toHaveBeenCalledExactlyOnceWith(target)
    service.opensAtWebAddress.mockReturnValue(true)
    await act(async () => {
      answer(true)
      await first
    })
    expect(panel.checking).toBe(false)
    expect(seen).toBe(true)
  })

  it('from a row says that it could not be then either, and opens nothing', async () => {
    await render()
    service.decideWebAddress.mockResolvedValueOnce(undefined)
    await act(() => recheck())
    expect(uiSet).toHaveBeenCalledExactlyOnceWith({
      errorMessage: 'Could not check how this service opens, so it was not connected. Try again.',
    })
    service.decideWebAddress.mockResolvedValueOnce(true)
    await act(() => recheck())
    expect(uiSet).toHaveBeenCalledTimes(1)
    expect(service.openWebService).not.toHaveBeenCalled()
  })
})
