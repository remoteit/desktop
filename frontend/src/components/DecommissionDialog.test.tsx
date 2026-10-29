import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { decommission } = vi.hoisted(() => ({ decommission: vi.fn() }))
vi.mock('../store', () => ({}))
vi.mock('react-redux', () => ({
  useDispatch: () => ({ devices: { decommission } }),
  useSelector: (select: any) => select({ ui: { destroying: false } }),
}))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) =>
        typeof a === 'string'
          ? fill(a, b)
          : fill(a.defaultValue ?? (a.count === 1 ? a.defaultValue_one : a.defaultValue_other), a),
    }),
  }
})

import { DecommissionDialog } from './DecommissionDialog'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const input = () => document.body.querySelector('input[aria-label="decommission-confirm"]') as HTMLInputElement
const confirmButton = () =>
  [...document.body.querySelectorAll('button')].find(b => b.textContent?.includes('Decommission')) as HTMLButtonElement

async function type(text: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  await act(async () => {
    setter.call(input(), text)
    input().dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function render(devices: { id: string; name: string }[], onDone = vi.fn()) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  await act(async () => root.render(<DecommissionDialog open devices={devices} onClose={vi.fn()} onDone={onDone} />))
  return root
}

beforeEach(() => {
  document.body.innerHTML = ''
  decommission.mockReset().mockResolvedValue(true)
})

describe('DecommissionDialog', () => {
  it('says what is lost and that a legacy device keeps checking in, refused quietly', async () => {
    await render([{ id: 'd1', name: 'Kitchen Pi' }])
    const text = document.body.textContent
    expect(text).toMatch(/history/)
    expect(text).toMatch(/shares/)
    expect(text).toMatch(/settings/)
    expect(text).toMatch(/keeps checking in until that software is removed, and is refused quietly/)
  })

  it('one device: confirmed only by its name typed, and the name is what is sent', async () => {
    const onDone = vi.fn()
    await render([{ id: 'd1', name: 'Kitchen Pi' }], onDone)
    expect(confirmButton().disabled).toBe(true)
    await type('Kitchen')
    expect(confirmButton().disabled).toBe(true)
    await type('Kitchen Pi')
    expect(confirmButton().disabled).toBe(false)
    await act(async () => confirmButton().click())
    expect(decommission).toHaveBeenCalledWith({ deviceIds: ['d1'], typed: 'Kitchen Pi' })
    expect(onDone).toHaveBeenCalled()
  })

  it('several: confirmed by how many typed', async () => {
    await render([
      { id: 'd1', name: 'a' },
      { id: 'd2', name: 'b' },
      { id: 'd3', name: 'c' },
    ])
    await type('a')
    expect(confirmButton().disabled).toBe(true)
    await type('3')
    expect(confirmButton().disabled).toBe(false)
    await act(async () => confirmButton().click())
    expect(decommission).toHaveBeenCalledWith({ deviceIds: ['d1', 'd2', 'd3'], typed: '3' })
  })
})
