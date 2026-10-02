import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const api = vi.hoisted(() => ({ graphQLRequestAccountDeletion: vi.fn(), graphQLDeleteAccount: vi.fn() }))
const dispatch = vi.hoisted(() => ({
  backend: { unregisterThisDevice: vi.fn() },
  feedback: { set: vi.fn(), sendFeedback: vi.fn() },
  auth: { signOut: vi.fn() },
}))
vi.mock('../services/graphQLMutation', () => api)
vi.mock('../store', () => ({}))
vi.mock('../helpers/sleep', () => ({ default: () => Promise.resolve() }))
vi.mock('./TargetPlatform', () => ({ TargetPlatform: () => null }))
vi.mock('react-redux', () => ({
  useDispatch: () => dispatch,
  useSelector: (select: (state: any) => any) =>
    select({ user: { id: 'ME', email: 'me@example.com', created: new Date(0) }, connections: { all: [] } }),
}))
vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (_: string, fallback: string | Record<string, any>, values?: Record<string, any>) => {
      const options = typeof fallback === 'string' ? values : fallback
      const text = typeof fallback === 'string' ? fallback : fallback.defaultValue
      return text.replace(/{{(\w+)}}/g, (_m: string, name: string) => String(options?.[name] ?? ''))
    },
  }),
}))

import { ThemeProvider } from '@mui/material'
import { createTheme } from '@mui/material/styles'
import { jssTheme } from '../styling/theme'
import { DeleteAccountDialog } from './DeleteAccountDialog'
import { OwnedDevices } from './OwnedDevicesList'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const theme = createTheme(jssTheme(false))
const THIS_ID = 'THIS'
const owned = (thisDeviceOwned: boolean): OwnedDevices => ({
  total: 3,
  thisDeviceOwned,
  devices: [
    { id: 'OFF', name: 'Offline NAS', state: 'inactive', platform: 0 },
    { id: THIS_ID, name: 'This laptop', state: 'active', platform: 0 },
    { id: 'ON', name: 'Online Pi', state: 'active', platform: 0 },
  ],
})

let root: Root
let container: HTMLDivElement

const flush = () => act(async () => {})
const dialog = () => document.querySelector('[role=dialog]') as HTMLElement
const button = (label: string) => {
  const found = [...dialog().querySelectorAll('button')].find(b => b.textContent === label)
  if (!found) throw new Error(`no "${label}" in: ${dialog().textContent}`)
  return found
}
const click = async (label: string) => {
  await act(async () => button(label).click())
  await flush()
}
const typeCode = async (code: string) => {
  const input = dialog().querySelector('input[autocomplete=one-time-code]') as HTMLInputElement
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, code)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
const render = async (devices = owned(true), thisId = THIS_ID) => {
  await act(async () =>
    root.render(
      <ThemeProvider theme={theme}>
        <DeleteAccountDialog open owned={devices} thisId={thisId} onShowInstructions={vi.fn()} onClose={vi.fn()} />
      </ThemeProvider>
    )
  )
  await flush()
}
const toConfirm = async () => {
  await act(async () => (dialog().querySelector('input[type=checkbox]') as HTMLInputElement).click())
  await click('Continue')
  await click('Continue')
  await click('Email me a code')
}

beforeEach(() => {
  Object.values(api).forEach(fn => fn.mockReset())
  dispatch.backend.unregisterThisDevice.mockReset()
  dispatch.feedback.set.mockReset()
  dispatch.feedback.sendFeedback.mockReset()
  dispatch.auth.signOut.mockReset()
  api.graphQLRequestAccountDeletion.mockResolvedValue({ ok: true })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('DeleteAccountDialog', () => {
  it('holds Continue until the person accepts that Remote.It stays on their other devices', async () => {
    await render()
    const names = [...dialog().querySelectorAll('li')].map(item => item.textContent)
    expect(names).toEqual(['Online PiOnline', 'Offline NASOffline'])
    expect(dialog().textContent).toContain('You own 2 devices')
    expect(button('Continue').disabled).toBe(true)
    await act(async () => (dialog().querySelector('input[type=checkbox]') as HTMLInputElement).click())
    expect(button('Continue').disabled).toBe(false)
  })

  it('unregisters this device before the account is deleted, then signs out without a survey ticket', async () => {
    dispatch.backend.unregisterThisDevice.mockResolvedValue(true)
    api.graphQLDeleteAccount.mockResolvedValue({ ok: true })
    await render()
    await toConfirm()
    await typeCode('abc234')
    await click('Delete account permanently')

    expect(api.graphQLDeleteAccount).toHaveBeenCalledWith('ABC234')
    expect(dispatch.backend.unregisterThisDevice.mock.invocationCallOrder[0]).toBeLessThan(
      api.graphQLDeleteAccount.mock.invocationCallOrder[0]
    )
    expect(dispatch.feedback.set).not.toHaveBeenCalled()
    expect(dispatch.auth.signOut).toHaveBeenCalled()
    expect(dialog().textContent).toContain('Your account has been deleted')
  })

  it('never deletes the account when this device could not be unregistered', async () => {
    dispatch.backend.unregisterThisDevice.mockResolvedValue(false)
    await render()
    await toConfirm()
    await typeCode('ABC234')
    await click('Delete account permanently')

    expect(api.graphQLDeleteAccount).not.toHaveBeenCalled()
    expect(dialog().textContent).toContain("This device couldn't be unregistered")
    expect(button('Delete account permanently').disabled).toBe(false)
  })

  it('leaves a device registered to someone else alone', async () => {
    api.graphQLDeleteAccount.mockResolvedValue({ ok: true })
    await render(owned(false))
    await toConfirm()
    await typeCode('ABC234')
    await click('Delete account permanently')

    expect(dispatch.backend.unregisterThisDevice).not.toHaveBeenCalled()
    expect(api.graphQLDeleteAccount).toHaveBeenCalled()
  })

  it('asks for a new code after the fifth wrong one', async () => {
    api.graphQLDeleteAccount.mockResolvedValue({ ok: false, code: 'NOT_AUTHORIZED', message: 'Not Authorized' })
    await render(owned(false))
    await toConfirm()
    for (let attempt = 1; attempt <= 4; attempt++) {
      await typeCode('ABC234')
      await click('Delete account permanently')
      expect(dialog().textContent).toContain('That code is incorrect or has expired.')
    }
    await typeCode('ABC234')
    await click('Delete account permanently')

    expect(api.graphQLDeleteAccount).toHaveBeenCalledTimes(5)
    expect(dialog().textContent).toContain('Too many incorrect codes')
    expect(button('Email me a code')).toBeTruthy()
  })

  it('shows a refusal in place and needs a new code, since the server spent the old one', async () => {
    api.graphQLDeleteAccount.mockResolvedValue({
      ok: false,
      code: 'INVALID_ARGUMENT',
      message: 'your subscription is still active — cancel it first',
    })
    await render(owned(false))
    await toConfirm()
    await typeCode('ABC234')
    await click('Delete account permanently')

    expect(dialog().textContent).toContain('Your subscription is still active — cancel it first')
    expect(button('Email me a code')).toBeTruthy()
    expect(dispatch.auth.signOut).not.toHaveBeenCalled()
  })

  it('sends the survey only when the person filled it in', async () => {
    api.graphQLDeleteAccount.mockResolvedValue({ ok: true })
    await render(owned(false))
    await act(async () => (dialog().querySelector('input[type=checkbox]') as HTMLInputElement).click())
    await click('Continue')
    await act(async () => (dialog().querySelectorAll('input[type=checkbox]')[0] as HTMLInputElement).click())
    await click('Continue')
    await click('Email me a code')
    await typeCode('ABC234')
    await click('Delete account permanently')

    expect(dispatch.feedback.set).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Account deleted: me@example.com',
        data: expect.objectContaining({ reasons: ['My device isn’t supported'] }),
      })
    )
    expect(dispatch.feedback.sendFeedback).toHaveBeenCalled()
  })
})
