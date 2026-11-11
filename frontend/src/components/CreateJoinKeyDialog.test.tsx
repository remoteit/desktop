import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'

const { createJoinKey } = vi.hoisted(() => ({ createJoinKey: vi.fn() }))
vi.mock('../store', () => ({ dispatch: { products: { createJoinKey } } }))
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

import { CreateJoinKeyDialog } from './CreateJoinKeyDialog'
import { IDeviceProduct } from '../models/products'
import { lightColors } from '../styling'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})

const SECRET = 'r3jk_AAAAAAAA.c2VjcmV0LXNlZWQ'
const product = { id: 'p1', name: 'Pump', services: [], status: 'NEW' } as unknown as IDeviceProduct

let root: Root
let onClose: Mock<() => void>
const body = () => document.body.textContent || ''
const field = (label: string) => {
  const found = [...document.body.querySelectorAll('label')].find(l => l.textContent?.startsWith(label))!
  return document.getElementById(found.htmlFor) as HTMLInputElement
}
const button = (text: string) =>
  [...document.body.querySelectorAll('button')].find(b => b.textContent?.trim() === text) as HTMLButtonElement

async function type(label: string, text: string) {
  const input = field(label)
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  await act(async () => {
    setter.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function submit() {
  await act(async () => button('Create').click())
}

beforeEach(async () => {
  document.body.innerHTML = ''
  createJoinKey.mockReset()
  onClose = vi.fn<() => void>()
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <ThemeProvider theme={theme}>
        <CreateJoinKeyDialog product={product} onClose={onClose} />
      </ThemeProvider>
    )
  )
})

afterEach(() => act(() => root.unmount()))

describe('CreateJoinKeyDialog', () => {
  it('asks for a name, a future expiry and whole numbers before asking graphql', async () => {
    await submit()
    expect(body()).toContain('A name is required')

    await type('Name', 'Line 2')
    await type('Expires', '2001-01-01T10:00')
    await type('Joins a minute', '0')
    await type('Maximum joins', '1.5')
    await submit()
    expect(body()).toContain('A time in the future')
    expect(body()).toContain('A whole number of 1 or more')
    expect(createJoinKey).not.toHaveBeenCalled()
  })

  it("shows graphql's refusal and keeps the form", async () => {
    createJoinKey.mockResolvedValue({ reason: 'Not authorized to change this product’s join keys' })
    await type('Name', 'Line 2')
    await submit()
    expect(body()).toContain('Not authorized to change this product’s join keys')
    expect(field('Name').value).toBe('Line 2')
  })

  it('shows the key once, with a warning, to copy or download; only Done closes it', async () => {
    createJoinKey.mockResolvedValue({ key: SECRET })
    await type('Name', ' Line 2 ')
    await type('Joins a minute', '5')
    await type('Maximum joins', '100')
    await submit()
    expect(createJoinKey).toHaveBeenCalledWith({
      productId: 'p1',
      name: 'Line 2',
      expires: undefined,
      joinRate: 5,
      maxJoins: 100,
    })
    expect(document.body.querySelector('[data-block]')!.getAttribute('data-block')).toBe(SECRET)
    expect(body()).toContain('Copy or download this key now')
    expect(body()).toContain('It will not be shown again')
    expect(body()).toContain('REMOTEIT_JOIN_KEY')

    const clicked: HTMLAnchorElement[] = []
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this)
    })
    await act(async () => button('Download').click())
    click.mockRestore()
    expect(clicked).toHaveLength(1)
    expect(clicked[0].getAttribute('download')).toBe('remoteit-join-key-line-2.txt')
    expect(decodeURIComponent(clicked[0].href.split(',')[1])).toBe(SECRET + '\n')

    // Escape does not throw the one copy away.
    await act(async () => {
      document.body
        .querySelector('[role="dialog"]')!
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(onClose).not.toHaveBeenCalled()

    await act(async () => button('Done').click())
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape while nothing has been made', async () => {
    await act(async () => {
      document.body
        .querySelector('[role="dialog"]')!
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('a product outside the store — remote.it’s proxy product — is made by its own change, and shown once the same', async () => {
    const onCreate = vi.fn(async () => ({ key: SECRET }))
    await act(async () =>
      root.render(
        <ThemeProvider theme={theme}>
          <CreateJoinKeyDialog
            product={{ id: 'PP', name: 'remote.it proxies' }}
            onCreate={onCreate}
            onClose={onClose}
          />
        </ThemeProvider>
      )
    )
    await type('Name', 'pdx1a')
    await submit()
    expect(onCreate).toHaveBeenCalledWith({
      productId: 'PP',
      name: 'pdx1a',
      expires: undefined,
      joinRate: undefined,
      maxJoins: undefined,
    })
    expect(createJoinKey).not.toHaveBeenCalled()
    expect(document.body.querySelector('[data-block]')!.getAttribute('data-block')).toBe(SECRET)
    expect(body()).toContain('It will not be shown again')
  })

  it('says how to run it in a container: the downloaded file mounted, the device kept in a volume', async () => {
    createJoinKey.mockResolvedValue({ key: SECRET })
    await type('Name', 'Line 2')
    await submit()
    const run = document.body.querySelectorAll('[data-block]')[1].getAttribute('data-block')!
    expect(run).toBe(
      [
        'docker run -d --name remoteit --restart unless-stopped --network host',
        '-v remoteit-device:/var/lib/remoteit-device',
        '-e REMOTEIT_JOIN_KEY_FILE=/run/secrets/remoteit_join_key',
        '-v "$PWD/remoteit-join-key-line-2.txt:/run/secrets/remoteit_join_key:ro"',
        'ghcr.io/remoteit/device',
      ].join(' \\\n  ')
    )
    expect(run).not.toContain(SECRET)
    expect(body()).toContain('one volume per device')
  })

  it('an ephemeral product’s container has no volume: its devices are new at every start', async () => {
    createJoinKey.mockResolvedValue({ key: SECRET })
    await act(async () =>
      root.render(
        <ThemeProvider theme={theme}>
          <CreateJoinKeyDialog product={{ ...product, lifecycle: 'ephemeral' }} onClose={onClose} />
        </ThemeProvider>
      )
    )
    await type('Name', 'Pool')
    await submit()
    const run = document.body.querySelectorAll('[data-block]')[1].getAttribute('data-block')!
    expect(run).toContain('-e R3_ALLOW_NO_VOLUME=1')
    expect(run).not.toContain('/var/lib/remoteit-device')
    expect(run).toContain('remoteit-join-key-pool.txt')
    expect(body()).toContain('new at every start, so it needs no volume')
  })

  it('sends the expiry as a time', async () => {
    createJoinKey.mockResolvedValue({ key: SECRET })
    await type('Name', 'Line 2')
    await type('Expires', '2099-06-01T10:30')
    await submit()
    expect(createJoinKey.mock.calls[0][0].expires).toBe(new Date('2099-06-01T10:30').toISOString())
  })
})
