import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const redux = vi.hoisted(() => ({ state: {} as any }))
const router = vi.hoisted(() => ({ location: { pathname: '/devices' } }))
const uiSet = vi.hoisted(() => vi.fn())
const toggle = vi.hoisted(() => vi.fn())

vi.mock('react-redux', () => ({
  useSelector: (select: (s: any) => any) => select(redux.state),
  useDispatch: () => ({ ui: { set: uiSet } }),
}))
vi.mock('react-router-dom', () => ({ useLocation: () => router.location }))
vi.mock('../selectors/organizations', () => ({ selectOrganization: (state: any) => ({ id: state.orgId }) }))
vi.mock('../hooks/useChatEnabled', () => ({
  useChatToggle: () => ({ show: true, open: redux.state.chatOpen, toggle }),
  useChatDocked: () => redux.state.chatOpen && redux.state.docked,
}))
vi.mock('@mui/material', () => ({ Drawer: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
vi.mock('./Sidebar', () => ({ Sidebar: () => null }))

import { SidebarMenu } from './SidebarMenu'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('SidebarMenu', () => {
  let root: Root
  let container: HTMLDivElement

  const render = ({ drawer = false, chatOpen = true, docked = false, orgId = 'me', pathname = '/devices' } = {}) => {
    redux.state = { ui: { sidebarMenu: drawer, layout: {} }, chatOpen, docked, orgId }
    if (pathname !== router.location.pathname) router.location = { pathname }
    act(() => root.render(<SidebarMenu />))
  }

  beforeEach(() => {
    router.location = { pathname: '/devices' }
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    render()
    render({ drawer: true })
    uiSet.mockReset()
    toggle.mockReset()
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('closes an overlaid chat along with the drawer when the drawer navigates', () => {
    render({ drawer: true, pathname: '/logs' })
    expect(uiSet).toHaveBeenCalledWith({ sidebarMenu: false })
    expect(toggle).toHaveBeenCalledTimes(1)
  })

  it('leaves a docked chat open', () => {
    render({ drawer: true, docked: true })
    render({ drawer: true, docked: true, pathname: '/logs' })
    expect(toggle).not.toHaveBeenCalled()
  })

  it('leaves the chat open on an org switch from the drawer', () => {
    render({ drawer: true, orgId: 'acme' })
    expect(uiSet).toHaveBeenCalledWith({ sidebarMenu: false })
    expect(toggle).not.toHaveBeenCalled()
  })

  it('leaves the chat alone on navigation the drawer did not make', () => {
    render({ drawer: false })
    render({ drawer: false, pathname: '/logs' })
    expect(toggle).not.toHaveBeenCalled()
  })

  it('closes the drawer when it unmounts, so it cannot come back open and close the chat', () => {
    act(() => root.unmount())
    expect(uiSet).toHaveBeenCalledWith({ sidebarMenu: false })
    root = createRoot(container)
  })
})
