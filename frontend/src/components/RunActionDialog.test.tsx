import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { effects, runAction, sessions } = vi.hoisted(() => ({
  effects: vi.fn(async (_deviceId: string, _action: string, _force?: boolean) => [] as any),
  runAction: vi.fn(async (_scope: string, _deviceId: string, _action: string, _options?: any) => ({} as any)),
  sessions: { on: true },
}))
vi.mock('../services/graphQLDeviceRuns', () => ({ graphQLActionEffects: effects, graphQLRunAction: runAction }))
vi.mock('../hooks/useDeviceSessions', () => ({ useDeviceSessions: () => sessions.on }))
// The dialog: its title, what it says, and its action button as the person would press it.
vi.mock('./Confirm', () => ({
  Confirm: ({ open, title, action, disabled, children, onConfirm, onDeny }: any) =>
    open ? (
      <div data-dialog>
        <h2>{title}</h2>
        {children}
        <button data-confirm disabled={disabled} onClick={onConfirm}>
          {action}
        </button>
        <button data-deny onClick={onDeny}>
          Cancel
        </button>
      </div>
    ) : null,
}))
vi.mock('./LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('./Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) =>
        typeof a === 'string' ? fill(a, b) : fill(a.count === 1 ? a.defaultValue_one : a.defaultValue_other, a),
    }),
  }
})

import { DeviceRunEffects, RunActionDialog } from './RunActionDialog'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const E1 = { id: '90:00:00:00:00:00:00:01', name: 'e1' }
const effect = (fields: any = {}) => ({
  kind: 'proxy',
  id: 'P1',
  name: 'remote.it pdx1a',
  state: 'ACTIVE',
  after: 'retired',
  sessions: 0,
  ends: true,
  endpoints: 3,
  users: 0,
  moved: 0,
  inService: 1,
  dormant: false,
  refusal: null,
  ...fields,
})
const PROXY = effect()
const EXIT = effect({ kind: 'exit', id: 'pdx1a', endpoints: 0, users: 4, moved: 1 })
const RUNS = { proxy: { state: 'RETIRED', joining: false, proxy: { name: 'remote.it pdx1a' } }, exit: null }

const find = (selector: string) => document.body.querySelector(selector) as HTMLElement
const confirm = () => find('[data-confirm]') as HTMLButtonElement

async function open(props: any = {}) {
  const handlers = { onClose: vi.fn(), onDone: vi.fn() }
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () =>
    createRoot(container).render(
      <RunActionDialog open device={E1} action="RETIRE" scope="device" {...handlers} {...props} />
    )
  )
  return handlers
}

async function type(input: HTMLInputElement, text: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  await act(async () => {
    setter.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

beforeEach(() => {
  document.body.innerHTML = ''
  sessions.on = true
  effects.mockReset().mockResolvedValue([PROXY, EXIT])
  runAction.mockReset().mockResolvedValue({ runs: RUNS })
})

describe('an action on a device: what it does, said first', () => {
  it('reads what the action would do to everything it runs and says it, before anything is done', async () => {
    await open()
    expect(effects).toHaveBeenCalledWith(E1.id, 'RETIRE', false)
    expect(find('h2').textContent).toBe('Retire e1 in everything it runs?')
    expect(find('[data-effect="proxy"]').textContent).toContain('Proxy remote.it pdx1a: in service → retired')
    expect(find('[data-effect="proxy"]').textContent).toContain(
      'Its 3 endpoints stay on the proxy, served by its other devices in service.'
    )
    expect(find('[data-effect="exit"]').textContent).toContain(
      '1 device going out through it now moves to another of its devices.'
    )
    expect(runAction).not.toHaveBeenCalled()
  })

  it('confirmed, it acts on the whole device, and says what it runs after', async () => {
    const { onDone, onClose } = await open()
    await act(async () => confirm().click())
    expect(runAction).toHaveBeenCalledWith('device', E1.id, 'RETIRE', { maxWaitMinutes: undefined, force: false })
    expect(onDone).toHaveBeenCalledWith(RUNS)
    expect(onClose).toHaveBeenCalled()
  })

  it('on one proxy or exit alone: only its effect, and its own mutation', async () => {
    await open({ action: 'DRAIN', scope: { kind: 'exit', name: 'remote.it pdx1a' } })
    expect(find('h2').textContent).toBe('Drain e1 in remote.it pdx1a?')
    expect(find('[data-effect="exit"]')).not.toBeNull()
    expect(find('[data-effect="proxy"]')).toBeNull()
    await act(async () => confirm().click())
    expect(runAction).toHaveBeenCalledWith('exit', E1.id, 'DRAIN', { maxWaitMinutes: 60, force: false })
  })

  it('a drain waits for open connections as long as asked, between a minute and a week', async () => {
    await open({ action: 'DRAIN' })
    const wait = find('input[type="number"]') as HTMLInputElement
    expect(wait.value).toBe('60')
    await type(wait, '0')
    expect(confirm().disabled).toBe(true)
    await type(wait, '15')
    expect(confirm().disabled).toBe(false)
    await act(async () => confirm().click())
    expect(runAction).toHaveBeenCalledWith('device', E1.id, 'DRAIN', { maxWaitMinutes: 15, force: false })
  })

  it('a retire with connections open is refused, unless the person chooses to end them', async () => {
    const refusal = '2 connections are still open through it: wait for them to close (drain it), or retire it with force'
    effects.mockImplementation(async (_id, _action, force) =>
      force ? [effect({ sessions: 2 })] : [effect({ sessions: 2, refusal })]
    )
    await open()
    expect(find('[data-effect="proxy"]').textContent).toContain(`Refused: ${refusal}.`)
    expect(confirm().disabled).toBe(true)
    const end = find('input[type="checkbox"]') as HTMLInputElement
    await act(async () => end.click())
    expect(effects).toHaveBeenLastCalledWith(E1.id, 'RETIRE', true)
    expect(find('[data-effect="proxy"]').textContent).toContain('The 2 connections open through it end.')
    expect(confirm().disabled).toBe(false)
    await act(async () => confirm().click())
    expect(runAction).toHaveBeenCalledWith('device', E1.id, 'RETIRE', { maxWaitMinutes: undefined, force: true })
  })

  it('an exit-only device’s retire, refused while what is open through it is not known, may be forced too', async () => {
    const refusal = 'its daemon does not say what is open through it: retire it with force to end whatever is'
    effects.mockImplementation(async (_id, _action, force) =>
      force ? [effect({ kind: 'exit', sessions: null })] : [effect({ kind: 'exit', sessions: null, refusal })]
    )
    await open()
    expect(confirm().disabled).toBe(true)
    await act(async () => (find('input[type="checkbox"]') as HTMLInputElement).click())
    expect(confirm().disabled).toBe(false)
    await act(async () => confirm().click())
    expect(runAction).toHaveBeenCalledWith('device', E1.id, 'RETIRE', { maxWaitMinutes: undefined, force: true })
  })

  it('a retire refused for anything else stays refused, forced or not', async () => {
    effects.mockResolvedValue([effect({ refusal: 'It runs Office, which serves others' })])
    await open()
    await act(async () => (find('input[type="checkbox"]') as HTMLInputElement).click())
    expect(effects).toHaveBeenLastCalledWith(E1.id, 'RETIRE', true)
    expect(confirm().disabled).toBe(true)
  })

  it('any other refusal stands: said, and nothing can be done', async () => {
    effects.mockResolvedValue([
      effect({ after: 'gone', refusal: 'it runs remote.it pdx1a, which serves others: drain it there first, then retire it' }),
    ])
    await open({ action: 'REMOVE' })
    expect(find('[data-effect="proxy"]').textContent).toContain('drain it there first, then retire it')
    expect(find('input[type="checkbox"]')).toBeNull()
    expect(confirm().disabled).toBe(true)
  })

  it('what it would do unread: said, and nothing is done; nothing run: said so', async () => {
    effects.mockResolvedValue('ERROR')
    await open()
    expect(find('[data-notice]').textContent).toContain('What it would do could not be read, so nothing is done')
    expect(confirm().disabled).toBe(true)
    document.body.innerHTML = ''
    effects.mockResolvedValue([])
    await open()
    expect(document.body.textContent).toContain('It runs no proxy or exit.')
    expect(confirm().disabled).toBe(true)
  })

  it('graphql’s refusal of the action is said in the dialog, which stays open', async () => {
    runAction.mockResolvedValue({ reason: 'Remote.it pdx1a: a connection opened meanwhile' })
    const { onDone, onClose } = await open()
    await act(async () => confirm().click())
    expect(find('[data-notice]').textContent).toBe('Remote.it pdx1a: a connection opened meanwhile')
    expect(onDone).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('undrain asks to put it back in service', async () => {
    await open({ action: 'UNDRAIN' })
    expect(find('h2').textContent).toBe('Put e1 back in service in everything it runs?')
    expect(confirm().textContent).toContain('Undrain')
  })
})

describe('what deleting or decommissioning a device does to what it runs', () => {
  async function render(action: 'DELETE' | 'DECOMMISSION') {
    const container = document.createElement('div')
    document.body.appendChild(container)
    await act(async () => createRoot(container).render(<DeviceRunEffects deviceId={E1.id} action={action} />))
    return container
  }

  it('each proxy and exit it runs, a deleted device keeping its place, serving nothing', async () => {
    effects.mockResolvedValue([effect({ after: 'disabled' })])
    const page = await render('DELETE')
    expect(effects).toHaveBeenCalledWith(E1.id, 'DELETE')
    expect(page.textContent).toContain('It runs these, and they change so:')
    expect(page.textContent).toContain('Proxy remote.it pdx1a: in service → serving nothing while it is disabled')
  })

  it('nothing where it runs nothing, the API has none, or device sessions are off', async () => {
    effects.mockResolvedValue([])
    expect((await render('DECOMMISSION')).textContent).toBe('')
    effects.mockResolvedValue('UNSUPPORTED')
    expect((await render('DECOMMISSION')).textContent).toBe('')
    sessions.on = false
    effects.mockClear()
    expect((await render('DELETE')).textContent).toBe('')
    expect(effects).not.toHaveBeenCalled()
  })
})
