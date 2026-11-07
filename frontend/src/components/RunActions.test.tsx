import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// The dialog is its own test's (RunActionDialog.test.tsx): here, what it was opened with, and its answer.
vi.mock('./RunActionDialog', () => ({
  RunActionDialog: ({ action, scope, onDone }: any) => (
    <button data-dialog={`${action}:${scope === 'device' ? 'device' : `${scope.kind}:${scope.name}`}`} onClick={() => onDone('RUNS')} />
  ),
  actionVerb: (_t: any, action: string) => ({ DRAIN: 'Drain', UNDRAIN: 'Undrain', RETIRE: 'Retire', REMOVE: 'Remove' }[action]),
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

  it('a joining device is put in service; the device as a whole is acted on in all it runs', async () => {
    await render({ scope: { kind: 'exit', name: 'HA Derby' }, run: { state: 'RETIRED', joining: true } })
    expect(buttons()).toEqual(['Put in service', 'Remove'])
    document.body.innerHTML = ''
    await render({ scope: 'device' })
    expect(buttons()).toEqual(['Drain all', 'Undrain all', 'Retire all', 'Remove from all'])
  })

  it('each opens its dialog, which answers what the device runs after', async () => {
    const onDone = await render({ scope: { kind: 'proxy', name: 'Remote-Dragon' }, run: { state: 'ACTIVE', joining: false } })
    expect(document.body.querySelector('[data-dialog]')).toBeNull()
    await act(async () => (document.body.querySelector('[data-action="RETIRE"]') as HTMLElement).click())
    const dialog = document.body.querySelector('[data-dialog]') as HTMLElement
    expect(dialog.getAttribute('data-dialog')).toBe('RETIRE:proxy:Remote-Dragon')
    await act(async () => dialog.click())
    expect(onDone).toHaveBeenCalledWith('RUNS')
  })
})
