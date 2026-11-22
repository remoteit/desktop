import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// The dialog is its own test's (RunActionDialog.test.tsx): here, what it was opened with, and its answer.
vi.mock('./RunActionDialog', () => ({
  RunActionDialog: ({ action, plain, scope, onDone }: any) => (
    <button
      data-dialog={`${action}:${scope === 'device' ? 'device' : `${scope.kind}:${scope.name}`}`}
      data-plain={plain}
      onClick={() => onDone('RUNS')}
    />
  ),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, text: string) => text }),
}))

import { RunActions, actionsFor } from './RunActions'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const buttons = () => [...document.body.querySelectorAll('[data-action]')].map(b => b.textContent)

async function render(props: any) {
  const onDone = vi.fn()
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () =>
    createRoot(container).render(<RunActions device={{ id: 'E1', name: 'e1' }} onDone={onDone} {...props} />)
  )
  return onDone
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('the actions on a device in what it runs', () => {
  it('only those its state allows: nothing to drain out of service, nothing to undrain in it', () => {
    expect(actionsFor({ state: 'ACTIVE', joining: false })).toEqual(['DRAIN', 'RETIRE', 'REMOVE'])
    expect(actionsFor({ state: 'DRAINING', joining: false })).toEqual(['UNDRAIN', 'RETIRE', 'REMOVE'])
    expect(actionsFor({ state: 'RETIRED', joining: false })).toEqual(['UNDRAIN', 'REMOVE'])
    expect(actionsFor()).toEqual(['DRAIN', 'UNDRAIN', 'RETIRE', 'REMOVE'])
  })

  it('in one exit or proxy server: Pause and Remove in service, Resume once paused; a device as a whole as before', async () => {
    await render({ scope: { kind: 'exit', name: 'HA Derby' }, run: { state: 'ACTIVE', joining: false } })
    expect(buttons()).toEqual(['Pause', 'Remove'])
    document.body.innerHTML = ''
    await render({ scope: { kind: 'exit', name: 'HA Derby' }, run: { state: 'DRAINING', joining: false } })
    expect(buttons()).toEqual(['Resume', 'Stop now', 'Remove'])
    document.body.innerHTML = ''
    await render({ scope: { kind: 'exit', name: 'HA Derby' }, run: { state: 'RETIRED', joining: false } })
    expect(buttons()).toEqual(['Resume', 'Remove'])
    document.body.innerHTML = ''
    await render({ scope: 'device' })
    expect(buttons()).toEqual(['Pause all', 'Resume all', 'Stop all now', 'Remove from all'])
  })

  it('a joining device waits to be approved only where an admin starts new devices', async () => {
    await render({ scope: { kind: 'exit', name: 'HA Derby' }, run: { state: 'RETIRED', joining: true } })
    expect(buttons()).toEqual(['Remove'])
    document.body.innerHTML = ''
    await render({ scope: { kind: 'exit', name: 'HA Derby' }, run: { state: 'RETIRED', joining: true }, activation: 'admin' })
    expect(buttons()).toEqual(['Approve', 'Remove'])
  })

  it('each plain action opens its dialog with the mutation it maps to, and its plain words', async () => {
    const cases: [string, any, string][] = [
      ['PAUSE', { state: 'ACTIVE', joining: false }, 'DRAIN'],
      ['RESUME', { state: 'RETIRED', joining: false }, 'UNDRAIN'],
      ['STOP', { state: 'DRAINING', joining: false }, 'RETIRE'],
      ['REMOVE', { state: 'ACTIVE', joining: false }, 'REMOVE'],
      ['APPROVE', { state: 'RETIRED', joining: true }, 'UNDRAIN'],
    ]
    for (const [plain, run, action] of cases) {
      document.body.innerHTML = ''
      await render({ scope: { kind: 'proxy', name: 'Office' }, run, activation: 'admin' })
      await act(async () => (document.body.querySelector(`[data-plain="${plain}"]`) as HTMLElement).click())
      const dialog = document.body.querySelector('[data-dialog]') as HTMLElement
      expect(dialog.getAttribute('data-dialog')).toBe(`${action}:proxy:Office`)
      expect(dialog.getAttribute('data-plain')).toBe(plain)
    }
  })

  it('each opens its dialog, which answers what the device runs after', async () => {
    const onDone = await render({ scope: 'device' })
    expect(document.body.querySelector('[data-dialog]')).toBeNull()
    await act(async () => (document.body.querySelector('[data-action="RETIRE"]') as HTMLElement).click())
    const dialog = document.body.querySelector('[data-dialog]') as HTMLElement
    expect(dialog.getAttribute('data-dialog')).toBe('RETIRE:device')
    await act(async () => dialog.click())
    expect(onDone).toHaveBeenCalledWith('RUNS')
  })
})
