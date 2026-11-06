import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { getRestoreCommand, ui } = vi.hoisted(() => ({
  getRestoreCommand: vi.fn(),
  ui: { showRestoreModal: true },
}))
vi.mock('../store', () => ({}))
vi.mock('react-redux', () => ({
  useSelector: (select: any) => select({ ui }),
  useDispatch: () => ({ devices: { getRestoreCommand }, ui: { set: vi.fn() } }),
}))
vi.mock('./CopyRegistrationCode', () => ({
  CopyRegistrationCode: ({ value, code }: any) => <div data-value={value} data-code={code} />,
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, a: any) => (typeof a === 'string' ? a : a.defaultValue) }),
}))

import { RestoreModal } from './RestoreModal'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
const shown = () => document.body.querySelector('[data-code]')?.getAttribute('data-code')
const device = (id: string, fields = {}) => ({ id, name: 'Pi', ...fields } as unknown as IDevice)

async function render(target: IDevice) {
  await act(async () => root.render(<RestoreModal device={target} />))
}

beforeEach(() => {
  document.body.innerHTML = ''
  ui.showRestoreModal = true
  getRestoreCommand
    .mockReset()
    .mockImplementation(async (id: string) => ({ restoreCode: `CODE-${id}`, restoreCommand: `cmd CODE-${id}` }))
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => act(() => root.unmount()))

// Each request for a Control Link device's restore code mints a new one and cancels the one before.
describe('RestoreModal', () => {
  it('reads one code for an opening, however often the device updates while it is open', async () => {
    await render(device('d1'))
    await render(device('d1', { state: 'inactive' }))
    await render(device('d1', { state: 'active' }))
    expect(getRestoreCommand).toHaveBeenCalledTimes(1)
    expect(shown()).toBe('CODE-d1')
  })

  it('reads a fresh code for each opening', async () => {
    await render(device('d1'))
    ui.showRestoreModal = false
    await render(device('d1'))
    ui.showRestoreModal = true
    await render(device('d1'))
    expect(getRestoreCommand).toHaveBeenCalledTimes(2)
  })

  it('drops an answer for a device it no longer shows', async () => {
    let answerFirst: (value: unknown) => void = () => {}
    getRestoreCommand.mockReturnValueOnce(new Promise(resolve => (answerFirst = resolve)))
    await render(device('d1'))
    await render(device('d2'))
    await act(async () => answerFirst({ restoreCode: 'CODE-d1', restoreCommand: 'cmd CODE-d1' }))
    expect(shown()).toBe('CODE-d2')
  })
})
