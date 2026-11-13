import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { MemoryRouter, Route } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const api = vi.hoisted(() => ({
  elevationStatus: vi.fn(),
  requestConfirmation: vi.fn(),
  verifyConfirmation: vi.fn(),
  elevateWithTotp: vi.fn(),
  sendElevationText: vi.fn(),
  elevateWithSms: vi.fn(),
  elevateWithStore: vi.fn(),
  answerElevationStore: vi.fn(),
  elevationReturnTicket: vi.fn(),
  totpOptions: vi.fn(),
  addTotp: vi.fn(),
  smsOptions: vi.fn(),
  addSms: vi.fn(),
  addStoreFactor: vi.fn(),
  answerStore: vi.fn(),
  confirmStore: vi.fn(),
  removeFactor: vi.fn(),
  preferFactor: vi.fn(),
  replaceRecoveryCodes: vi.fn(),
}))
vi.mock('../../services/accountSecurity', () => api)
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_: string, fallback: string, values?: Record<string, unknown>) =>
      fallback.replace(/{{(\w+)}}/g, (_m, name) => String(values?.[name] ?? '')),
  }),
}))
const shell = vi.hoisted(() => ({ browser: { isNative: false }, leaveTo: vi.fn(), uiSet: vi.fn() }))
vi.mock('../../services/browser', () => ({ default: shell.browser, leaveTo: shell.leaveTo }))
vi.mock('../../constants', () => ({ PROTOCOL: 'remoteit://' }))
vi.mock('react-redux', () => ({ useDispatch: () => ({ ui: { set: shell.uiSet } }) }))
vi.mock('../CopyCodeBlock', () => ({ CopyCodeBlock: ({ value }: { value: string }) => <pre>{value}</pre> }))

import { FactorSettings } from './FactorSettings'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const ok = <T,>(data: T) => ({ ok: true, data })
const refused = (error: string) => ({ ok: false, status: 403, error })
const totp = {
  id: 'f-totp',
  kind: 'totp',
  name: 'Phone app',
  createdAt: '2026-09-01',
  lastUsedAt: null,
  preferred: true,
  home: 'here',
}
const sms = {
  id: 'f-sms',
  kind: 'sms',
  name: 'Text',
  createdAt: '2026-09-02',
  lastUsedAt: null,
  preferred: false,
  home: 'here',
}
const status = (over: object = {}) =>
  ok({
    factors: [totp, sms],
    store: null,
    recoveryCodesRemaining: 10,
    elevated: null,
    lockedUntil: null,
    smsAvailable: true,
    smsPhone: null,
    ...over,
  })

let root: Root
let container: HTMLDivElement

const flush = () => act(async () => {})
/** At its route, as the app mounts it — `at` may carry the AS page's answer (?passkey=added). */
let routed = ''
const render = async (at = '/account/security') => {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={[at]}>
        <FactorSettings />
        <Route render={({ location }) => ((routed = location.pathname + location.search), null)} />
      </MemoryRouter>
    )
  )
  await flush()
}
const button = (label: string) => {
  const found = [...container.querySelectorAll('button, a')].find(b => b.textContent === label) as HTMLElement
  if (!found) throw new Error(`no "${label}" in: ${container.textContent}`)
  return found
}
const click = async (label: string) => {
  await act(async () => button(label).click())
  await flush()
}
const type = async (labelText: string, value: string) => {
  const label = [...container.querySelectorAll('label')].find(l => l.textContent?.startsWith(labelText))
  if (!label) throw new Error(`no field "${labelText}" in: ${container.textContent}`)
  const input = document.getElementById(label.htmlFor) as HTMLInputElement
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

beforeEach(() => {
  Object.values(api).forEach(fn => fn.mockReset())
  shell.leaveTo.mockReset()
  shell.uiSet.mockReset()
  shell.browser.isNative = false
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('FactorSettings — every change is proven first', () => {
  it('an elevated session changes straight away', async () => {
    api.elevationStatus.mockResolvedValue(status({ elevated: { until: '2099-01-01', with: 'totp' } }))
    api.removeFactor.mockResolvedValue(ok({ removed: true }))
    await render()
    await act(async () => [...container.querySelectorAll('button')].filter(b => b.textContent === 'Remove')[1].click())
    await flush()
    expect(api.removeFactor).toHaveBeenCalledWith('f-sms', undefined)
    expect(container.textContent).not.toContain('Confirm it’s you')
  })

  it('otherwise asks for a code from a factor it holds, then makes the change', async () => {
    api.elevationStatus.mockResolvedValue(status())
    api.elevateWithTotp.mockResolvedValue(ok({ elevated: { until: '2099-01-01', with: 'totp' } }))
    api.preferFactor.mockResolvedValue(ok({ preferred: 'f-sms' }))
    await render()
    await click('Ask for this first')
    expect(container.textContent).toContain('Confirm it’s you to continue.')
    await type('Authenticator code', '123456')
    await click('Use authenticator code')
    expect(api.elevateWithTotp).toHaveBeenCalledWith('123456')
    expect(api.preferFactor).toHaveBeenCalledWith('f-sms', undefined)
  })

  it('a recovery code pays for exactly the change it was given for', async () => {
    api.elevationStatus.mockResolvedValue(status())
    api.replaceRecoveryCodes.mockResolvedValue(ok({ recoveryCodes: ['AAAA-1111', 'BBBB-2222'] }))
    await render()
    await click('New recovery codes')
    await type('Recovery code', 'ZZZZ-9999')
    await click('Use a recovery code')
    expect(api.replaceRecoveryCodes).toHaveBeenCalledWith('ZZZZ-9999')
    expect(container.textContent).toContain('AAAA-1111')
  })

  it('a stamp that lapsed mid-change asks again, saying why', async () => {
    api.elevationStatus.mockResolvedValue(status({ elevated: { until: '2099-01-01', with: 'totp' } }))
    api.removeFactor.mockResolvedValue(refused('elevation_required'))
    await render()
    await act(async () => [...container.querySelectorAll('button')].filter(b => b.textContent === 'Remove')[0].click())
    await flush()
    expect(container.textContent).toContain('Confirm it’s you again to continue.')
    expect(container.textContent).toContain('Use authenticator code')
  })
})

describe('FactorSettings — the first factor', () => {
  it('is confirmed by an emailed code, then set up and handed its recovery codes', async () => {
    api.elevationStatus.mockResolvedValue(status({ factors: [] }))
    api.requestConfirmation.mockResolvedValue(ok({ sent: true, expiresInSec: 600 }))
    api.verifyConfirmation.mockResolvedValue(ok({ confirmed: true }))
    api.totpOptions.mockResolvedValue(
      ok({ qr: 'data:image/png;base64,x', secret: 'SECRET', otpauth: 'otpauth://x', expiresInSec: 600 })
    )
    api.addTotp.mockResolvedValue(ok({ recoveryCodes: ['CODE-0001'] }))
    await render()
    await click('Add an authenticator app')
    expect(api.requestConfirmation).toHaveBeenCalled()
    await type('Code', '654321')
    await click('Verify')
    expect(api.verifyConfirmation).toHaveBeenCalledWith('654321')
    expect(container.textContent).toContain('SECRET')
    await type('Code', '111222')
    await click('Verify')
    expect(api.addTotp).toHaveBeenCalledWith('111222', undefined)
    expect(container.textContent).toContain('CODE-0001')
  })

  it('held by the credential store asks for the password instead — the store checks it', async () => {
    api.elevationStatus.mockResolvedValue(status({ factors: [], store: { offers: ['totp', 'sms'], reachable: true } }))
    api.addStoreFactor.mockResolvedValue(
      ok({ step: 'qr', handle: 'h1', secret: 'STORESECRET', otpauth: 'x', qr: 'data:x' })
    )
    api.confirmStore.mockResolvedValue(ok({ step: 'done', recoveryCodes: ['CODE-0002'] }))
    await render()
    await click('Add an authenticator app')
    expect(api.requestConfirmation).not.toHaveBeenCalled()
    await type('Current Password', 'hunter22')
    await click('Continue')
    expect(api.addStoreFactor).toHaveBeenCalledWith('totp', 'hunter22', undefined, undefined)
    await type('Code', '333444')
    await click('Verify')
    expect(api.confirmStore).toHaveBeenCalledWith('h1', '333444')
    expect(container.textContent).toContain('CODE-0002')
  })
})

describe('FactorSettings — passkeys', () => {
  it('are listed and removable here, and added on the AS’s own page', async () => {
    const passkey = {
      id: 'f-key',
      kind: 'passkey',
      name: 'Laptop',
      createdAt: '2026-09-03',
      lastUsedAt: null,
      preferred: false,
      home: 'here',
    }
    api.elevationStatus.mockResolvedValue(status({ factors: [passkey] }))
    api.elevationReturnTicket.mockResolvedValue(ok({ url: 'https://login.test/elevate?r=t1', expiresInSec: 900 }))
    await render()
    expect(container.textContent).toContain('Laptop')
    await click('Add a Passkey')
    // The web app comes back to this screen on its own origin: the route is the hash.
    expect(api.elevationReturnTicket).toHaveBeenCalledWith(
      `${window.location.origin}${window.location.pathname}#/account/security`,
      'add-passkey'
    )
    expect(shell.leaveTo).toHaveBeenCalledWith('https://login.test/elevate?r=t1')
  })

  it('in the desktop and mobile apps, comes back on the app’s own scheme — and confirms with a passkey there too', async () => {
    shell.browser.isNative = true
    const passkey = {
      id: 'f-key',
      kind: 'passkey',
      name: 'Laptop',
      createdAt: '2026-09-03',
      lastUsedAt: null,
      preferred: false,
      home: 'here',
    }
    api.elevationStatus.mockResolvedValue(status({ factors: [passkey, totp] }))
    api.elevationReturnTicket.mockResolvedValue(ok({ url: 'https://login.test/elevate?r=t2', expiresInSec: 900 }))
    await render()
    await click('Add a Passkey')
    expect(api.elevationReturnTicket).toHaveBeenLastCalledWith('remoteit://account/security', 'add-passkey')
    await click('Ask for this first')
    await click('Use a passkey')
    expect(api.elevationReturnTicket).toHaveBeenLastCalledWith('remoteit://account/security')
    expect(shell.leaveTo).toHaveBeenLastCalledWith('https://login.test/elevate?r=t2')
  })

  it('back with passkey=added: reads the factors again, says so once, and drops the answer from the route', async () => {
    api.elevationStatus.mockResolvedValue(status())
    await render('/account/security?passkey=added')
    expect(api.elevationStatus).toHaveBeenCalledTimes(2)
    expect(shell.uiSet).toHaveBeenCalledWith({ successMessage: 'Passkey added' })
    expect(routed).toBe('/account/security')
  })

  it('back with passkey=cancelled: reads the factors again and says nothing', async () => {
    api.elevationStatus.mockResolvedValue(status())
    await render('/account/security?passkey=cancelled')
    expect(api.elevationStatus).toHaveBeenCalledTimes(2)
    expect(shell.uiSet).not.toHaveBeenCalled()
    expect(routed).toBe('/account/security')
  })

  it('reads the factors again whenever the window comes back to the front', async () => {
    api.elevationStatus.mockResolvedValue(status())
    await render()
    await act(async () => window.dispatchEvent(new Event('focus')))
    await flush()
    expect(api.elevationStatus).toHaveBeenCalledTimes(2)
  })
})
