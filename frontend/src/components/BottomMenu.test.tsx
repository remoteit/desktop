import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const redux = vi.hoisted(() => ({ state: {} as any }))
const set = vi.hoisted(() => vi.fn())
const push = vi.hoisted(() => vi.fn())

vi.mock('react-redux', () => ({
  useSelector: (select: (s: any) => any) => select(redux.state),
  useDispatch: () => ({ chat: { set } }),
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

import { CHAT_FEATURE } from '../constants'
import { BottomMenu } from './BottomMenu'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const layout = { mobile: true, insets: { bottom: 0 } } as ILayout

describe('BottomMenu', () => {
  let root: Root
  let container: HTMLDivElement

  const render = ({ licensed = true, open = false, poppedOut = false } = {}) => {
    redux.state = { limits: licensed ? { [CHAT_FEATURE]: true } : {}, chat: { open, poppedOut } }
    act(() => root.render(<BottomMenu layout={layout} />))
  }
  const actions = () => Array.from(container.querySelectorAll<HTMLButtonElement>('.MuiBottomNavigationAction-root'))
  const action = (label: string) => actions().find(button => button.textContent === label)

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    set.mockReset()
    push.mockReset()
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('toggles the chat from the AI action instead of navigating', () => {
    render()
    act(() => action('AI Agent')!.click())
    expect(set).toHaveBeenCalledWith({ open: true })

    render({ open: true })
    act(() => action('AI Agent')!.click())
    expect(set).toHaveBeenLastCalledWith({ open: false })
    expect(push).not.toHaveBeenCalled()
  })

  it('still navigates from the page actions', () => {
    render()
    act(() => action('Networks')!.click())
    expect(push).toHaveBeenCalledWith('/networks')
    expect(set).not.toHaveBeenCalled()
  })

  it('leaves the AI action out without the licence or while the chat is popped out', () => {
    render({ licensed: false })
    expect(action('AI Agent')).toBeUndefined()
    expect(actions()).toHaveLength(3)

    render({ poppedOut: true })
    expect(action('AI Agent')).toBeUndefined()
  })
})
