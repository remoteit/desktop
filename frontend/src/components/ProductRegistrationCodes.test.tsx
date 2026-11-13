import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn(), setLocalStorage: vi.fn() }))
vi.mock('./Icon', () => ({ Icon: () => null }))

import { dispatch } from '../store'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { jssTheme } from '../styling/theme'
import { ProductRegistrationCodes, ProductRevokedCodes } from './ProductRegistrationCodes'
import { IDeviceProduct } from '../models/products'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const rotateCode = vi.fn()
const revokeCode = vi.fn()

const theme = createTheme(jssTheme(false))
const at = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

const product = {
  id: 'P1',
  registrationCodes: [
    { code: 'aaaaaaaa-0000-4000-8000-000000000003', created: at(1), revoked: null },
    { code: 'bbbbbbbb-0000-4000-8000-000000000002', created: at(5), revoked: null },
    { code: 'cccccccc-0000-4000-8000-000000000001', created: at(30), revoked: at(10) },
  ],
} as unknown as IDeviceProduct

describe('ProductRegistrationCodes', () => {
  let root: Root
  let container: HTMLDivElement

  beforeEach(() => {
    rotateCode.mockReset().mockResolvedValue(true)
    revokeCode.mockReset().mockResolvedValue(true)
    vi.spyOn(dispatch.products, 'rotateCode').mockImplementation(rotateCode)
    vi.spyOn(dispatch.products, 'revokeCode').mockImplementation(revokeCode)
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    render(product)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  const render = (shown: IDeviceProduct) =>
    act(() =>
      root.render(
        <ThemeProvider theme={theme}>
          <ProductRegistrationCodes product={shown} />
          <ProductRevokedCodes product={shown} />
        </ThemeProvider>
      )
    )

  const button = (label: string, inDialog = false) =>
    [...document.body.querySelectorAll(inDialog ? '[role=dialog] button' : 'button')].find(
      b => b.textContent?.trim() === label
    ) as HTMLButtonElement

  it('lists the current and previous codes in use in full, and the revoked ones under a collapsed history', () => {
    const text = container.textContent || ''
    expect(text).toContain('Currentaaaaaaaa-0000-4000-8000-000000000003')
    expect(text).toContain('Previousbbbbbbbb-0000-4000-8000-000000000002')
    expect(text).toContain('Still registers devices')
    expect(text).toContain('Revoked codes (1)')
    expect(container.querySelector('.MuiAccordion-root')?.classList.contains('Mui-expanded')).toBe(false)
    expect(button('Revoke')).toBeDefined()
    expect(button('Replace')).toBeDefined()
  })

  it('replaces the code after a confirm, keeping the old one unless asked to stop it now', async () => {
    act(() => button('Replace').click())
    expect(document.body.textContent).toContain(
      'The current code aaaaaaaa-0000-4000-8000-000000000003 keeps registering devices'
    )
    expect(document.body.textContent).toContain('The older code bbbbbbbb-0000-4000-8000-000000000002 will be revoked')
    expect(rotateCode).not.toHaveBeenCalled()

    const stopNow = [...document.body.querySelectorAll('.MuiListItemButton-root')].find(item =>
      item.textContent?.includes('Stop aaaaaaaa-0000-4000-8000-000000000003 now too')
    ) as HTMLElement
    act(() => stopNow.click())
    await act(async () => button('Replace and Revoke').click())

    expect(rotateCode).toHaveBeenCalledWith({ productId: 'P1', revokePrevious: true })
  })

  it('starts each confirm unchecked, so a box ticked and then cancelled does not revoke on the next replace', async () => {
    const stopNow = () =>
      [...document.body.querySelectorAll('.MuiListItemButton-root')].find(item =>
        item.textContent?.includes('now too')
      ) as HTMLElement

    act(() => button('Replace').click())
    act(() => stopNow().click())
    act(() => button('Cancel').click())

    act(() => button('Replace').click())
    await act(async () => button('Replace Code', true).click())

    expect(rotateCode).toHaveBeenCalledWith({ productId: 'P1', revokePrevious: false })
  })

  it('replaces once when the confirm is clicked twice before the first replace returns', () => {
    rotateCode.mockReturnValue(new Promise(() => {}))
    act(() => button('Replace').click())
    const confirm = button('Replace Code', true)
    act(() => confirm.click())
    act(() => confirm.click())

    expect(rotateCode).toHaveBeenCalledTimes(1)
  })

  it('names every older code a replace revokes, and warns that the first revocation ends service ID registration', () => {
    render({
      id: 'P2',
      registrationCodes: [
        { code: 'aaaaaaaa-0000-4000-8000-000000000003', created: at(1), revoked: null },
        { code: 'bbbbbbbb-0000-4000-8000-000000000002', created: at(5), revoked: null },
        { code: 'dddddddd-0000-4000-8000-000000000004', created: at(9), revoked: null },
      ],
    } as unknown as IDeviceProduct)
    act(() => button('Replace').click())

    expect(document.body.textContent).toContain(
      'The older codes bbbbbbbb-0000-4000-8000-000000000002, dddddddd-0000-4000-8000-000000000004 will be revoked'
    )
    expect(document.body.textContent).toContain('also stops devices registering with a service ID')
  })
})
