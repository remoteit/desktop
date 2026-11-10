import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { served, fetchDevices, dialog } = vi.hoisted(() => ({
  served: { current: undefined as any },
  fetchDevices: vi.fn(),
  dialog: { props: undefined as any },
}))
vi.mock('react-redux', () => ({
  useSelector: (select: any) => select({ ui: { selected: ['D1', 'D2'] } }),
  useDispatch: () => ({ devices: { fetchDevices }, ui: { set: vi.fn() } }),
  shallowEqual: () => true,
}))
vi.mock('../selectors/devices', () => ({ selectDevice: () => undefined }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => 'A1' }))
vi.mock('../hooks/useDeviceDisable', () => ({ useDeviceDisable: () => true }))
vi.mock('../hooks/useProductPolicy', () => ({ useProductPolicyServed: () => served.current }))
vi.mock('./DisableDevice', () => ({ DisableConfirm: () => null }))
vi.mock('./Confirm', () => ({ Confirm: () => null }))
vi.mock('./Notice', () => ({ Notice: () => null }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('../buttons/IconButton', () => ({
  IconButton: ({ onClick }: any) => <button data-more onClick={onClick} />,
}))
vi.mock('./ProductMoveDialog', () => ({
  ProductMoveDialog: (props: any) => {
    dialog.props = props
    return props.open ? <div data-move-dialog /> : null
  },
}))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) =>
        typeof a === 'string' ? fill(a, b) : fill(a.count === 1 ? a.defaultValue_one : a.defaultValue_other, a),
    }),
  }
})

import { DevicesActionMenu } from './DevicesActionMenu'
import { lightColors } from '../styling'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})

let root: Root
async function render() {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <DevicesActionMenu />
        </MemoryRouter>
      </ThemeProvider>
    )
  )
  await act(async () => (document.body.querySelector('[data-more]') as HTMLElement).click())
}
const moveItem = () => document.body.querySelector('[data-move-product]') as HTMLElement | null

beforeEach(() => {
  served.current = { bulk: true }
  fetchDevices.mockReset()
  dialog.props = undefined
})
afterEach(() => act(() => root.unmount()))

describe('the selected devices moved to a product', () => {
  it('offered where the API has it: the selection previewed and moved, then read again', async () => {
    await render()
    expect(moveItem()?.textContent).toBe('Move to Product')
    await act(async () => moveItem()!.click())
    expect(document.body.querySelector('[data-move-dialog]')).not.toBeNull()
    expect(dialog.props).toMatchObject({ accountId: 'A1', deviceIds: ['D1', 'D2'] })
    await act(async () => dialog.props.onDone())
    expect(fetchDevices).toHaveBeenCalledWith({ ids: ['D1', 'D2'] })
  })

  it('not offered where the API has no bulk move', async () => {
    served.current = { bulk: false }
    await render()
    expect(moveItem()).toBeNull()
  })
})
