import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
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
vi.mock('../../services/accountSecurity', () => ({
  ...api,
  KIND_LABEL: { totp: 'Authenticator app', sms: 'Text message', passkey: 'Passkey' },
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_: string, fallback: string, values?: Record<string, unknown>) =>
      fallback.replace(/{{(\w+)}}/g, (_m, name) => String(values?.[name] ?? '')),
  }),
}))
vi.mock('../../services/browser', () => ({ default: { isNative: false } }))
vi.mock('../../constants', () => ({ OAUTH_ISSUER: 'https://login.test' }))
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
const render = async () => {
  await act(async () => root.render(<FactorSettings />))
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
    await render()
    expect(container.textContent).toContain('Laptop')
    expect(button('Add a Passkey').getAttribute('href')).toBe('https://login.test/account/console/logins#elevation')
  })
})
