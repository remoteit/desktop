import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const pop = vi.hoisted(() => vi.fn())
const state = vi.hoisted(() => ({
  user: { created: new Date(0) },
  ui: { guidesResetDate: 0, expireBubbles: false, poppedBubbles: [] as string[], sidebarMenu: false },
}))

vi.mock('react-redux', () => ({
  useSelector: (select: (s: any) => any) => select(state),
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
    state.ui.poppedBubbles = []
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.useRealTimers()
  })

  it("keeps its own button presses from reaching the element it's anchored inside", async () => {
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
    await act(async () => vi.runAllTimers())

    const ok = Array.from(document.querySelectorAll('button')).find(button => button.textContent === 'Ok')
    act(() => ok!.click())

    expect(pop).toHaveBeenCalledWith('tour')
    expect(parentClick).not.toHaveBeenCalled()
  })

  const shown = () => Array.from(document.querySelectorAll('[role="tooltip"]')).map(tip => tip.textContent)

  const render = (bubbles: React.ReactNode) =>
    act(async () => root.render(<ThemeProvider theme={theme}>{bubbles}</ThemeProvider>))
  const runTimers = () => act(async () => vi.runAllTimers())

  it('opens one bubble at a time, and a deferred tour waits for the others', async () => {
    const page = () => (
      <>
        <GuideBubble guide="chat" deferred added={new Date()} instructions="Chat tour">
          <span>chat</span>
        </GuideBubble>
        <GuideBubble guide="welcome" added={new Date()} instructions="Welcome tour">
          <span>welcome</span>
        </GuideBubble>
      </>
    )
    await render(page())
    await runTimers()
    expect(shown()).toEqual([expect.stringContaining('Welcome tour')])

    state.ui.poppedBubbles = ['welcome']
    await render(page())
    expect(shown()).toEqual([expect.stringContaining('Chat tour')])
  })

  it("continues the dismissed bubble's own tour before starting another", async () => {
    const page = () => (
      <>
        <GuideBubble guide="other" added={new Date()} instructions="Other tour">
          <span>other</span>
        </GuideBubble>
        <GuideBubble guide="first" added={new Date()} instructions="First step">
          <span>first</span>
        </GuideBubble>
        <GuideBubble guide="second" queueAfter="first" added={new Date()} instructions="Second step">
          <span>second</span>
        </GuideBubble>
      </>
    )
    state.ui.poppedBubbles = ['other']
    await render(page())
    await runTimers()
    expect(shown()).toEqual([expect.stringContaining('First step')])

    state.ui.poppedBubbles = []
    await render(page())
    expect(shown()).toEqual([expect.stringContaining('First step')])

    state.ui.poppedBubbles = ['first']
    await render(page())
    expect(shown()).toEqual([expect.stringContaining('Second step')])
  })
})
