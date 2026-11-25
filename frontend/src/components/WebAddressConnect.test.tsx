import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { openWebAddress, dropped, known, request, opened } = vi.hoisted(() => ({
  openWebAddress: vi.fn(),
  dropped: { value: 0 },
  known: { value: undefined as string | undefined },
  request: vi.fn(),
  opened: vi.fn(),
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))
vi.mock('react-redux', () => ({ useDispatch: () => ({}), useSelector: (select: any) => select({ ui: {} }) }))
vi.mock('../services/deviceSessionInfo', () => ({}))
vi.mock('../services/webAddress', () => ({
  openWebAddress,
  subscribeWebAddresses: () => () => {},
  knownWebAddress: () => known.value,
  requestWebAddress: request,
  webTarget: () => ({ web: true }),
}))
vi.mock('../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => true }))
vi.mock('../hooks/useReadAgain', async () => ({
  useReadAgain: () => dropped.value,
  useReadEffect: (await import('react')).useEffect,
}))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ title, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {title}
    </button>
  ),
}))
vi.mock('../buttons/CopyIconButton', () => ({ CopyIconButton: ({ value }: any) => <span data-copy={value} /> }))
vi.mock('./Icon', () => ({ Icon: () => null }))

import { WebAddressConnect } from './WebAddressConnect'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const service = { id: 'S1', deviceID: 'D1', attributes: {} } as IService

let container: HTMLDivElement
let root: Root
beforeEach(() => {
  openWebAddress.mockReset().mockResolvedValue(true)
  dropped.value = 0
  known.value = undefined
  request.mockReset()
  opened.mockReset()
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
})
const render = () => act(async () => root.render(<WebAddressConnect service={service} onOpened={opened} />))
const button = () => container.querySelector('button')!
const open = () => act(async () => button().click())

describe('the web address panel', () => {
  it('says whose eyes it passes, and opens the service', async () => {
    await render()
    expect(container.textContent).toContain('Sign in and open in your browser')
    expect(container.textContent).toContain(
      "Goes through remote.it's proxy, which can read it. Use the remote.it app for an end-to-end connection."
    )
    await open()
    expect(openWebAddress).toHaveBeenCalledExactlyOnceWith('S1')
    expect(opened).toHaveBeenCalledOnce()
    expect(container.textContent).not.toContain('Could not open it')
  })

  it('is not opened twice at once', async () => {
    let done: (value: true) => void = () => {}
    openWebAddress.mockReturnValue(new Promise(resolve => (done = resolve)))
    await render()
    await open()
    expect(button().disabled).toBe(true)
    await act(async () => done(true))
    expect(button().disabled).toBe(false)
  })

  it('says a refusal in graphql’s words, or that it could not, until another sign-in serves it', async () => {
    openWebAddress.mockResolvedValueOnce({ reason: 'No proxy is in service' })
    await render()
    await open()
    expect(container.textContent).toContain('No proxy is in service')
    expect(opened).not.toHaveBeenCalled()
    openWebAddress.mockRejectedValueOnce(new Error('gone'))
    await open()
    expect(container.textContent).not.toContain('No proxy is in service')
    expect(container.textContent).toContain('Could not open it: try again')
    expect(button().disabled).toBe(false)
    dropped.value = 1
    await render()
    expect(container.textContent).not.toContain('Could not open it')
  })

  it('shows its address, to copy, once there is one', async () => {
    await render()
    expect(request).toHaveBeenCalledWith({ id: 'S1', deviceID: 'D1', route: undefined, web: true })
    expect(container.querySelector('[data-copy]')).toBeNull()
    known.value = 'https://web-acme.solo.r3proxy.com'
    await render()
    expect(container.textContent).toContain('web-acme.solo.r3proxy.com')
    expect(container.querySelector<HTMLElement>('[data-copy]')!.dataset.copy).toBe('https://web-acme.solo.r3proxy.com')
  })
})
