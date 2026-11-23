import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, afterEach } from 'vitest'

const loading = vi.hoisted(() => {
  const names: { [type: number]: string } = {}
  let resolve = () => {}
  const ready = new Promise<void>(done => (resolve = done))
  return { names, ready, finish: () => resolve() }
})
vi.mock('../platforms', () => ({
  platforms: {
    ready: loading.ready,
    name: (type: number) => loading.names[type] ?? '',
    get allTypes() {
      return { ...loading.names }
    },
  },
}))
vi.mock('../store', () => ({}))
vi.mock('react-redux', () => ({
  useDispatch: () => ({ applicationTypes: { fetchAll: vi.fn() } }),
  useSelector: (select: any) => select({ applicationTypes: { all: [] } }),
}))
vi.mock('../hooks/useGateways', () => ({ useGateways: () => [] }))
vi.mock('./TargetPlatform', () => ({ TargetPlatform: () => <span /> }))
vi.mock('./Icon', () => ({ Icon: () => <span /> }))
vi.mock('./Notice', () => ({ Notice: ({ children }: any) => <div>{children}</div> }))
vi.mock('./Gutters', () => ({ Gutters: ({ children }: any) => <div>{children}</div> }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) => (typeof a === 'string' ? fill(a, b) : fill(a.defaultValue, a)),
    }),
  }
})

import { VirtualDeviceForm } from './VirtualDeviceForm'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | undefined
let container: HTMLElement
afterEach(() => {
  if (!root) return
  act(() => root!.unmount())
  container.remove()
  root = undefined
})

describe('the platform choices', () => {
  it('are named once the platform names load, not left blank from the first render', async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => root!.render(<VirtualDeviceForm prefill={{}} onDone={vi.fn()} onCancel={vi.fn()} />))
    const labels = () => [...container.querySelectorAll('.MuiChip-label')].map(chip => chip.textContent)
    expect(labels()).not.toContain('Printer')

    Object.assign(loading.names, { 1284: 'Printer', 1282: 'PLC', 1283: 'IP Camera' })
    await act(async () => {
      loading.finish()
      await loading.ready
    })

    expect(labels()).toEqual(expect.arrayContaining(['Printer', 'PLC', 'IP Camera', 'Other']))
  })
})
