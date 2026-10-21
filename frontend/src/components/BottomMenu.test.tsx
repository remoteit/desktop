import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const redux = vi.hoisted(() => ({ state: {} as any }))
const setPersistent = vi.hoisted(() => vi.fn())
const pop = vi.hoisted(() => vi.fn())
const push = vi.hoisted(() => vi.fn())

vi.mock('react-redux', () => ({
  useSelector: (select: (s: any) => any) => select(redux.state),
  useDispatch: () => ({ ui: { pop, setPersistent } }),
}))
vi.mock('react-router-dom', () => ({
  useHistory: () => ({ push }),
  useLocation: () => ({ pathname: '/devices' }),
}))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_: string, fallback: string) => fallback }) }))
vi.mock('../selectors/organizations', () => ({ selectLimitsLookup: (state: any) => state.limits }))
vi.mock('../services/browser', () => ({ default: {} }))
vi.mock('../hooks/useCounts', () => ({ useCounts: () => ({ active: 0 }) }))
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('./Chat/ChatAgentGuide', () => ({
  ChatAgentGuide: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { CHAT_FEATURE, CHAT_AGENT_GUIDE } from '../constants'
import { BottomMenu } from './BottomMenu'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const layout = { mobile: true, insets: { bottom: 0 } } as ILayout

describe('BottomMenu', () => {
  let root: Root
  let container: HTMLDivElement

  const render = ({ licensed = true, open = false, poppedOut = false } = {}) => {
    redux.state = {
      limits: licensed ? { [CHAT_FEATURE]: true } : {},
      ui: { chatOpen: open, chatPoppedOut: poppedOut },
    }
    act(() => root.render(<BottomMenu layout={layout} />))
  }
  const actions = () => Array.from(container.querySelectorAll<HTMLButtonElement>('.MuiBottomNavigationAction-root'))
  const action = (label: string) => actions().find(button => button.textContent === label)

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    setPersistent.mockReset()
    pop.mockReset()
    push.mockReset()
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('opens the chat from the AI tab instead of navigating, and a second tap keeps it open', () => {
    render()
    act(() => action('Agent')!.click())
    expect(setPersistent).toHaveBeenCalledWith({ chatOpen: true })

    render({ open: true })
    act(() => action('Agent')!.click())
    expect(setPersistent).toHaveBeenCalledTimes(1)
    expect(push).not.toHaveBeenCalled()
  })

  it('puts the Agent tab first', () => {
    render()
    expect(actions().map(button => button.textContent)).toEqual(['Agent', 'Connections', 'Devices', 'Networks'])
  })

  it('selects the AI tab while the chat is open', () => {
    render({ open: true })
    expect(action('Agent')!.classList).toContain('Mui-selected')
    expect(action('Devices')!.classList).not.toContain('Mui-selected')
  })

  it('closes the chat when another tab is picked', () => {
    render({ open: true })
    act(() => action('Networks')!.click())
    expect(setPersistent).toHaveBeenCalledWith({ chatOpen: false })
    expect(push).toHaveBeenCalledWith('/networks')
  })

  it("closes the chat back to the page under it without pushing that page's path again", () => {
    render({ open: true })
    act(() => action('Devices')!.click())
    expect(setPersistent).toHaveBeenCalledWith({ chatOpen: false })
    expect(push).not.toHaveBeenCalled()
  })

  it('finishes the chat tour step from anywhere on the AI action, not just its icon', () => {
    render()
    act(() => action('Agent')!.click())
    expect(pop).toHaveBeenCalledWith(CHAT_AGENT_GUIDE)
  })

  it('still navigates from the page actions', () => {
    render()
    act(() => action('Networks')!.click())
    expect(push).toHaveBeenCalledWith('/networks')
    expect(setPersistent).not.toHaveBeenCalled()
  })

  it('leaves the AI action out without the licence or while the chat is popped out', () => {
    render({ licensed: false })
    expect(action('Agent')).toBeUndefined()
    expect(actions()).toHaveLength(3)

    render({ poppedOut: true })
    expect(action('Agent')).toBeUndefined()
  })
})
