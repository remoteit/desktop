import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { read, name } = vi.hoisted(() => ({ read: vi.fn(), name: vi.fn() }))
vi.mock('../services/graphQLDeviceSsh', async importOriginal => ({
  ...(await importOriginal<typeof import('../services/graphQLDeviceSsh')>()),
  graphQLDeviceSsh: read,
  graphQLSetDeviceSshAccount: name,
  graphQLGrantDeviceSsh: vi.fn(),
  graphQLRevokeDeviceSsh: vi.fn(),
}))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({
  graphQLBasicRequest: vi.fn(),
  graphQLGetErrors: vi.fn(),
  graphQLRequestWithReason: vi.fn(),
  refusalOf: vi.fn(),
}))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ icon, title, onClick, disabled }: any) => (
    <button data-icon={icon} title={title} disabled={disabled} onClick={onClick} />
  ),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { DeviceSshAccess } from './DeviceSshAccess'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const BOB = { id: 'B', email: 'bob@example.com' }
const grants = (account: string, existing = false) => ({
  fallback: false,
  grants: [{ login: '', account, existing, admin: false, user: BOB }],
})

async function render() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () => createRoot(container).render(<DeviceSshAccess deviceId="D" />))
  return container
}

const click = async (el: Element | null) => act(async () => (el as HTMLElement).click())

// React tracks an input's value itself: set it through the prototype's setter, then say so.
async function type(input: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

const button = (container: Element, text: string) =>
  [...container.querySelectorAll('button')].find(b => b.textContent === text) as HTMLButtonElement

beforeEach(() => {
  document.body.innerHTML = ''
  read.mockReset().mockResolvedValue(grants('r3s-bob'))
  name.mockReset().mockResolvedValue({ account: 'r3s-robert' })
})

describe("DeviceSshAccess: naming a person's own account", () => {
  it('renames by a handle, saying it ends what the account runs', async () => {
    const container = await render()
    await click(container.querySelector('[data-icon="pen"]'))
    expect(container.textContent).toContain('Renaming r3s-bob ends what it runs now')
    const input = [...container.querySelectorAll('input')].find(i => i.type !== 'checkbox')!
    await type(input, 'Robert')
    await click(button(container, 'Save'))
    expect(name).toHaveBeenCalledWith('D', 'B', 'robert', false)
    expect(read).toHaveBeenCalledTimes(2) // read again
  })

  it('names an account already on the device: warns that remote.it does not manage it, and more for root', async () => {
    const container = await render()
    await click(container.querySelector('[data-icon="pen"]'))
    await click(container.querySelector('input[type="checkbox"]'))
    expect(container.textContent).toContain('remote.it will not lock this account')
    const input = [...container.querySelectorAll('input')].find(i => i.type !== 'checkbox')!
    await type(input, 'root')
    expect(container.textContent).toContain("This is the machine's administrator")
    await type(input, 'r3s-carol')
    expect(button(container, 'Save').disabled).toBe(true) // one of remote.it's: never
    await type(input, 'jsmith')
    await click(button(container, 'Save'))
    expect(name).toHaveBeenCalledWith('D', 'B', 'jsmith', true)
  })

  it("shows graphql's reason a name cannot be had", async () => {
    name.mockResolvedValue({ reason: 'Invalid Arguments: handle: r3s-evan is taken on the device' })
    const container = await render()
    await click(container.querySelector('[data-icon="pen"]'))
    const input = [...container.querySelectorAll('input')].find(i => i.type !== 'checkbox')!
    await type(input, 'evan')
    await click(button(container, 'Save'))
    expect(container.textContent).toContain('r3s-evan is taken on the device')
  })

  it('shows an account already on the device as such', async () => {
    read.mockResolvedValue(grants('jsmith', true))
    const container = await render()
    expect(container.textContent).toContain('as jsmith, an account already on the device')
  })
})
