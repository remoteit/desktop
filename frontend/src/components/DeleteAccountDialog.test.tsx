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
vi.mock('../helpers/sleep', () => ({
  default: () => Promise.resolve(),
  withTimeout: (promise: Promise<any>) => promise,
}))
vi.mock('./TargetPlatform', () => ({ TargetPlatform: () => null }))
vi.mock('react-redux', () => {
  const state = { user: { id: 'ME', email: 'me@example.com', created: new Date(0) }, connections: { all: [] } }
  return {
    useDispatch: () => dispatch,
    useStore: () => ({ getState: () => state }),
    useSelector: (select: (state: any) => any) => select(state),
  }
})
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
import { OwnedDevices } from '../hooks/useOwnedDevices'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const theme = createTheme(jssTheme(false))
const owned = (thisDeviceOwned: boolean): OwnedDevices => ({
  total: 2,
  thisDeviceOwned,
  devices: [
    { id: 'ON', name: 'Online Pi', state: 'active', platform: 0 },
    { id: 'OFF', name: 'Offline NAS', state: 'inactive', platform: 0 },
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
const check = (index = 0) =>
  act(async () => (dialog().querySelectorAll('input[type=checkbox]')[index] as HTMLInputElement).click())
const typeCode = async (code: string) => {
  const input = dialog().querySelector('input[autocomplete=one-time-code]') as HTMLInputElement
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, code)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
const render = async (devices: OwnedDevices | null = owned(true), props: object = {}) => {
  await act(async () =>
    root.render(
      <ThemeProvider theme={theme}>
        <DeleteAccountDialog
          open
          owned={devices ?? undefined}
          onShowInstructions={vi.fn()}
          onClose={vi.fn()}
          {...props}
        />
      </ThemeProvider>
    )
  )
  await flush()
}
const toFeedback = async () => {
  await check()
  await click('Continue')
}
const toConfirm = async () => {
  await click('Continue')
  await click('Email me a code')
}
const submit = async (code = 'ABC234') => {
  await typeCode(code)
  await click('Delete account permanently')
}

beforeEach(() => {
  vi.resetAllMocks()
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
  it('holds Continue until the person accepts that Remote.It stays on their devices', async () => {
    await render()
    expect([...dialog().querySelectorAll('li')].map(item => item.textContent)).toEqual([
      'Online PiOnline',
      'Offline NASOffline',
    ])
    expect(dialog().textContent).toContain('You own 2 devices')
    expect(dialog().textContent).toContain('This device is unregistered automatically')
    expect(button('Continue').disabled).toBe(true)
    await check()
    expect(button('Continue').disabled).toBe(false)
  })

  it('holds Continue until the devices are known, so this device is never skipped', async () => {
    await render(null)
    await check()
    expect(dialog().textContent).toContain('Loading your devices…')
    expect(button('Continue').disabled).toBe(true)

    await render(null, { devicesFailed: true })
    expect(dialog().textContent).toContain("Your devices couldn't be loaded")
    expect(button('Continue').disabled).toBe(true)
  })

  it('mentions the organization only to someone who has one', async () => {
    await render(owned(false))
    await toFeedback()
    await click('Continue')
    expect(dialog().textContent).not.toContain('Your organization and its roles are deleted')

    await render(owned(false), { hasOrganization: true })
    expect(dialog().textContent).toContain('Your organization and its roles are deleted')
  })

  it('unregisters this device before the account is deleted, then signs out without a survey ticket', async () => {
    dispatch.backend.unregisterThisDevice.mockResolvedValue(true)
    api.graphQLDeleteAccount.mockResolvedValue({ ok: true })
    await render()
    await toFeedback()
    await toConfirm()
    await submit('abc234')

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
    await toFeedback()
    await toConfirm()
    await submit()

    expect(api.graphQLDeleteAccount).not.toHaveBeenCalled()
    expect(dialog().textContent).toContain("This device couldn't be unregistered")
    expect(button('Delete account permanently').disabled).toBe(false)
  })

  it('leaves a device registered to someone else alone', async () => {
    api.graphQLDeleteAccount.mockResolvedValue({ ok: true })
    await render(owned(false))
    await toFeedback()
    await toConfirm()
    await submit()

    expect(dispatch.backend.unregisterThisDevice).not.toHaveBeenCalled()
    expect(api.graphQLDeleteAccount).toHaveBeenCalled()
  })

  it('asks for a new code after the fifth wrong one', async () => {
    api.graphQLDeleteAccount.mockResolvedValue({ ok: false, code: 'NOT_AUTHORIZED', message: 'Not Authorized' })
    await render(owned(false))
    await toFeedback()
    await toConfirm()
    for (let attempt = 1; attempt <= 4; attempt++) {
      await submit()
      expect(dialog().textContent).toContain('That code is incorrect or has expired.')
    }
    await submit()

    expect(api.graphQLDeleteAccount).toHaveBeenCalledTimes(5)
    expect(dialog().textContent).toContain('Too many incorrect codes')
    expect(button('Email me a code')).toBeTruthy()
  })

  it('shows a refusal in place and needs a new code, since the server spent the old one', async () => {
    api.graphQLDeleteAccount.mockResolvedValue({
      ok: false,
      code: 'INVALID_ARGUMENT',
      message: 'Invalid Arguments: your subscription is still active — cancel it first',
      args: ['your subscription is still active — cancel it first'],
    })
    await render(owned(false))
    await toFeedback()
    await toConfirm()
    await submit()

    expect(dialog().textContent).toContain('Your subscription is still active — cancel it first')
    expect(dialog().textContent).not.toContain('Invalid Arguments')
    expect(button('Email me a code')).toBeTruthy()
    expect(dispatch.auth.signOut).not.toHaveBeenCalled()
  })

  it('keeps the code after a network failure, so the person can retry it', async () => {
    api.graphQLDeleteAccount.mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true })
    await render(owned(false))
    await toFeedback()
    await toConfirm()
    await submit()

    expect(dialog().textContent).toContain('Something went wrong. Please try again.')
    await click('Delete account permanently')
    expect(api.graphQLDeleteAccount).toHaveBeenLastCalledWith('ABC234')
    expect(dispatch.auth.signOut).toHaveBeenCalled()
  })

  it('sends the survey only when the person filled it in', async () => {
    api.graphQLDeleteAccount.mockResolvedValue({ ok: true })
    await render(owned(false))
    await toFeedback()
    await check()
    await toConfirm()
    await submit()

    expect(dispatch.feedback.set).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Account deleted: me@example.com',
        data: expect.objectContaining({ reasons: ['My device isn’t supported'] }),
      })
    )
    expect(dispatch.feedback.sendFeedback).toHaveBeenCalled()
  })
})
