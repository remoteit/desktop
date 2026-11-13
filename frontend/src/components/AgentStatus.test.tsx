import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// The device list's Agent column: the version, and where an upgrade stands — a device whose package its admin holds
// reads blocked, not failed.
const { info } = vi.hoisted(() => ({ info: vi.fn() }))
vi.mock('../hooks/useDeviceSessionInfo', () => ({ useDeviceSessionInfo: info }))
vi.mock('../hooks/useInterval', () => ({ useInterval: () => {} }))
vi.mock('../services/deviceSessionInfo', () => ({ requestDeviceSessionInfo: vi.fn() }))
vi.mock('../store', () => ({}))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({}))
vi.mock('./Icon', () => ({ Icon: ({ name }: any) => <i data-icon={name} /> }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return { useTranslation: () => ({ t: (_key: string, text: string, values?: any) => fill(text, values) }) }
})

import { AgentStatus } from './AgentStatus'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

async function render() {
  const el = document.createElement('div')
  document.body.appendChild(el)
  await act(async () => createRoot(el).render(<AgentStatus deviceId="80:00:00:00:00:00:00:01" />))
  return el
}

const agent = (update: object | null) => ({
  agent: { running: 'connectd-go 5.6.1', package: { version: '1.1.0.9' }, update },
})

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('AgentStatus', () => {
  it("a held device: blocked, held by the device's admin, the mechanism on hover", async () => {
    info.mockReturnValue(agent({ version: '1.1.0.10', state: 'held', detail: 'apt-mark hold' }))
    const el = await render()
    const state = el.querySelector('[data-agent-state]')!
    expect(state.getAttribute('data-agent-state')).toBe('held')
    expect(state.getAttribute('aria-label')).toBe("Blocked — held by the device's admin — apt-mark hold")
    expect(el.querySelector('[data-icon="lock"]')).not.toBeNull()
  })

  it('a failed upgrade still reads failed', async () => {
    info.mockReturnValue(agent({ version: '1.1.0.10', state: 'failed', detail: 'disk full' }))
    const el = await render()
    expect(el.querySelector('[data-agent-state]')!.getAttribute('data-agent-state')).toBe('failed')
  })

  it('nothing beside the version when it is settled', async () => {
    info.mockReturnValue(agent(null))
    const el = await render()
    expect(el.textContent).toBe('1.1.0.9')
    expect(el.querySelector('[data-agent-state]')).toBeNull()
  })

  it('a device something else upgrades: a grey mark saying who, the release available — not a failure', async () => {
    info.mockReturnValue({
      agent: {
        running: 'connectd-go 5.6.1',
        package: { version: '1.1.0.9', format: 'container' },
        update: {
          version: '1.1.0.10',
          state: 'held',
          detail: 'this device does not take updates (updates_control); updated by image',
        },
        updatedBy: 'image',
        howToUpdate: 'IMAGE',
        available: '1.1.0.10',
      },
    })
    const el = await render()
    const state = el.querySelector('[data-agent-state]')!
    expect(state.getAttribute('data-agent-state')).toBe('managed')
    expect(state.getAttribute('aria-label')).toContain('Updated by its container image; 1.1.0.10 is available')
    expect(el.querySelector('[data-icon="exclamation-triangle"]')).toBeNull()
    expect(el.querySelector('[data-icon="lock"]')).toBeNull()
  })

  it('a release held because the device takes no updates is not a hold by its admin', async () => {
    info.mockReturnValue(
      agent({ version: '1.1.0.10', state: 'held', detail: 'this device does not take updates (allow_updates)' })
    )
    const el = await render()
    expect(el.querySelector('[data-agent-state]')!.getAttribute('data-agent-state')).toBe('managed')
    expect(el.querySelector('[data-icon="lock"]')).toBeNull()
  })
})
