import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const pop = vi.hoisted(() => vi.fn())

vi.mock('react-redux', () => ({
  useSelector: (select: (s: any) => any) =>
    select({
      user: { created: new Date(0) },
      ui: { guidesResetDate: 0, expireBubbles: false, poppedBubbles: [], sidebarMenu: false },
    }),
  useDispatch: () => ({ ui: { pop, popAll: vi.fn() } }),
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_: string, fallback: string) => fallback }) }))
vi.mock('./Link', () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }))

import { ThemeProvider, createTheme } from '@mui/material/styles'
import { GuideBubble } from './GuideBubble'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const theme = createTheme({ palette: { guide: { main: '#6a1b9a' }, white: { main: '#fff' } } as any })

describe('GuideBubble', () => {
  let root: Root
  let container: HTMLDivElement

  beforeEach(() => {
    vi.useFakeTimers()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    pop.mockReset()
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.useRealTimers()
  })

  it("keeps its own button presses from reaching the element it's anchored inside", () => {
    const parentClick = vi.fn()
    act(() =>
      root.render(
        <ThemeProvider theme={theme}>
          <button onClick={parentClick}>
            <GuideBubble guide="tour" added={new Date()} instructions="Meet the tour">
              <span>anchor</span>
            </GuideBubble>
          </button>
        </ThemeProvider>
      )
    )
    act(() => vi.runAllTimers())

    const ok = Array.from(document.querySelectorAll('button')).find(button => button.textContent === 'Ok')
    act(() => ok!.click())

    expect(pop).toHaveBeenCalledWith('tour')
    expect(parentClick).not.toHaveBeenCalled()
  })
})
