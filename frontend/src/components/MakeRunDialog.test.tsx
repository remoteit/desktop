import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const calls: string[] = []
const { accountExits, createExit, deleteExit, addExit, accountProxies, createProxy, deleteProxy, addProxy } = vi.hoisted(
  () => ({
    accountExits: vi.fn(async (_accountId: string) => ({ own: [], shared: [] } as any)),
    createExit: vi.fn(async (_name: string, _accountId?: string) => ({} as any)),
    deleteExit: vi.fn(async (_exit: string, _confirm: boolean) => ({} as any)),
    addExit: vi.fn(async (_exit: string, _deviceId: string) => ({} as any)),
    accountProxies: vi.fn(async (_accountId: string) => [] as any),
    createProxy: vi.fn(async (_set: any) => ({} as any)),
    deleteProxy: vi.fn(async (_proxy: string, _confirm: boolean) => ({} as any)),
    addProxy: vi.fn(async (_proxy: string, _deviceId: string) => ({} as any)),
  })
)
vi.mock('../services/graphQLExits', () => ({
  graphQLAccountExits: accountExits,
  graphQLCreateExit: createExit,
  graphQLDeleteExit: deleteExit,
}))
vi.mock('../services/graphQLProxy', () => ({
  graphQLAccountProxies: accountProxies,
  graphQLCreateProxy: createProxy,
  graphQLDeleteProxy: deleteProxy,
}))
vi.mock('../services/graphQLDeviceRuns', () => ({ graphQLAddExitDevice: addExit, graphQLAddProxyDevice: addProxy }))
vi.mock('./Confirm', () => ({
  Confirm: ({ title, action, disabled, children, onConfirm }: any) => (
    <div data-dialog>
      <h2>{title}</h2>
      {children}
      <button data-confirm disabled={disabled} onClick={onConfirm}>
        {action}
      </button>
    </div>
  ),
}))
vi.mock('./LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('./Notice', () => ({
  Notice: ({ severity, children }: any) => <div data-notice={severity}>{children}</div>,
}))
// A text field as an input; a choice as a button for each of its options.
vi.mock('@mui/material', async () => {
  const actual: any = await vi.importActual('@mui/material')
  return {
    ...actual,
    TextField: ({ select, label, value, children, onChange }: any) =>
      select ? (
        <div data-choose={label}>
          {React.Children.map(children, (child: any) => (
            <button data-pick={child.props.value} onClick={() => onChange({ target: { value: child.props.value } })}>
              {child.props.children}
            </button>
          ))}
        </div>
      ) : (
        <input data-field={label} value={value} onChange={onChange} />
      ),
  }
})
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) =>
        typeof a === 'string' ? fill(a, b) : fill(a.count === 1 ? a.defaultValue_one : a.defaultValue_other, a),
    }),
  }
})

import { MakeRunDialog } from './MakeRunDialog'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const MAC = { id: 'MAC', name: 'Office Mac', ownerId: 'ACCOUNT' }
const RUNS = { exit: { state: 'RETIRED', joining: true }, proxy: null }
const find = (selector: string) => document.body.querySelector(selector) as HTMLElement
const confirm = () => find('[data-confirm]') as HTMLButtonElement

async function open(kind: 'exit' | 'proxy') {
  const handlers = { onClose: vi.fn(), onDone: vi.fn() }
  const container = document.createElement('div')
  document.body.appendChild(container)
  await act(async () => createRoot(container).render(<MakeRunDialog kind={kind} device={MAC} {...handlers} />))
  await act(async () => {})
  return handlers
}

beforeEach(() => {
  document.body.innerHTML = ''
  calls.length = 0
  accountExits.mockReset().mockResolvedValue({
    own: [
      { id: 'xha', name: 'HA Derby', lan: false },
      { id: 'xlan', name: 'Office', lan: true },
    ],
    shared: [],
  })
  createExit.mockReset().mockImplementation(async name => {
    calls.push('create')
    return { id: 'xnew', name }
  })
  addExit.mockReset().mockImplementation(async () => {
    calls.push('add')
    return { runs: RUNS }
  })
  deleteExit.mockReset().mockResolvedValue({})
  accountProxies.mockReset().mockResolvedValue([
    { id: 'P-OWN', name: 'Remote-Dragon', local: false },
    { id: 'P-LAN', name: 'Office printers', local: true },
  ])
  createProxy.mockReset().mockImplementation(async ({ name }) => ({ id: 'P-NEW', name }))
  addProxy.mockReset().mockResolvedValue({ runs: RUNS })
  deleteProxy.mockReset().mockResolvedValue({})
})

describe('making a device an exit: one action of two calls', () => {
  it('a new exit in the device’s account, named after it, made and then the device added', async () => {
    const { onDone, onClose } = await open('exit')
    expect(accountExits).toHaveBeenCalledWith('ACCOUNT')
    expect(find('h2').textContent).toBe('Make Office Mac an exit')
    expect((find('[data-field="Name"]') as HTMLInputElement).value).toBe('Office Mac exit')
    await act(async () => confirm().click())
    expect(calls).toEqual(['create', 'add'])
    expect(createExit).toHaveBeenCalledWith('Office Mac exit', 'ACCOUNT')
    expect(addExit).toHaveBeenCalledWith('xnew', 'MAC')
    expect(onDone).toHaveBeenCalledWith(RUNS, { id: 'xnew', name: 'Office Mac exit' })
    expect(onClose).toHaveBeenCalled()
  })

  it('the device refused: the new exit is deleted again, and the refusal said', async () => {
    addExit.mockResolvedValue({ reason: 'Its daemon is not online to say whether it can be an exit' })
    const { onDone } = await open('exit')
    await act(async () => confirm().click())
    expect(deleteExit).toHaveBeenCalledWith('xnew', false)
    expect(find('[data-notice]').textContent).toBe('Its daemon is not online to say whether it can be an exit')
    expect(onDone).not.toHaveBeenCalled()
  })

  it('the exit refused: said, and no device added', async () => {
    createExit.mockResolvedValue({ reason: 'No access' })
    await open('exit')
    await act(async () => confirm().click())
    expect(find('[data-notice]').textContent).toBe('No access')
    expect(addExit).not.toHaveBeenCalled()
  })

  it('or added to one of its account’s exits: no exit made, none deleted on a refusal', async () => {
    const { onDone } = await open('exit')
    await act(async () => (find('input[value="existing"]') as HTMLInputElement).click())
    expect(confirm().disabled).toBe(true)
    await act(async () => find('[data-pick="xha"]').click())
    await act(async () => confirm().click())
    expect(createExit).not.toHaveBeenCalled()
    expect(addExit).toHaveBeenCalledWith('xha', 'MAC')
    expect(onDone).toHaveBeenCalledWith(RUNS, undefined)
    addExit.mockResolvedValue({ reason: 'It uses HA Derby as its own exit: choose another for it first' })
    await act(async () => confirm().click())
    expect(deleteExit).not.toHaveBeenCalled()
  })

  it('to one of its exits whose users reach its devices’ local networks: says first that its own opens to them', async () => {
    await open('exit')
    expect(find('[data-lan-warning]')).toBeNull()
    await act(async () => (find('input[value="existing"]') as HTMLInputElement).click())
    await act(async () => find('[data-pick="xlan"]').click())
    expect(find('[data-notice="warning"] [data-lan-warning]').textContent).toBe(
      'This exit lets its users reach its devices’ local networks: adding Office Mac opens its network to them.'
    )
    expect(addExit).not.toHaveBeenCalled()
    await act(async () => find('[data-pick="xha"]').click())
    expect(find('[data-lan-warning]')).toBeNull()
    await act(async () => find('[data-pick="xlan"]').click())
    await act(async () => confirm().click())
    expect(addExit).toHaveBeenCalledWith('xlan', 'MAC')
  })

  it('an account with no exit offers none to add it to', async () => {
    accountExits.mockResolvedValue({ own: [], shared: [] })
    await open('exit')
    expect((find('input[value="existing"]') as HTMLInputElement).disabled).toBe(true)
  })

  it('a new one needs a name', async () => {
    await open('exit')
    const name = find('[data-field="Name"]') as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    await act(async () => {
      setter.call(name, '  ')
      name.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(confirm().disabled).toBe(true)
  })
})

describe('making a device a proxy', () => {
  it('a new proxy made, then the device added; refused, the proxy deleted again', async () => {
    const { onDone } = await open('proxy')
    expect(find('h2').textContent).toBe('Make Office Mac a proxy')
    await act(async () => confirm().click())
    expect(createProxy).toHaveBeenCalledWith({ name: 'Office Mac proxy', local: false, accountId: 'ACCOUNT' })
    expect(addProxy).toHaveBeenCalledWith('P-NEW', 'MAC')
    expect(onDone).toHaveBeenCalledWith(RUNS, { id: 'P-NEW', name: 'Office Mac proxy' })
    addProxy.mockResolvedValue({ reason: 'The device and the proxy are in different accounts' })
    await act(async () => confirm().click())
    expect(deleteProxy).toHaveBeenCalledWith('P-NEW', false)
  })

  it('or added to one of its account’s proxies', async () => {
    await open('proxy')
    expect(accountProxies).toHaveBeenCalledWith('ACCOUNT')
    await act(async () => (find('input[value="existing"]') as HTMLInputElement).click())
    await act(async () => find('[data-pick="P-OWN"]').click())
    await act(async () => confirm().click())
    expect(createProxy).not.toHaveBeenCalled()
    expect(addProxy).toHaveBeenCalledWith('P-OWN', 'MAC')
  })

  it('a new one is Internet or Local network, chosen there for good; Internet unless chosen', async () => {
    await open('proxy')
    expect(find('[data-proxy-kind]').getAttribute('data-proxy-kind')).toBe('internet')
    expect(find('[data-proxy-kind]').textContent).toContain('Chosen now: it cannot be changed later.')
    await act(async () => (find('input[value="local"]') as HTMLInputElement).click())
    expect(find('[data-proxy-kind]').getAttribute('data-proxy-kind')).toBe('local')
    await act(async () => confirm().click())
    expect(createProxy).toHaveBeenCalledWith({ name: 'Office Mac proxy', local: true, accountId: 'ACCOUNT' })
    expect(addProxy).toHaveBeenCalledWith('P-NEW', 'MAC')
  })

  it('the kind is asked of a new proxy alone: not of one of the account’s, nor of an exit', async () => {
    await open('proxy')
    await act(async () => (find('input[value="existing"]') as HTMLInputElement).click())
    expect(find('[data-proxy-kind]')).toBeNull()
    document.body.innerHTML = ''
    await open('exit')
    expect(find('[data-proxy-kind]')).toBeNull()
  })

  it('the account’s proxies reached on their devices’ network only are marked', async () => {
    await open('proxy')
    await act(async () => (find('input[value="existing"]') as HTMLInputElement).click())
    expect([...document.body.querySelectorAll('[data-pick]')].map(pick => pick.textContent)).toEqual([
      'Remote-Dragon',
      'Office printers · Local network',
    ])
  })

  it('added to a local one on another network than the device’s: refused in graphql’s words, nothing made or deleted', async () => {
    addProxy.mockResolvedValue({
      reason: 'Office Mac is on another network (10.0.0.0/24) than Office printers (192.168.1.0/24)',
    })
    const { onDone } = await open('proxy')
    await act(async () => (find('input[value="existing"]') as HTMLInputElement).click())
    await act(async () => find('[data-pick="P-LAN"]').click())
    await act(async () => confirm().click())
    expect(addProxy).toHaveBeenCalledWith('P-LAN', 'MAC')
    expect(find('[data-notice]').textContent).toBe(
      'Office Mac is on another network (10.0.0.0/24) than Office printers (192.168.1.0/24)'
    )
    expect(createProxy).not.toHaveBeenCalled()
    expect(deleteProxy).not.toHaveBeenCalled()
    expect(onDone).not.toHaveBeenCalled()
  })
})
