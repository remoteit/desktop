import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'

const { create, revokeAll } = vi.hoisted(() => ({ create: vi.fn(), revokeAll: vi.fn() }))
vi.mock('../services/deviceIdentity', () => ({
  graphQLCreateDeviceJoinKey: create,
  graphQLRevokeDeviceJoinKeys: revokeAll,
}))
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

import { IssueDeviceJoinKeyDialog } from './IssueDeviceJoinKeyDialog'
import { lightColors } from '../styling'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})

const SECRET = 'r3dk_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA.c2VlZC1zZWVkLXNlZWQ'
const device = { id: 'D1', name: 'Kiosk' }

let root: Root
let onClose: Mock<() => void>
let onChanged: Mock<() => void>
const body = () => document.body.textContent || ''
const field = (label: string) => {
  const found = [...document.body.querySelectorAll('label')].find(l => l.textContent?.startsWith(label))!
  return document.getElementById(found.htmlFor) as HTMLInputElement
}
const button = (text: string) =>
  [...document.body.querySelectorAll('button')].find(b => b.textContent?.trim() === text) as HTMLButtonElement
const blocks = () => [...document.body.querySelectorAll('[data-block]')].map(b => b.getAttribute('data-block'))

async function type(label: string, text: string) {
  const input = field(label)
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  await act(async () => {
    setter.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function render(rotate?: boolean) {
  document.body.innerHTML = ''
  onClose = vi.fn<() => void>()
  onChanged = vi.fn<() => void>()
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <ThemeProvider theme={theme}>
        <IssueDeviceJoinKeyDialog device={device} rotate={rotate} onChanged={onChanged} onClose={onClose} />
      </ThemeProvider>
    )
  )
}

beforeEach(() => {
  create.mockReset()
  revokeAll.mockReset().mockResolvedValue(undefined)
})

afterEach(() => act(() => root.unmount()))

describe('IssueDeviceJoinKeyDialog', () => {
  it('asks for a name and a future expiry before asking graphql', async () => {
    await render()
    await act(async () => button('Issue').click())
    expect(body()).toContain('A name is required')
    await type('Name', 'USB stick')
    await type('Expires', '2001-01-01T10:00')
    await act(async () => button('Issue').click())
    expect(body()).toContain('A time in the future')
    expect(create).not.toHaveBeenCalled()
  })

  it('shows the key once, with the line that installs it; only Done closes it', async () => {
    create.mockResolvedValue({ key: SECRET })
    await render()
    await type('Name', ' USB stick ')
    await act(async () => button('Issue').click())
    expect(create).toHaveBeenCalledWith('D1', 'USB stick', undefined)
    expect(onChanged).toHaveBeenCalledTimes(1)
    expect(blocks()).toEqual([SECRET, `REMOTEIT_JOIN_KEY=${SECRET}`])
    expect(body()).toContain('Copy or download this key now')
    expect(body()).toContain('It will not be shown again')
    expect(body()).toContain('REMOTEIT_JOIN_KEY_FILE')

    const clicked: HTMLAnchorElement[] = []
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this)
    })
    await act(async () => button('Download').click())
    click.mockRestore()
    expect(clicked[0].getAttribute('download')).toBe('remoteit-device-join-key-usb-stick.txt')
    expect(decodeURIComponent(clicked[0].href.split(',')[1])).toBe(SECRET + '\n')

    // A click outside does not throw the key away.
    const backdrop = document.body.querySelector('.MuiBackdrop-root') as HTMLElement
    await act(async () => backdrop.click())
    expect(onClose).not.toHaveBeenCalled()
    await act(async () => button('Done').click())
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("an expiry goes as an instant; graphql's refusal is shown and the form kept", async () => {
    create.mockResolvedValue({ reason: 'Two keys are in force: revoke one first' })
    await render()
    await type('Name', 'Third')
    await type('Expires', '2099-01-01T10:00')
    await act(async () => button('Issue').click())
    expect(create.mock.calls[0][2]).toBe(new Date('2099-01-01T10:00').toISOString())
    expect(body()).toContain('Two keys are in force: revoke one first')
    expect(field('Name').value).toBe('Third')
    expect(onChanged).not.toHaveBeenCalled()
  })

  it('rotating revokes every key first, then issues the new one', async () => {
    create.mockResolvedValue({ key: SECRET })
    await render(true)
    expect(body()).toContain('Every key of Kiosk is revoked, and a new one issued and shown once.')
    await type('Name', 'After the copy')
    await act(async () => button('Revoke All and Issue').click())
    expect(revokeAll).toHaveBeenCalledWith('D1')
    expect(revokeAll.mock.invocationCallOrder[0]).toBeLessThan(create.mock.invocationCallOrder[0])
    expect(body()).toContain('Every earlier key of Kiosk is revoked. Install this key')
    expect(blocks()[0]).toBe(SECRET)
  })

  it('a rotation whose new key is refused says none is in force, and tries the key alone again', async () => {
    create.mockResolvedValueOnce({ reason: 'Rate limited' }).mockResolvedValueOnce({ key: SECRET })
    await render(true)
    await type('Name', 'After the copy')
    await act(async () => button('Revoke All and Issue').click())
    expect(body()).toContain('Every earlier key is revoked: the device cannot come back until a new key is issued.')
    expect(body()).toContain('Rate limited')
    expect(onChanged).toHaveBeenCalledTimes(1)
    await act(async () => button('Issue').click())
    expect(revokeAll).toHaveBeenCalledTimes(1)
    expect(blocks()[0]).toBe(SECRET)
  })

  it('a rotation whose revocation is refused changes nothing', async () => {
    revokeAll.mockResolvedValue('Not authorized to manage this device')
    await render(true)
    await type('Name', 'After the copy')
    await act(async () => button('Revoke All and Issue').click())
    expect(body()).toContain('Not authorized to manage this device')
    expect(create).not.toHaveBeenCalled()
    expect(onChanged).not.toHaveBeenCalled()
  })
})
