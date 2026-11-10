import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { served } = vi.hoisted(() => ({ served: { current: { addDuplicateDevice: true, joinKeys: true } as any } }))
vi.mock('../hooks/useDeviceIdentity', () => ({ useDeviceIdentity: () => served.current }))
vi.mock('../hooks/useDeviceDisable', () => ({ disabledWhen: (date?: Date) => date && 'Nov 9, 10:00' }))
// The dialogs are their own tests': here, which one opens, for what, and the hand-off to rotation.
vi.mock('./AddDuplicateDeviceDialog', () => ({
  AddDuplicateDeviceDialog: ({ device, target, rotate, onRotate, onClose }: any) => (
    <div data-add-duplicate={`${device.id}:${target}:${rotate}`}>
      <button onClick={onRotate}>Rotate keys</button>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))
vi.mock('./IssueDeviceJoinKeyDialog', () => ({
  IssueDeviceJoinKeyDialog: ({ device, rotate }: any) => <div data-issue={`${device.id}:${!!rotate}`} />,
}))
vi.mock('./Notice', () => ({
  Notice: ({ children, button }: any) => (
    <div data-notice>
      {children}
      {button}
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

import { DuplicateKeyNotice } from './DuplicateKeyNotice'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const flagged = (over: Partial<IDevice> = {}) =>
  ({
    id: 'X1',
    name: 'Kiosk',
    permissions: ['VIEW', 'MANAGE'],
    duplicate: { kind: 'device-join-key', since: new Date('2026-11-09T10:00:00Z'), address: '203.0.113.7' },
    ...over,
  } as IDevice)

let root: Root
let container: HTMLDivElement
const text = () => container.textContent || ''
const button = (label: string) =>
  [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === label) as HTMLButtonElement
const buttons = () => [...container.querySelectorAll('button')].map(b => b.textContent)

async function render(device = flagged()) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<DuplicateKeyNotice device={device} />))
}

beforeEach(() => {
  document.body.innerHTML = ''
  served.current = { addDuplicateDevice: true, joinKeys: true }
})

afterEach(() => act(() => root.unmount()))

describe('DuplicateKeyNotice', () => {
  it('a device join key on another machine: when, from where, and the three choices', async () => {
    await render()
    expect(text()).toContain('The device join key of Kiosk is in use on another machine')
    expect(text()).toContain('Seen Nov 9, 10:00 from 203.0.113.7.')
    expect(text()).toContain('Whichever machine is online first is Kiosk')
    expect(buttons()).toEqual(['Keep the copy as a new device', 'Make the copy the original', 'Neither: rotate keys'])
  })

  it('keeping the copy or making it the original makes a new device for that machine, offering rotation after', async () => {
    await render()
    await act(async () => button('Keep the copy as a new device').click())
    expect(container.querySelector('[data-add-duplicate]')!.getAttribute('data-add-duplicate')).toBe('X1:copy:true')
    await act(async () => button('Close').click())
    expect(container.querySelector('[data-add-duplicate]')).toBeNull()

    await act(async () => button('Make the copy the original').click())
    expect(container.querySelector('[data-add-duplicate]')!.getAttribute('data-add-duplicate')).toBe('X1:original:true')
    await act(async () => button('Rotate keys').click())
    expect(container.querySelector('[data-add-duplicate]')).toBeNull()
    expect(container.querySelector('[data-issue]')!.getAttribute('data-issue')).toBe('X1:true')
  })

  it('neither: rotates the keys', async () => {
    await render()
    await act(async () => button('Neither: rotate keys').click())
    expect(container.querySelector('[data-issue]')!.getAttribute('data-issue')).toBe('X1:true')
  })

  it('offers only what the API serves, to whoever manages the device', async () => {
    served.current = { addDuplicateDevice: false, joinKeys: true }
    await render()
    expect(buttons()).toEqual(['Neither: rotate keys'])
    served.current = { addDuplicateDevice: true, joinKeys: true }
    await render(flagged({ permissions: ['VIEW'] }))
    expect(buttons()).toEqual([])
    expect(text()).toContain('is in use on another machine')
  })

  it('a daemon that cannot take an identity of its own: refused, with nothing to choose until it is updated', async () => {
    await render(flagged({ duplicate: { kind: 'key', address: '198.51.100.4' } }))
    expect(text()).toContain('Another machine signed in as Kiosk while it was online')
    expect(text()).toContain('From 198.51.100.4.')
    expect(text()).toContain('Update the daemon on that machine')
    expect(buttons()).toEqual([])
  })

  it('nothing for a device not flagged', async () => {
    await render(flagged({ duplicate: undefined }))
    expect(text()).toBe('')
  })
})
