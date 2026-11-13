import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { rotateCode, revokeCode } = vi.hoisted(() => ({ rotateCode: vi.fn(), revokeCode: vi.fn() }))

vi.mock('../services/browser', () => ({ default: {}, getLocalStorage: vi.fn(), setLocalStorage: vi.fn() }))
vi.mock('./Icon', () => ({ Icon: () => null }))

import { dispatch } from '../store'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { jssTheme } from '../styling/theme'
import { ProductRegistrationCodes } from './ProductRegistrationCodes'
import { IDeviceProduct } from '../models/products'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

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
    Object.assign(dispatch.products, { rotateCode, revokeCode })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() =>
      root.render(
        <ThemeProvider theme={theme}>
          <ProductRegistrationCodes product={product} />
        </ThemeProvider>
      )
    )
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  const button = (label: string, inDialog = false) =>
    [...document.body.querySelectorAll(inDialog ? '[role=dialog] button' : 'button')].find(
      b => b.textContent?.trim() === label
    ) as HTMLButtonElement

  it('lists the current and previous codes in use, shortened, and the revoked ones under a collapsed history', () => {
    const text = container.textContent || ''
    expect(text).toContain('aaaaaaaa…0003Current')
    expect(text).toContain('bbbbbbbb…0002Previous')
    expect(text).toContain('Still registers devices')
    expect(text).toContain('Revoked codes (1)')
    expect(container.querySelector('.MuiAccordion-root')?.classList.contains('Mui-expanded')).toBe(false)
    expect(button('Revoke')).toBeDefined()
  })

  it('replaces the code after a confirm, keeping the old one unless asked to stop it now', async () => {
    act(() => button('Replace Code').click())
    expect(document.body.textContent).toContain('The current code aaaaaaaa…0003 keeps registering devices')
    expect(document.body.textContent).toContain('The older code bbbbbbbb…0002 will be revoked')
    expect(rotateCode).not.toHaveBeenCalled()

    const stopNow = [...document.body.querySelectorAll('.MuiListItemButton-root')].find(item =>
      item.textContent?.includes('Stop aaaaaaaa…0003 now too')
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

    act(() => button('Replace Code').click())
    act(() => stopNow().click())
    act(() => button('Cancel').click())

    act(() => button('Replace Code').click())
    await act(async () => button('Replace Code', true).click())

    expect(rotateCode).toHaveBeenCalledWith({ productId: 'P1', revokePrevious: false })
  })
})
