import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DEFAULT_CONNECTION } from '@common/constants'
import { getApplication } from '@common/applications'

const state = { ui: { autoLaunch: undefined as string | undefined } }
const dispatch = { ui: { set: (update: { autoLaunch?: string }) => Object.assign(state.ui, update) } }
const windowOpen = vi.fn()

vi.mock('react-redux', () => ({
  useSelector: (selector: (s: typeof state) => unknown) => selector(state),
  useDispatch: () => dispatch,
}))
vi.mock('../../services/Heartbeat', () => ({ default: { connect: vi.fn() } }))
vi.mock('../../services/browser', () => ({ windowOpen: (...args: unknown[]) => windowOpen(...args) }))
vi.mock('../../services/Controller', () => ({ emit: vi.fn() }))
vi.mock('../../helpers/connectionHelper', () => ({ updateConnection: vi.fn(), launchDisabled: () => false }))
vi.mock('../../buttons/IconButton', () => ({
  IconButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}))
vi.mock('../../components/Icon', () => ({ Icon: () => null }))
vi.mock('../../components/PromptModal', () => ({
  PromptModal: ({ open }: { open: boolean }) => (open ? <div data-testid="prompt" /> : null),
}))

import { LaunchButton } from './LaunchButton'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const connection: IConnection = { ...DEFAULT_CONNECTION, id: 'service-1', typeID: 7, autoLaunch: true }

describe('LaunchButton auto launch', () => {
  let container: HTMLDivElement
  let root: Root

  const render = (update: Partial<IConnection>) => {
    const current = { ...connection, ...update }
    act(() => root.render(<LaunchButton app={getApplication(undefined, current)} connection={current} />))
  }

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    state.ui.autoLaunch = connection.id
    windowOpen.mockClear()
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('waits for the host instead of prompting when connected arrives before ready', () => {
    render({ connected: true, ready: false })

    expect(container.querySelector('[data-testid="prompt"]')).toBeNull()
    expect(windowOpen).not.toHaveBeenCalled()
    expect(state.ui.autoLaunch).toBe(connection.id)

    render({ connected: true, ready: true, host: 'abc.p021.r3proxy.com' })

    expect(windowOpen).toHaveBeenCalledExactlyOnceWith('https://abc.p021.r3proxy.com', '_blank', false)
    expect(state.ui.autoLaunch).toBeUndefined()
  })
})
