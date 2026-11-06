import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) =>
        typeof a === 'string' ? fill(a, b) : fill(a.count === 1 ? a.defaultValue_one : a.defaultValue_other, a),
    }),
  }
})

import { LastInGroupDialog } from './LastInGroupDialog'
import type { ProxyGroup } from '../services/graphQLProxyGroups'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const office: ProxyGroup = {
  label: 'gabc123',
  name: 'Office Mac group',
  remoteit: false,
  host: null,
  members: [{ id: 'MAC', name: 'Office Mac', kind: 'exit', state: 'active' }],
  users: 3,
  endpoints: 2,
}
const button = (text: string) =>
  [...document.body.querySelectorAll('button')].find(b => b.textContent?.includes(text)) as HTMLButtonElement

async function render(props: Partial<React.ComponentProps<typeof LastInGroupDialog>> = {}) {
  const handlers = { onKeep: vi.fn(), onDelete: vi.fn(), onCancel: vi.fn() }
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () =>
    createRoot(container).render(
      <LastInGroupDialog open group={office} device="Office Mac" action="exit" {...handlers} {...props} />
    )
  )
  return handlers
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('taking away the last device in its group', () => {
  it('names the group, and says how many devices use it and how many endpoints it has, and what each choice does', async () => {
    await render()
    const text = document.body.textContent
    expect(text).toContain('Stop offering Office Mac as an exit node?')
    expect(text).toContain('It is the last device in its group, Office Mac group.')
    expect(text).toContain('3 devices use it as their exit, and it has 2 endpoints.')
    expect(text).toContain('Kept, it waits for another device to be added to it.')
    expect(text).toContain('their traffic stops until then')
    expect(text).toContain('Deleted, the devices using it go their usual way, and its endpoints are removed.')
  })

  it('keeping the group is the default: the one button that stands out, and focused', async () => {
    const { onKeep, onDelete } = await render({ action: 'proxy' })
    expect(document.body.textContent).toContain('Stop using Office Mac as a proxy?')
    const keep = button('Keep the group')
    expect(keep.className).toContain('MuiButton-contained')
    expect(button('Delete the group too').className).not.toContain('MuiButton-contained')
    expect(document.activeElement).toBe(keep)
    await act(async () => keep.click())
    expect(onKeep).toHaveBeenCalledTimes(1)
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('deleting it too, or cancelling, is asked for', async () => {
    const { onKeep, onDelete, onCancel } = await render()
    await act(async () => button('Delete the group too').click())
    expect(onDelete).toHaveBeenCalledTimes(1)
    await act(async () => button('Cancel').click())
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onKeep).not.toHaveBeenCalled()
  })

  it('a group nothing uses says so', async () => {
    await render({ group: { ...office, users: 0, endpoints: 0 } })
    expect(document.body.textContent).toContain('No device uses it as its exit, and it has no endpoints.')
    expect(document.body.textContent).toContain('Deleted, nothing else changes: nothing uses it.')
  })
})
