import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { products, permissions } = vi.hoisted(() => ({
  products: {
    revokeJoinKey: vi.fn(),
    createJoinKey: vi.fn(),
    createOneTimeCode: vi.fn(),
    revokeCode: vi.fn(),
    rotateCode: vi.fn(),
  },
  permissions: { current: ['ADMIN'] as string[] },
}))
vi.mock('../store', () => ({ dispatch: { products } }))
vi.mock('react-redux', () => ({
  useSelector: (select: any) => select({ ui: { autoCopy: false } }),
  useDispatch: () => ({ ui: { set: vi.fn() } }),
}))
vi.mock('../selectors/organizations', () => ({ selectPermissions: () => permissions.current }))
vi.mock('../platforms', () => ({
  platforms: {
    codeCommand: (type: number, code: string) =>
      type === 1219 ? `docker run -e R3_REGISTRATION_CODE="${code}"` : undefined,
  },
}))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('../buttons/CopyIconButton', () => ({
  CopyIconButton: ({ value, title }: any) => <button data-copy={value}>{title}</button>,
}))
vi.mock('./CopyCodeBlock', () => ({
  CopyCodeBlock: ({ value, code, label }: any) => (
    <div data-block={value} data-code={code}>
      {label}
    </div>
  ),
}))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) => (typeof a === 'string' ? fill(a, b) : fill(a.defaultValue, a)),
    }),
  }
})

import { ProductJoinKeys } from './ProductJoinKeys'
import { ProductOneTimeCodes } from './ProductOneTimeCodes'
import { ProductRegistrationCodes } from './ProductRegistrationCodes'
import { IDeviceProduct, IDeviceProductJoinKey } from '../models/products'
import { lightColors } from '../styling'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})

const HOUR = 3600_000
const at = (offset: number) => new Date(Date.now() + offset).toISOString()

const key = (fields: Partial<IDeviceProductJoinKey>): IDeviceProductJoinKey => ({
  id: 'K1',
  name: 'Fleet',
  creator: { id: 'u1', email: 'ops@example.com' },
  created: at(-40 * 24 * HOUR),
  joins: 0,
  joinRate: 10,
  inForce: true,
  unused: false,
  ...fields,
})

const product = (fields: Partial<IDeviceProduct>): IDeviceProduct => ({
  id: 'p1',
  name: 'Pump',
  platform: { id: 769, name: 'Linux' },
  status: 'NEW',
  created: at(-50 * 24 * HOUR),
  updated: at(-50 * 24 * HOUR),
  services: [],
  registrationCodes: [],
  oneTimeCodes: [],
  joinKeys: [],
  ...fields,
})

let root: Root
const body = () => document.body.textContent || ''
const button = (label: string) =>
  [...document.body.querySelectorAll('button')].find(
    b => b.getAttribute('aria-label') === label || b.textContent?.trim() === label
  ) as HTMLButtonElement | undefined

async function render(node: React.ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<ThemeProvider theme={theme}>{node}</ThemeProvider>))
}

beforeEach(() => {
  document.body.innerHTML = ''
  permissions.current = ['ADMIN']
  Object.values(products).forEach(fn => fn.mockReset().mockResolvedValue(true))
})

afterEach(() => act(() => root.unmount()))

describe('ProductJoinKeys', () => {
  it('lists each key with its creator, last use, joins and expiry, and says where a key goes', async () => {
    await render(
      <ProductJoinKeys
        product={product({
          joinKeys: [
            key({ id: 'K1', name: 'Line 2', joins: 3, maxJoins: 100, expires: at(24 * HOUR), lastUsed: at(-HOUR) }),
            key({ id: 'K2', name: 'CI', joins: 7 }),
          ],
        })}
      />
    )
    expect(body()).toContain('REMOTEIT_JOIN_KEY')
    expect(body()).toContain('REMOTEIT_JOIN_KEY_FILE')
    expect(body()).toContain('Line 2')
    expect(body()).toContain('by ops@example.com')
    expect(body()).toContain('Last used')
    expect(body()).toContain('Devices joined: 3 of 100')
    expect(body()).toContain('Expires')
    expect(body()).toContain('Devices joined: 7')
    expect(body()).toContain('Never used')
    expect(body()).toContain('No expiry')
  })

  it('flags a key unused for 30 days, with its suggestion', async () => {
    const suggestion = 'No device has joined with it for 30 days: revoke it if nothing uses it any more'
    await render(<ProductJoinKeys product={product({ joinKeys: [key({ unused: true, suggestion })] })} />)
    expect(body()).toContain('Unused')
    expect(body()).toContain(suggestion)
  })

  it('offers Revoke for a key in force only, behind a confirmation', async () => {
    await render(
      <ProductJoinKeys
        product={product({
          joinKeys: [
            key({ id: 'K1', name: 'Live' }),
            key({ id: 'K2', name: 'Gone', inForce: false, revoked: at(-HOUR) }),
            key({ id: 'K3', name: 'Old', inForce: false, expires: at(-HOUR) }),
            key({ id: 'K4', name: 'Full', inForce: false, joins: 5, maxJoins: 5 }),
          ],
        })}
      />
    )
    expect([...document.body.querySelectorAll('button[aria-label="Revoke Key"]')]).toHaveLength(1)
    expect(body()).toContain('Revoked')
    expect(body()).toContain('Expired')
    expect(body()).toContain('All joins used')

    await act(async () => button('Revoke Key')!.click())
    expect(products.revokeJoinKey).not.toHaveBeenCalled()
    expect(body()).toContain('Revoke join key "Live"?')
    const confirm = [...document.body.querySelectorAll('[role="dialog"] button')].find(b =>
      b.textContent?.includes('Revoke Key')
    ) as HTMLButtonElement
    await act(async () => confirm.click())
    expect(products.revokeJoinKey).toHaveBeenCalledWith({ productId: 'p1', id: 'K1' })
  })

  it('creates nothing without admin permission', async () => {
    permissions.current = ['VIEW']
    await render(<ProductJoinKeys product={product({ joinKeys: [key({})] })} />)
    expect(button('Create Join Key')!.disabled).toBe(true)
    expect(button('Revoke Key')!.disabled).toBe(true)
  })

  it('a product outside the store — remote.it’s proxy product —: managed as it is told, revoked by its own change', async () => {
    permissions.current = ['VIEW']
    const onRevoke = vi.fn(async () => undefined)
    await render(
      <ProductJoinKeys
        product={{ id: 'PP', name: 'remote.it proxies', joinKeys: [key({})] }}
        manage
        onRevoke={onRevoke}
      />
    )
    expect(button('Create Join Key')!.disabled).toBe(false)
    await act(async () => button('Revoke Key')!.click())
    const confirm = [...document.body.querySelectorAll('[role="dialog"] button')].find(b =>
      b.textContent?.includes('Revoke Key')
    ) as HTMLButtonElement
    await act(async () => confirm.click())
    expect(onRevoke).toHaveBeenCalledWith('K1')
    expect(products.revokeJoinKey).not.toHaveBeenCalled()
  })

  it('says when there are no keys yet', async () => {
    await render(<ProductJoinKeys product={product({})} />)
    expect(body()).toContain('No join keys yet.')
  })
})

describe('ProductOneTimeCodes', () => {
  it('mints a code on "Add One Device" and shows it with its expiry', async () => {
    products.createOneTimeCode.mockResolvedValue({ code: 'OTC-NEW', created: at(0), expires: at(24 * HOUR), used: 0 })
    await render(<ProductOneTimeCodes product={product({})} />)
    await act(async () => button('Add One Device')!.click())
    expect(products.createOneTimeCode).toHaveBeenCalledWith('p1')
    const block = document.body.querySelector('[data-block]')!
    // No template for the product's platform: the code alone, and where it goes.
    expect(block.getAttribute('data-block')).toBe('OTC-NEW')
    expect(body()).toContain('R3_REGISTRATION_CODE')
    expect(body()).toContain('24 hours after it was made')
  })

  it("gives the install command where the product's platform has a template", async () => {
    products.createOneTimeCode.mockResolvedValue({ code: 'OTC-NEW', created: at(0), expires: at(24 * HOUR), used: 0 })
    await render(<ProductOneTimeCodes product={product({ platform: { id: 1219, name: 'Docker' } })} />)
    await act(async () => button('Add One Device')!.click())
    const block = document.body.querySelector('[data-block]')!
    expect(block.getAttribute('data-block')).toBe('docker run -e R3_REGISTRATION_CODE="OTC-NEW"')
    expect(block.getAttribute('data-code')).toBe('OTC-NEW')
    expect(body()).toContain('Run this command on the device.')
  })

  it('lists codes used, live, expired and revoked; a live one can be copied and revoked', async () => {
    await render(
      <ProductOneTimeCodes
        product={product({
          oneTimeCodes: [
            { code: 'OTC-LIVE', created: at(-HOUR), expires: at(23 * HOUR), used: 0 },
            { code: 'OTC-USED', created: at(-2 * HOUR), expires: at(22 * HOUR), used: 1, lastUsed: at(-HOUR) },
            { code: 'OTC-OLD', created: at(-30 * HOUR), expires: at(-6 * HOUR), used: 0 },
            { code: 'OTC-GONE', created: at(-3 * HOUR), expires: at(21 * HOUR), used: 0, revoked: at(-2 * HOUR) },
          ],
        })}
      />
    )
    expect(body()).toContain('Used')
    expect(body()).toContain('Expired')
    expect(body()).toContain('Revoked')
    expect([...document.body.querySelectorAll('[data-copy]')].map(b => b.getAttribute('data-copy'))).toEqual([
      'OTC-LIVE',
    ])
    expect([...document.body.querySelectorAll('button[aria-label="Revoke Code"]')]).toHaveLength(1)
    await act(async () => button('Revoke Code')!.click())
    const confirm = [...document.body.querySelectorAll('[role="dialog"] button')].find(b =>
      b.textContent?.includes('Revoke Code')
    ) as HTMLButtonElement
    await act(async () => confirm.click())
    expect(products.revokeCode).toHaveBeenCalledWith({ productId: 'p1', code: 'OTC-LIVE' })
  })
})

describe('ProductRegistrationCodes', () => {
  const codes = [{ code: 'REUSE-1', created: at(-HOUR), lastUsed: at(-HOUR) }]

  it('shows each code’s last use, or that none is recorded', async () => {
    await render(
      <ProductRegistrationCodes
        product={product({
          registrationCodes: [...codes, { code: 'REUSE-0', created: at(-2 * HOUR), revoked: at(-HOUR) }],
        })}
      />
    )
    expect(body()).toContain('Last used')
    expect(body()).toContain('No use recorded')
  })

  it('keeps the last code in force while no join key is in force', async () => {
    await render(<ProductRegistrationCodes product={product({ registrationCodes: codes })} />)
    const revoke = button('Rotate the code or create a join key first: this is the only code in force')!
    expect(revoke.disabled).toBe(true)
  })

  it('lets the last code go once a join key is in force, saying the command stops', async () => {
    await render(<ProductRegistrationCodes product={product({ registrationCodes: codes, joinKeys: [key({})] })} />)
    const revoke = button('Revoke Code')!
    expect(revoke.disabled).toBe(false)
    await act(async () => revoke.click())
    expect(body()).toContain("It is the product's last reusable code")
  })
})
