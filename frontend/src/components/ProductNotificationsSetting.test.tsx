import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { read, write } = vi.hoisted(() => ({ read: vi.fn(), write: vi.fn() }))
vi.mock('../services/productMaxDevices', () => ({ graphQLProductNotifications: read, setProductNotifications: write }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, a: any) => (typeof a === 'string' ? a : a.defaultValue) }),
}))

import { ProductNotificationsSetting } from './ProductNotificationsSetting'
import { lightColors } from '../styling'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const theme = createTheme({
  palette: Object.fromEntries(Object.entries(lightColors).map(([name, main]) => [name, { main }])) as any,
})

let root: Root
const body = () => document.body.textContent || ''
const checkbox = () => document.body.querySelector<HTMLInputElement>('input[type="checkbox"]')

async function render() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <ThemeProvider theme={theme}>
        <ProductNotificationsSetting />
      </ThemeProvider>
    )
  )
}

beforeEach(() => {
  document.body.innerHTML = ''
  read.mockReset()
  write.mockReset().mockResolvedValue(true)
})

afterEach(() => act(() => root.unmount()))

describe('ProductNotificationsSetting', () => {
  it('where the API has the switch: shown on, and switched off alone', async () => {
    read.mockResolvedValue(true)
    await render()
    expect(body()).toContain('Product limit emails')
    expect(checkbox()?.checked).toBe(true)
    await act(async () => (document.body.querySelector('.MuiListItemButton-root') as HTMLElement).click())
    expect(write).toHaveBeenCalledWith(false)
    expect(checkbox()?.checked).toBe(false)
  })

  it('where the API has none: nothing shown', async () => {
    read.mockResolvedValue(undefined)
    await render()
    expect(body()).toBe('')
  })
})
