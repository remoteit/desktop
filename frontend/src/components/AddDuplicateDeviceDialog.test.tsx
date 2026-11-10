import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'

const { addDuplicateDevice, fetchSingleFull } = vi.hoisted(() => ({
  addDuplicateDevice: vi.fn(),
  fetchSingleFull: vi.fn(),
}))
vi.mock('../services/deviceIdentity', () => ({ graphQLAddDuplicateDevice: addDuplicateDevice }))
vi.mock('../store', () => ({}))
vi.mock('react-redux', () => ({ useDispatch: () => ({ devices: { fetchSingleFull } }) }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('./CopyCodeBlock', () => ({ CopyCodeBlock: ({ value, label }: any) => <div data-block={value}>{label}</div> }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) => (typeof a === 'string' ? fill(a, b) : fill(a.defaultValue, a)),
    }),
  }
})

import { AddDuplicateDeviceDialog, DuplicateTarget } from './AddDuplicateDeviceDialog'
import { lightColors } from '../styling'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})

const SECRET = 'r3dk_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA.c2VlZA'
const device = { id: 'X1', name: 'Kiosk' }

let root: Root
let onClose: Mock<() => void>
let onRotate: Mock<() => void>
const body = () => document.body.textContent || ''
const button = (text: string) =>
  [...document.body.querySelectorAll('button')].find(b => b.textContent?.trim() === text) as HTMLButtonElement
const nameInput = () => document.body.querySelector('input[maxlength="255"]') as HTMLInputElement

async function render(target: DuplicateTarget, rotate = true) {
  document.body.innerHTML = ''
  onClose = vi.fn<() => void>()
  onRotate = vi.fn<() => void>()
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <ThemeProvider theme={theme}>
        <AddDuplicateDeviceDialog
          device={device}
          target={target}
          rotate={rotate}
          onRotate={onRotate}
          onClose={onClose}
        />
      </ThemeProvider>
    )
  )
}

beforeEach(() => {
  addDuplicateDevice.mockReset()
  fetchSingleFull.mockReset()
})

afterEach(() => act(() => root.unmount()))

describe('AddDuplicateDeviceDialog', () => {
  it('for the copy: a new device named for it, its key shown once to install on the copy', async () => {
    addDuplicateDevice.mockResolvedValue({ deviceId: 'D2', name: 'Kiosk (copy)', key: SECRET })
    await render('copy')
    expect(body()).toContain('Keep the Copy as a New Device')
    expect(nameInput().value).toBe('Kiosk (copy)')
    await act(async () => button('Make Device and Key').click())
    expect(addDuplicateDevice).toHaveBeenCalledWith('X1', 'Kiosk (copy)')
    expect(fetchSingleFull).toHaveBeenCalledWith({ id: 'D2', newDevice: true, silent: true })
    expect(body()).toContain(
      'Install this key on the copy — the other machine — and restart it: it then boots as Kiosk (copy)'
    )
    expect(body()).toContain('Until then, whichever machine is online first is Kiosk, and the other stays refused.')
    expect(document.body.querySelector('[data-block]')!.getAttribute('data-block')).toBe(SECRET)
  })

  it('for the original: its key to install on the original machine, the copy becoming the device', async () => {
    addDuplicateDevice.mockResolvedValue({ deviceId: 'D3', key: SECRET })
    await render('original')
    expect(body()).toContain('Make the Copy the Original')
    expect(nameInput().value).toBe('Kiosk (original machine)')
    await act(async () => button('Make Device and Key').click())
    expect(body()).toContain(
      'Install this key on the original machine and restart it: it then boots as Kiosk (original machine), and the copy, keeping the key of Kiosk, becomes Kiosk.'
    )
  })

  it("after the key, offers to rotate the device's keys too", async () => {
    addDuplicateDevice.mockResolvedValue({ deviceId: 'D2', key: SECRET })
    await render('copy')
    await act(async () => button('Make Device and Key').click())
    await act(async () => button('Done').click())
    expect(onClose).not.toHaveBeenCalled()
    expect(body()).toContain('Rotate the keys of Kiosk too?')
    expect(body()).toContain('A copied key may be in more places than the two machines')
    expect(document.body.querySelector('[data-block]')).toBeNull()
    await act(async () => button('Rotate keys').click())
    expect(onRotate).toHaveBeenCalled()
  })

  it('Not now, or no rotation to offer, closes', async () => {
    addDuplicateDevice.mockResolvedValue({ deviceId: 'D2', key: SECRET })
    await render('copy')
    await act(async () => button('Make Device and Key').click())
    await act(async () => button('Done').click())
    await act(async () => button('Not now').click())
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onRotate).not.toHaveBeenCalled()

    await render('copy', false)
    await act(async () => button('Make Device and Key').click())
    await act(async () => button('Done').click())
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("asks for a name, and shows graphql's refusal", async () => {
    await render('copy')
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    await act(async () => {
      setter.call(nameInput(), '  ')
      nameInput().dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => button('Make Device and Key').click())
    expect(body()).toContain('A name is required')
    expect(addDuplicateDevice).not.toHaveBeenCalled()

    addDuplicateDevice.mockResolvedValue({ reason: 'Kiosk has no duplicate to resolve' })
    await act(async () => {
      setter.call(nameInput(), 'Kiosk B')
      nameInput().dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => button('Make Device and Key').click())
    expect(body()).toContain('Kiosk has no duplicate to resolve')
  })
})
