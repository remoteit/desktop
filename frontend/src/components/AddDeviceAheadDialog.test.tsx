import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'

const { addDevice, fetchIfEmpty, fetchSingleFull, push } = vi.hoisted(() => ({
  addDevice: vi.fn(),
  fetchIfEmpty: vi.fn(),
  fetchSingleFull: vi.fn(),
  push: vi.fn(),
}))
vi.mock('../services/deviceIdentity', () => ({ graphQLAddDevice: addDevice }))
vi.mock('../store', () => ({}))
vi.mock('../models/products', () => ({
  getProductModel: () => ({
    all: [
      { id: 'P1', name: 'Kiosk image' },
      { id: 'P2', name: 'Pump' },
    ],
  }),
}))
vi.mock('react-redux', () => ({
  useDispatch: () => ({ products: { fetchIfEmpty }, devices: { fetchSingleFull } }),
  useSelector: (select: any) => select({}),
}))
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push }) }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'ORG' }))
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

import { AddDeviceAheadDialog } from './AddDeviceAheadDialog'
import { lightColors } from '../styling'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})

const SECRET = 'r3dk_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA.c2VlZA'

let root: Root
let onClose: Mock<() => void>
const body = () => document.body.textContent || ''
const button = (text: string) =>
  [...document.body.querySelectorAll('button')].find(b => b.textContent?.trim() === text) as HTMLButtonElement
const nameInput = () => document.body.querySelector('input[maxlength="255"]') as HTMLInputElement
const freshBoot = () => document.body.querySelector('input[type="checkbox"]') as HTMLInputElement

async function typeName(text: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  await act(async () => {
    setter.call(nameInput(), text)
    nameInput().dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function chooseProduct(name: string) {
  const select = document.body.querySelector('[role="combobox"], [role="button"][aria-haspopup="listbox"]')!
  await act(async () => select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })))
  const option = [...document.body.querySelectorAll('[role="option"]')].find(o => o.textContent === name) as HTMLElement
  await act(async () => option.click())
}

beforeEach(async () => {
  document.body.innerHTML = ''
  addDevice.mockReset()
  fetchIfEmpty.mockReset()
  fetchSingleFull.mockReset()
  push.mockReset()
  onClose = vi.fn<() => void>()
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <ThemeProvider theme={theme}>
        <AddDeviceAheadDialog onClose={onClose} />
      </ThemeProvider>
    )
  )
})

afterEach(() => act(() => root.unmount()))

describe('AddDeviceAheadDialog', () => {
  it('reads the products, and asks for a name before asking graphql', async () => {
    expect(fetchIfEmpty).toHaveBeenCalled()
    expect(freshBoot().checked).toBe(true)
    await act(async () => button('Add').click())
    expect(body()).toContain('A name is required')
    expect(addDevice).not.toHaveBeenCalled()
  })

  it('adds a device that starts fresh every boot, with its product, and shows its key once', async () => {
    addDevice.mockResolvedValue({ deviceId: 'D9', name: 'Kiosk 4', key: SECRET })
    await typeName(' Kiosk 4 ')
    await chooseProduct('Kiosk image')
    await act(async () => button('Add').click())
    expect(addDevice).toHaveBeenCalledWith({ name: 'Kiosk 4', productId: 'P1', freshBoot: true })
    expect(fetchSingleFull).toHaveBeenCalledWith({ id: 'D9', newDevice: true, silent: true })
    expect(body()).toContain('Added Kiosk 4')
    expect(body()).toContain('Copy or download this key now')
    expect([...document.body.querySelectorAll('[data-block]')].map(b => b.getAttribute('data-block'))).toEqual([
      SECRET,
      `REMOTEIT_JOIN_KEY=${SECRET}`,
      [
        'docker run -d --name remoteit --restart unless-stopped --network host',
        '-e REMOTEIT_JOIN_KEY_FILE=/run/secrets/remoteit_join_key',
        '-v "$PWD/remoteit-device-join-key-kiosk-4.txt:/run/secrets/remoteit_join_key:ro"',
        'ghcr.io/remoteit/device',
      ].join(' \\\n  '),
    ])
    expect(button('Download')).toBeTruthy()

    await act(async () => button('Open device').click())
    expect(onClose).toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith('/devices/D9')
  })

  it('a device that keeps its identity has no key, and needs no product', async () => {
    addDevice.mockResolvedValue({ deviceId: 'D10' })
    await typeName('Gateway')
    await act(async () => freshBoot().click())
    await act(async () => button('Add').click())
    // With no product, the account being looked at.
    expect(addDevice).toHaveBeenCalledWith({ name: 'Gateway', freshBoot: false, accountId: 'ORG' })
    expect(body()).toContain('takes no licence until it first comes online')
    expect(document.body.querySelector('[data-block]')).toBeNull()
    expect(button('Download')).toBeUndefined()
  })

  it("shows graphql's refusal and keeps the form", async () => {
    addDevice.mockResolvedValue({ reason: 'Not authorized to add devices to this product' })
    await typeName('Kiosk 5')
    await act(async () => button('Add').click())
    expect(body()).toContain('Not authorized to add devices to this product')
    expect(nameInput().value).toBe('Kiosk 5')
  })
})
