import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { ticket } = vi.hoisted(() => ({ ticket: vi.fn() }))
vi.mock('../services/endpointTicket', () => ({ endpointTicket: ticket }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key: string, text: string) => text }) }))

import { EndpointSignInPage } from './EndpointSignInPage'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const BACK = 'https://web-acme.solo.r3proxy.com/page'
const PAGE = `/endpoint-sign-in?endpoint=EP-1&return=${encodeURIComponent(BACK)}`
let container: HTMLDivElement
let root: Root
let replace: ReturnType<typeof vi.fn>
const own = window.location

beforeEach(() => {
  ticket.mockReset()
  replace = vi.fn()
  Object.defineProperty(window, 'location', { configurable: true, value: { replace } })
  container = document.createElement('div')
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  Object.defineProperty(window, 'location', { configurable: true, value: own })
})
const render = (at = PAGE) =>
  act(async () =>
    root.render(
      <MemoryRouter initialEntries={[at]}>
        <EndpointSignInPage />
      </MemoryRouter>
    )
  )
const retry = () => container.querySelector('button')

describe('signing in to an endpoint', () => {
  it('goes back with its ticket, replacing this page', async () => {
    ticket.mockResolvedValue({ url: `${BACK}?__r3_ticket=T` })
    await render()
    expect(ticket).toHaveBeenCalledExactlyOnceWith('EP-1', BACK)
    expect(replace).toHaveBeenCalledExactlyOnceWith(`${BACK}?__r3_ticket=T`)
  })

  it.each(['REFUSED', 'GONE'])('says no access, with nothing to try again: %s', async answer => {
    ticket.mockResolvedValue(answer)
    await render()
    expect(container.textContent).toBe('You do not have access to this endpoint.')
    expect(retry()).toBeNull()
    expect(replace).not.toHaveBeenCalled()
  })

  it('says access lost where that is why it was sent here, unless a ticket is given all the same', async () => {
    ticket.mockResolvedValue('REFUSED')
    await render(`${PAGE}&reason=access`)
    expect(container.textContent).toBe('You no longer have access to this endpoint.')
    await act(async () => root.unmount())
    root = createRoot(container)
    ticket.mockResolvedValue({ url: BACK })
    await render(`${PAGE}&reason=access`)
    expect(replace).toHaveBeenCalledExactlyOnceWith(BACK)
  })

  it.each([PAGE, `${PAGE}&reason=access`])('says a failure as that, and tries again when asked', async at => {
    ticket.mockResolvedValueOnce('FAILED')
    await render(at)
    expect(container.textContent).toContain('You could not be signed in.')
    expect(container.textContent).not.toContain('access')
    let answer: (value: unknown) => void = () => {}
    ticket.mockReturnValueOnce(new Promise(resolve => (answer = resolve)))
    await act(async () => retry()!.click())
    expect(container.textContent).toBe('Signing you in…')
    await act(async () => answer({ url: BACK }))
    expect(ticket).toHaveBeenCalledTimes(2)
    expect(replace).toHaveBeenCalledExactlyOnceWith(BACK)
  })

  it('asks nothing for a link that is incomplete', async () => {
    await render('/endpoint-sign-in?endpoint=EP-1')
    expect(container.textContent).toBe('This sign-in link is incomplete.')
    expect(ticket).not.toHaveBeenCalled()
  })
})
