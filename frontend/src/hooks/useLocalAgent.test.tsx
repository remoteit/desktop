import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'

const { follow, stop, sessions } = vi.hoisted(() => ({ follow: vi.fn(), stop: vi.fn(), sessions: { on: true } }))
vi.mock('../services/localSubnet', () => ({ followLocalAgent: follow }))
vi.mock('./useDeviceSessions', () => ({ useDeviceSessions: () => sessions.on }))

import { useLocalAgent } from './useLocalAgent'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

it('is followed once signed in, where device sessions are on, and no longer', async () => {
  follow.mockReturnValue(stop)
  const root = createRoot(document.createElement('div'))
  const App: React.FC<{ on: boolean }> = ({ on }) => {
    useLocalAgent(on)
    return null
  }
  const render = (on: boolean) => act(async () => root.render(<App on={on} />))
  await render(false)
  sessions.on = false
  await render(true)
  expect(follow).not.toHaveBeenCalled()
  sessions.on = true
  await render(true)
  await render(true)
  expect(follow).toHaveBeenCalledOnce()
  expect(stop).not.toHaveBeenCalled()
  await render(false)
  expect(stop).toHaveBeenCalledOnce()
  await act(async () => root.unmount())
})
