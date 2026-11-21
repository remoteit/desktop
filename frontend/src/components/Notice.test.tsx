import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('../buttons/IconButton', () => ({ IconButton: () => null }))

import { Notice } from './Notice'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const PALETTE = { calm: '#0096e7', warning: '#ed9912', error: '#d6290a', success: '#75bd00' }
const SEVERITIES = {
  info: PALETTE.calm,
  warning: PALETTE.warning,
  error: PALETTE.error,
  success: PALETTE.success,
} as const

const channels = (css: string) => (css.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
const hex = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const luminance = (rgb: number[]) => {
  const [r, g, b] = rgb.map(v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const wash = (h: string) => hex(h).map(c => 255 - 0.1 * (255 - c))

describe('Notice', () => {
  let root: Root
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })
  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  const textColor = (mode: 'light' | 'dark', severity: keyof typeof SEVERITIES) => {
    const theme = createTheme({
      palette: {
        mode,
        calm: { main: PALETTE.calm },
        warning: { main: PALETTE.warning },
        error: { main: PALETTE.error },
        success: { main: PALETTE.success },
        alwaysWhite: { main: '#fff' },
      } as any,
    })
    act(() =>
      root.render(
        <ThemeProvider theme={theme}>
          <Notice severity={severity}>A paragraph people have to read.</Notice>
        </ThemeProvider>
      )
    )
    const paper = container.querySelector('.MuiPaper-root') as HTMLElement
    return channels(getComputedStyle(paper).color)
  }

  it.each(Object.keys(SEVERITIES) as (keyof typeof SEVERITIES)[])(
    'light: %s text keeps its hue, darkened to at least 4.5:1 on its own wash',
    severity => {
      const raw = SEVERITIES[severity]
      const text = textColor('light', severity)
      expect(contrast(text, wash(raw))).toBeGreaterThanOrEqual(4.5)
      hex(raw).forEach((c, i) => expect(Math.abs(text[i] - c * 0.6)).toBeLessThanOrEqual(1))
    }
  )

  it('dark: the text is the severity colour itself', () => {
    expect(textColor('dark', 'warning')).toEqual(hex(PALETTE.warning))
  })
})
