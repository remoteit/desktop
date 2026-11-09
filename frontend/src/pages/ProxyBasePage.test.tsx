import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { readBase, setBase, verify, remove, reloadEntry, reloadProxies, push, access, account, limits, inline } =
  vi.hoisted(() => ({
    readBase: vi.fn(async (_accountId: string) => null as any),
    setBase: vi.fn(async (_accountId: string, _base: string) => ({} as any)),
    verify: vi.fn(async (_accountId: string, _apply: boolean) => [] as any),
    remove: vi.fn(async (_accountId: string, _apply: boolean) => [] as any),
    reloadEntry: vi.fn(),
    reloadProxies: vi.fn(),
    push: vi.fn(),
    access: { admin: true },
    // The account the portal is acting as, and its plan's limits — read, or not yet.
    account: { id: 'ACCOUNT' },
    limits: { value: {} as Record<string, any>, read: true },
    // Each inline field's props, by its label: its value, its checks and its save.
    inline: {} as Record<string, any>,
  }))
vi.mock('../services/graphQLProxy', () => ({
  graphQLProxyBase: readBase,
  graphQLSetAccountProxyBase: setBase,
  graphQLVerifyAccountProxyBase: verify,
  graphQLRemoveAccountProxyBase: remove,
}))
vi.mock('../services/graphQLDaemon', () => ({ UNSUPPORTED: 'UNSUPPORTED' }))
vi.mock('react-redux', () => ({
  useSelector: (selector: any) => selector({ organization: { initialized: limits.read } }),
}))
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push }) }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: () => account.id }))
vi.mock('../selectors/organizations', () => ({
  selectLimitsLookup: (_state: any, accountId: string) => (accountId === account.id ? limits.value : {}),
}))
vi.mock('../hooks/useAccountAdmin', () => ({ useAccountAdmin: () => access.admin }))
// The Proxies page's line for the base and the account's proxies are the shared store's: here, their reloads.
vi.mock('../hooks/useAccountExits', () => ({
  useAccountProxyBase: () => ({ value: undefined, reload: reloadEntry }),
  useAccountProxies: () => ({ value: undefined, reload: reloadProxies }),
}))
vi.mock('../components/InlineTextFieldSetting', () => ({
  InlineTextFieldSetting: (props: any) => {
    inline[props.label] = props
    return <div data-inline={props.label} data-value={props.value} data-disabled={props.disabled ? '' : undefined} />
  },
}))
// A line, by its icon: what it says, its button, and anything beside it.
vi.mock('../components/ListItemSetting', () => ({
  ListItemSetting: ({
    icon,
    iconColor,
    label,
    subLabel,
    button,
    buttonDisabled,
    secondaryContent,
    onButtonClick,
  }: any) => (
    <div data-setting={icon} data-color={iconColor}>
      <span data-label>{label}</span>
      <span data-sublabel>{subLabel}</span>
      {secondaryContent}
      {button && (
        <button disabled={buttonDisabled} onClick={onButtonClick}>
          {button}
        </button>
      )}
    </div>
  ),
}))
vi.mock('../components/Confirm', () => ({
  Confirm: ({ open, title, action, disabled, children, onConfirm, onDeny }: any) =>
    open ? (
      <div data-confirm>
        <div data-confirm-title>{title}</div>
        {children}
        <button data-confirm-action disabled={disabled} onClick={onConfirm}>
          {action}
        </button>
        <button data-deny onClick={onDeny} />
      </div>
    ) : null,
}))
vi.mock('../components/Notice', () => ({
  Notice: ({ severity, children, button, onClose }: any) => (
    <div data-notice={severity ?? 'info'}>
      {children}
      {button}
      {onClose && <button data-close onClick={onClose} />}
    </div>
  ),
}))
vi.mock('../buttons/CopyIconButton', () => ({
  CopyIconButton: ({ value, title }: any) => <span data-copy={value} title={title} />,
}))
vi.mock('../components/Timestamp', () => ({ Timestamp: ({ date }: any) => <>{date.toISOString()}</> }))
vi.mock('../components/Icon', () => ({ Icon: ({ name, color }: any) => <i data-icon={name} data-color={color} /> }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('../components/BillingUI', () => ({ BillingUI: ({ children }: any) => <>{children}</> }))
vi.mock('../components/Container', () => ({
  Container: ({ header, children }: any) => (
    <div>
      <header>{header}</header>
      {children}
    </div>
  ),
}))
vi.mock('../components/Title', () => ({ Title: ({ children }: any) => <>{children}</> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children }: any) => <>{children}</> }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) =>
        typeof a === 'string' ? fill(a, b) : fill(a.count === 1 ? a.defaultValue_one : a.defaultValue_other, a),
    }),
  }
})

import { PROXY_BASE_LIMIT, ProxyBasePage, baseProblem } from './ProxyBasePage'
import { baseMoveCertificateLine, baseStateLine } from '../helpers/proxyBaseHelper'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
const t = ((_key: string, a: any, b?: any) =>
  typeof a === 'string' ? fill(a, b) : fill(a.count === 1 ? a.defaultValue_one : a.defaultValue_other, a)) as any

const LABEL = 'Subdomain'
const BASE = 'proxies.example.com'
const HINT =
  'Delegate a subdomain you control to remote.it with these NS records; every proxy of the account is then named under it, its records and certificates kept by remote.it.'
const PAID = 'A paid feature, one for the account: every proxy of it named under a subdomain of yours.'
const SERVERS = ['ns-1.awsdns-01.org', 'ns-2.awsdns-02.net', 'ns-3.awsdns-03.com', 'ns-4.awsdns-04.co.uk']

// Its four NS records, each found or not — and, not found, what DNS answered instead where it answered something.
const records = (...found: (true | null | string)[]) =>
  SERVERS.map((value, n) => ({
    name: BASE,
    type: 'NS',
    value,
    found: found[n] === true,
    seen: typeof found[n] === 'string' ? found[n] : null,
  }))
const based = (state: string, fields: any = {}) => ({
  base: BASE,
  state,
  nameServers: SERVERS,
  records: records(true, true, true, true),
  checked: '2026-11-08T23:00:00.000Z',
  problem: null,
  proxies: 0,
  ...fields,
})
const PENDING = based('pending', { records: records(true, null, 'ns1.other.net', true) })
const VERIFIED = based('verified')
const ACTIVE = based('active', { proxies: 3 })
// What moving under it does, proxy by proxy: one with endpoints, one with none; the base's certificate after.
const MOVES = [
  {
    proxy: { id: 'P1', name: 'Gateway' },
    host: 'gw-acme.dev.r3proxy.com',
    ownName: 'gw.proxies.example.com',
    addresses: [
      {
        endpoint: 'E1',
        kind: 'https',
        from: 'https://pi-acme.dev.r3proxy.com',
        to: 'https://pi.gw.proxies.example.com',
      },
      { endpoint: 'E2', kind: 'tcp', from: 'gw-acme.dev.r3proxy.com:30001', to: 'gw.proxies.example.com:30001' },
    ],
    certificate: 'pending',
    applied: false,
  },
  {
    proxy: { id: 'P2', name: 'NAS' },
    host: 'nas-acme.dev.r3proxy.com',
    ownName: 'nas.proxies.example.com',
    addresses: [],
    certificate: 'pending',
    applied: false,
  },
]
// Back to their names before: under their hosts, the stage's certificate.
const BACK = MOVES.map(each => ({
  ...each,
  ownName: null,
  addresses: each.addresses.map(address => ({ ...address, from: address.to, to: address.from })),
  certificate: 'ready',
}))
// As graphql answers a move: each proxy that moves, and whether it was done.
const said = (moves: any[], applied = false) => ({ moves, applied })

let root: Root | undefined
async function render() {
  if (root) await act(async () => root!.unmount())
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root!.render(<ProxyBasePage />))
  return container
}
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null
const setting = (icon: string) => $(`[data-setting="${icon}"]`)
const label = (icon: string) => setting(icon)?.querySelector('[data-label]')?.textContent
const sublabel = (icon: string) => setting(icon)?.querySelector('[data-sublabel]')?.textContent
const settingButton = (icon: string) => setting(icon)?.querySelector('button') as HTMLButtonElement | null
const click = (element: Element | null) => act(async () => (element as HTMLElement).click())
const section = () => $('[data-proxy-base]')?.getAttribute('data-proxy-base')
const STATES = ['hourglass', 'badge-check', 'circle-check', 'triangle-exclamation']
const stateLine = () => STATES.map(setting).find(Boolean) ?? null
const checkNow = () => [...document.body.querySelectorAll('button')].find(b => b.textContent === 'Check now') ?? null
const hint = () => $('[data-proxy-base-hint]')?.textContent
const rows = () =>
  [...document.body.querySelectorAll('[data-proxy-base-records] [data-record]')].map(row => [
    row.getAttribute('data-record'),
    row.getAttribute('data-record-value'),
    row.getAttribute('data-record-state'),
    row.querySelector('[data-record-found]')?.textContent,
  ])
// The move said, proxy by proxy: its name after, then each address and what it was.
const preview = () =>
  [...document.body.querySelectorAll('[data-proxy-base-move]')].map(proxy => [
    proxy.querySelector('[data-proxy-base-move-name]')?.textContent,
    [...proxy.querySelectorAll('li')].map(item =>
      [
        item.querySelector('.MuiListItemText-primary')?.textContent,
        item.querySelector('.MuiListItemText-secondary')?.textContent,
      ]
        .filter(Boolean)
        .join(' / ')
    ),
  ])
// An answer held back until the test lets it go.
function held<T>() {
  let release!: (value: T) => void
  const promise = new Promise<T>(resolve => (release = resolve))
  return { promise, release }
}
// The base as the page reads it now, and as it reads it again after a change.
function reads(...answers: any[]) {
  readBase.mockReset()
  answers.slice(0, -1).forEach(answer => readBase.mockResolvedValueOnce(answer))
  readBase.mockResolvedValue(answers[answers.length - 1])
}

beforeEach(() => {
  access.admin = true
  account.id = 'ACCOUNT'
  limits.value = { [PROXY_BASE_LIMIT]: 1 }
  limits.read = true
  reads(null)
  setBase.mockReset().mockResolvedValue({ ...PENDING })
  verify.mockReset().mockResolvedValue(said(MOVES))
  remove.mockReset().mockResolvedValue(said(BACK))
  for (const each of [reloadEntry, reloadProxies, push]) each.mockReset()
  for (const key of Object.keys(inline)) delete inline[key]
})

describe('who sees it, and what it is', () => {
  it('a paid feature, said plainly at its head; the base of the account the portal is acting as', async () => {
    await render()
    expect($('header')?.textContent).toContain('Account base for proxies')
    expect($('[data-proxy-base-paid]')?.textContent).toBe(PAID)
    expect(readBase).toHaveBeenCalledWith('ACCOUNT')
  })

  it('only for an admin of the account: anyone else is told so, and nothing is read', async () => {
    access.admin = false
    await render()
    expect($('[data-notice="info"]')?.textContent).toBe('Only an admin of the account can see or set its base.')
    expect(readBase).not.toHaveBeenCalled()
    expect(section()).toBeUndefined()
  })

  it('says it is reading it, a server without bases, and a base that could not be read', async () => {
    const answer = held<any>()
    readBase.mockReturnValue(answer.promise)
    await render()
    expect($('[data-loading]')).not.toBeNull()
    await act(async () => answer.release('UNSUPPORTED'))
    expect($('[data-notice="info"]')?.textContent).toBe('This server does not have account bases for proxies.')
    expect(section()).toBeUndefined()
    reads('ERROR')
    await render()
    expect($('[data-notice="error"]')?.textContent).toBe('The account’s base could not be read.')
    expect(section()).toBeUndefined()
  })

  it('another account’s base starts afresh: its own read', async () => {
    reads(ACTIVE)
    await render()
    account.id = 'ORG'
    await act(async () => root!.render(<ProxyBasePage />))
    expect(readBase).toHaveBeenLastCalledWith('ORG')
  })
})

describe('no base yet', () => {
  it('a subdomain to enter, and the one plain line; nothing to check, move or remove', async () => {
    await render()
    expect(section()).toBe('none')
    expect(inline[LABEL].value).toBe('')
    expect(inline[LABEL].placeholder).toBe('none: a subdomain you control, as proxies.example.com')
    expect(inline[LABEL].maxLength).toBe(253)
    expect('Proxies_1 .Example.com'.replace(inline[LABEL].filter, '')).toBe('Proxies1.Example.com')
    expect(hint()).toBe(HINT)
    expect(stateLine()).toBeNull()
    expect(checkNow()).toBeNull()
    expect($('[data-proxy-base-records]')).toBeNull()
    for (const icon of ['server', 'circle-arrow-right', 'rotate-left']) expect(setting(icon)).toBeNull()
  })

  it('a subdomain is checked as it is typed: any case, a trailing dot; not a domain itself; empty is none', async () => {
    await render()
    expect(inline[LABEL].validate('Proxies.Example.com.')).toBeUndefined()
    expect(inline[LABEL].validate('example.com')).toBe(
      'A subdomain of your domain, as proxies.example.com: not the domain itself'
    )
    expect(inline[LABEL].validate('-proxies.example.com')).toBe('Letters, digits and hyphens, in parts joined by dots')
    expect(inline[LABEL].validate('')).toBeUndefined()
  })

  it('claimed — trimmed, lower case, its trailing dot dropped —, then read again with its NS records', async () => {
    reads(null, PENDING)
    await render()
    await act(async () => inline[LABEL].onSave(' Proxies.Example.com. '))
    expect(setBase).toHaveBeenCalledWith('ACCOUNT', 'proxies.example.com')
    expect(readBase).toHaveBeenCalledTimes(2)
    expect(reloadEntry).toHaveBeenCalledTimes(1)
    expect(section()).toBe('pending')
    expect(inline[LABEL].value).toBe(BASE)
    expect(inline[LABEL].disabled).toBe(false)
    expect(rows()).toHaveLength(4)
    expect($('[data-notice]')).toBeNull()
  })

  it('nothing typed is nothing asked', async () => {
    await render()
    await act(async () => inline[LABEL].onSave('  '))
    expect(setBase).not.toHaveBeenCalled()
    expect($('[data-confirm]')).toBeNull()
  })

  it('refused — a plan without it, a name taken — in graphql’s words, or that it was not set; its notice closes', async () => {
    setBase.mockResolvedValue({ reason: 'The account’s plan does not include a base for its proxies' })
    await render()
    await act(async () => inline[LABEL].onSave(BASE))
    expect($('[data-notice="error"]')?.textContent).toBe('The account’s plan does not include a base for its proxies')
    expect(section()).toBe('none')
    setBase.mockResolvedValue({ reason: '' })
    await act(async () => inline[LABEL].onSave(BASE))
    expect($('[data-notice="error"]')?.textContent).toBe('It was not set: try again.')
    await click($('[data-notice] [data-close]'))
    expect($('[data-notice]')).toBeNull()
  })

  it('a plan without it — its limits do not give it —: a paid add-on, where plans are, and no form', async () => {
    limits.value = { 'org-users': 5 }
    await render()
    expect($('[data-proxy-base-plan]')?.textContent).toBe(
      'The account’s plan does not include a base for its proxies’ names: it is a paid add-on, and the Enterprise plan includes it.'
    )
    expect($('[data-proxy-base-paid]')?.textContent).toBe(PAID)
    expect(inline[LABEL]).toBeUndefined()
    expect(section()).toBeUndefined()
    const upgrade = [...document.body.querySelectorAll('button')].find(b => b.textContent === 'Upgrade')!
    await click(upgrade)
    expect(push).toHaveBeenCalledWith('/account/plans')
    for (const value of [0, false]) {
      limits.value = { [PROXY_BASE_LIMIT]: value }
      await render()
      expect(inline[LABEL]).toBeUndefined()
      expect($('[data-proxy-base-plan]')).not.toBeNull()
    }
  })

  it('a plan with it: the form; the account’s limits not read yet: the form too — graphql refuses a plan without it', async () => {
    limits.value = { [PROXY_BASE_LIMIT]: true }
    await render()
    expect(inline[LABEL]).toBeDefined()
    expect($('[data-proxy-base-plan]')).toBeNull()
    limits.value = {}
    limits.read = false
    await render()
    expect(inline[LABEL]).toBeDefined()
    expect($('[data-proxy-base-plan]')).toBeNull()
  })

  it('a base the account holds is shown, whatever its plan says now', async () => {
    limits.value = {}
    reads(ACTIVE)
    await render()
    expect(section()).toBe('active')
    expect($('[data-proxy-base-plan]')).toBeNull()
    expect($('[data-proxy-base-removal]')).toBeNull()
  })

  it('one remote.it takes away is said ahead, with when: its plan no longer including a base, or not delegated', async () => {
    limits.value = {}
    reads(based('active', { proxies: 3, removeAt: '2026-11-10T12:00:00.000Z', removeReason: 'plan' }))
    await render()
    expect($('[data-proxy-base-removal]')?.getAttribute('data-proxy-base-removal')).toBe('plan')
    expect($('[data-proxy-base-removal]')?.textContent).toBe(
      'The account’s plan no longer includes a base: remote.it removes it — its proxies back under their own names — unless the plan includes one again by 2026-11-10T12:00:00.000Z'
    )
  })

  it('a pending one not delegated by its time is said to be removed then', async () => {
    reads(based('pending', { removeAt: '2026-11-15T23:00:00.000Z', removeReason: 'pending' }))
    await render()
    expect($('[data-proxy-base-removal]')?.textContent).toBe(
      'Not delegated yet: remote.it removes it unless its NS records are found by 2026-11-15T23:00:00.000Z'
    )
  })
})

describe('pending', () => {
  it('how many of its NS records are found; each by its value, with copy buttons and what was found; its name servers to copy at once', async () => {
    reads(PENDING)
    await render()
    expect(section()).toBe('pending')
    expect(label('hourglass')).toBe('Pending: 2 of 4 NS records found')
    expect(setting('hourglass')?.getAttribute('data-color')).toBe('warning')
    expect(sublabel('hourglass')).toBe(
      'Add them where your DNS is hosted, then check them · Checked 2026-11-08T23:00:00.000Z'
    )
    expect(rows()).toEqual([
      [BASE, 'ns-1.awsdns-01.org', 'found', 'Found'],
      [BASE, 'ns-2.awsdns-02.net', 'missing', 'Missing'],
      [BASE, 'ns-3.awsdns-03.com', 'wrong', 'Wrong: answers ns1.other.net'],
      [BASE, 'ns-4.awsdns-04.co.uk', 'found', 'Found'],
    ])
    const row = $('[data-record-value="ns-2.awsdns-02.net"]')!
    expect(row.textContent).toContain('NS')
    expect(
      [...row.querySelectorAll('[data-copy]')].map(copy => [copy.getAttribute('data-copy'), copy.getAttribute('title')])
    ).toEqual([
      [BASE, 'Copy the name'],
      ['ns-2.awsdns-02.net', 'Copy the value'],
    ])
    expect([...document.body.querySelectorAll('[data-proxy-base-records] th')].map(th => th.textContent)).toEqual([
      'Name',
      'Type',
      'Value',
      'State',
    ])
    expect(label('server')).toBe('Its name servers')
    expect($('[data-proxy-base-name-servers]')?.textContent).toBe(SERVERS.join(', '))
    expect(setting('server')?.querySelector('[data-copy]')?.getAttribute('data-copy')).toBe(SERVERS.join('\n'))
    expect(setting('server')?.querySelector('[data-copy]')?.getAttribute('title')).toBe('Copy them all')
    expect(hint()).toBe(HINT)
    expect(checkNow()).not.toBeNull()
    expect(label('rotate-left')).toBe('Remove the account’s base')
    expect(sublabel('rotate-left')).toBe('Which proxies move back is said first; then its zone is deleted')
    expect(setting('circle-arrow-right')).toBeNull()
    // No proxy is under it yet: another may still be entered.
    expect(inline[LABEL].value).toBe(BASE)
  })

  it('never checked, says so; a problem graphql says is said with it', async () => {
    reads(based('pending', { checked: null, problem: 'proxies.example.com has no NS records yet' }))
    await render()
    expect(sublabel('hourglass')).toBe(
      'Add them where your DNS is hosted, then check them · proxies.example.com has no NS records yet · Not checked yet'
    )
  })

  it('another base in its place is claimed anew; the same one is no change', async () => {
    reads(PENDING)
    await render()
    await act(async () => inline[LABEL].onSave(BASE))
    expect(setBase).not.toHaveBeenCalled()
    await act(async () => inline[LABEL].onSave('names.example.com'))
    expect(setBase).toHaveBeenCalledWith('ACCOUNT', 'names.example.com')
  })

  it('Check now: its delegation checked at once and read again; still not seen, nothing more is asked', async () => {
    reads(PENDING, based('pending', { records: records(true, true, true, null) }))
    await render()
    await click(checkNow())
    expect(verify).toHaveBeenCalledWith('ACCOUNT', false)
    expect(verify).toHaveBeenCalledTimes(1)
    expect(readBase).toHaveBeenCalledTimes(2)
    expect(reloadEntry).toHaveBeenCalledTimes(1)
    expect(label('hourglass')).toBe('Pending: 3 of 4 NS records found')
    expect($('[data-confirm]')).toBeNull()
    expect(checkNow()!.disabled).toBe(false)
  })

  it('a check refused is said in graphql’s words, the base read again; one with none says it could not be checked', async () => {
    reads(PENDING)
    verify.mockResolvedValue({ reason: 'Public DNS did not answer for proxies.example.com' })
    await render()
    await click(checkNow())
    expect($('[data-notice="error"]')?.textContent).toBe('Public DNS did not answer for proxies.example.com')
    expect(readBase).toHaveBeenCalledTimes(2)
    expect($('[data-confirm]')).toBeNull()
    verify.mockResolvedValue({ reason: '' })
    await click(checkNow())
    expect($('[data-notice="error"]')?.textContent).toBe('Its delegation could not be checked: try again.')
  })

  it('Check now finding it delegated: what moves said proxy by proxy from its answer, not asked again, moved once confirmed', async () => {
    reads(PENDING, VERIFIED)
    await render()
    await click(checkNow())
    expect(section()).toBe('verified')
    expect($('[data-confirm-title]')?.textContent).toBe('Move the account’s proxies under proxies.example.com?')
    expect($('[data-proxy-base-certificate]')?.textContent).toBe(
      'The certificate for proxies.example.com is not issued yet: until it is, their https endpoints are not served under it.'
    )
    expect(preview()).toEqual([
      [
        'Gateway: gw.proxies.example.com',
        [
          'https://pi.gw.proxies.example.com / was https://pi-acme.dev.r3proxy.com',
          'gw.proxies.example.com:30001 / was gw-acme.dev.r3proxy.com:30001',
        ],
      ],
      ['NAS: nas.proxies.example.com', ['No endpoint address moves.']],
    ])
    expect(verify).toHaveBeenCalledTimes(1)
    expect($('[data-confirm-action]')?.textContent).toBe('Move')
    expect(($('[data-confirm-action]') as HTMLButtonElement).disabled).toBe(false)
    expect($('[data-proxy-base-zone]')).toBeNull()

    verify.mockResolvedValue(
      said(
        MOVES.map(each => ({ ...each, applied: true })),
        true
      )
    )
    reads(ACTIVE)
    await click($('[data-confirm-action]'))
    expect(verify).toHaveBeenLastCalledWith('ACCOUNT', true)
    expect($('[data-confirm]')).toBeNull()
    expect(reloadProxies).toHaveBeenCalledTimes(1)
    expect(section()).toBe('active')
  })
})

describe('verified', () => {
  it('its delegation seen: the move offered, said first — asked now —, then made; the base another only once removed', async () => {
    reads(VERIFIED)
    verify.mockResolvedValue(said(MOVES.map(each => ({ ...each, certificate: 'ready' }))))
    await render()
    expect(inline[LABEL]).toBeUndefined()
    expect(label('sitemap')).toBe(BASE)
    expect(sublabel('sitemap')).toBe('The account’s base: to use another, remove this one first')
    expect(label('badge-check')).toBe('Verified: its delegation to remote.it is seen')
    expect(setting('badge-check')?.getAttribute('data-color')).toBe('success')
    expect(sublabel('badge-check')).toBe(
      'The account’s proxies move under it once you confirm · Checked 2026-11-08T23:00:00.000Z'
    )
    expect(rows().map(([, , state]) => state)).toEqual(['found', 'found', 'found', 'found'])
    expect(label('circle-arrow-right')).toBe('Move the account’s proxies under proxies.example.com')
    expect(sublabel('circle-arrow-right')).toBe('What moves is said first, proxy by proxy')
    await click(settingButton('circle-arrow-right'))
    expect(verify).toHaveBeenCalledWith('ACCOUNT', false)
    expect($('[data-proxy-base-certificate]')?.textContent).toBe(
      'Their https endpoints are served with the certificate for proxies.example.com.'
    )
    expect(preview()).toHaveLength(2)
    reads(ACTIVE)
    await click($('[data-confirm-action]'))
    expect(verify).toHaveBeenLastCalledWith('ACCOUNT', true)
    expect(reloadProxies).toHaveBeenCalledTimes(1)
    expect(section()).toBe('active')
  })

  it('no proxy to move: said, and it can still be made — the base active with none under it yet', async () => {
    reads(VERIFIED)
    verify.mockResolvedValue(said([]))
    await render()
    await click(settingButton('circle-arrow-right'))
    expect($('[data-proxy-base-none]')?.textContent).toBe('No proxy moves.')
    expect($('[data-proxy-base-certificate]')).toBeNull()
    expect(($('[data-confirm-action]') as HTMLButtonElement).disabled).toBe(false)
  })

  it('a move refused as it is made is said in graphql’s words, nothing moved and the dialog kept; with none, that nothing was', async () => {
    reads(VERIFIED)
    await render()
    await click(settingButton('circle-arrow-right'))
    verify.mockResolvedValue({ reason: 'Proxies.example.com is no longer delegated: check it again' })
    await click($('[data-confirm-action]'))
    expect($('[data-confirm] [data-notice="error"]')?.textContent).toBe(
      'Proxies.example.com is no longer delegated: check it again'
    )
    expect(($('[data-confirm-action]') as HTMLButtonElement).disabled).toBe(true)
    expect(reloadProxies).not.toHaveBeenCalled()
    expect(readBase).toHaveBeenCalledTimes(1)
    await click($('[data-deny]'))
    expect($('[data-confirm]')).toBeNull()
    verify.mockResolvedValueOnce(said(MOVES)).mockResolvedValueOnce({ reason: '' })
    await click(settingButton('circle-arrow-right'))
    expect($('[data-confirm] [data-notice]')).toBeNull()
    await click($('[data-confirm-action]'))
    expect($('[data-confirm] [data-notice="error"]')?.textContent).toBe('Nothing was moved: try again.')
  })

  it('what the move would do not said: in graphql’s words, or that it could not be, and nothing to confirm', async () => {
    reads(VERIFIED)
    verify.mockResolvedValue({ reason: 'Proxies.example.com changed: check it again' })
    await render()
    await click(settingButton('circle-arrow-right'))
    expect($('[data-confirm] [data-notice="error"]')?.textContent).toBe('Proxies.example.com changed: check it again')
    expect(($('[data-confirm-action]') as HTMLButtonElement).disabled).toBe(true)
    await click($('[data-deny]'))
    verify.mockResolvedValue({ reason: '' })
    await click(settingButton('circle-arrow-right'))
    expect($('[data-confirm] [data-notice="error"]')?.textContent).toBe(
      'What it would do could not be said: try again.'
    )
  })

  it('said, while it is still being asked', async () => {
    reads(VERIFIED)
    const answer = held<any>()
    verify.mockReturnValue(answer.promise)
    await render()
    await click(settingButton('circle-arrow-right'))
    expect($('[data-confirm] [data-loading]')).not.toBeNull()
    expect(($('[data-confirm-action]') as HTMLButtonElement).disabled).toBe(true)
    await act(async () => answer.release(said(MOVES)))
    expect($('[data-loading]')).toBeNull()
    expect(preview()).toHaveLength(2)
  })
})

describe('active', () => {
  it('its base — another only once it is removed —, how many proxies are under it, what that means; its NS records kept', async () => {
    reads(ACTIVE)
    await render()
    expect(section()).toBe('active')
    expect(inline[LABEL]).toBeUndefined()
    expect(label('sitemap')).toBe(BASE)
    expect(sublabel('sitemap')).toBe('The account’s base: to use another, remove this one first')
    expect(label('circle-check')).toBe('Active: 3 proxies named under it')
    expect(setting('circle-check')?.getAttribute('data-color')).toBe('success')
    expect(sublabel('circle-check')).toBe('Checked 2026-11-08T23:00:00.000Z')
    expect(hint()).toBe(
      'Every proxy of the account is named <label>.proxies.example.com, but one with a name of its own; remote.it writes their records and keeps their certificates. Keep these NS records where your DNS is hosted.'
    )
    expect(rows()).toHaveLength(4)
    expect(setting('circle-arrow-right')).toBeNull()
    expect(checkNow()).not.toBeNull()
    expect(label('rotate-left')).toBe('Remove the account’s base')
  })

  it('one proxy under it, said as one', async () => {
    reads(based('active', { proxies: 1 }))
    await render()
    expect(label('circle-check')).toBe('Active: 1 proxy named under it')
  })

  it('Check now checks its delegation again, and asks nothing more', async () => {
    reads(ACTIVE)
    await render()
    await click(checkNow())
    expect(verify).toHaveBeenCalledWith('ACCOUNT', false)
    expect($('[data-confirm]')).toBeNull()
  })
})

describe('broken', () => {
  it('each NS record gone or wrong named; what that means until they are right', async () => {
    reads(based('broken', { proxies: 3, records: records(true, null, 'ns1.other.net', true) }))
    await render()
    expect(section()).toBe('broken')
    expect(label('triangle-exclamation')).toBe(
      'Broken: NS ns-2.awsdns-02.net is missing; NS ns-3.awsdns-03.com is wrong: it answers ns1.other.net'
    )
    expect(setting('triangle-exclamation')?.getAttribute('data-color')).toBe('danger')
    expect(sublabel('triangle-exclamation')).toBe(
      'Until its NS records are right, names under it may not answer, and their certificates cannot be renewed · Checked 2026-11-08T23:00:00.000Z'
    )
    expect(rows().map(([, value, state]) => [value, state])).toEqual([
      ['ns-1.awsdns-01.org', 'found'],
      ['ns-2.awsdns-02.net', 'missing'],
      ['ns-3.awsdns-03.com', 'wrong'],
      ['ns-4.awsdns-04.co.uk', 'found'],
    ])
    expect(label('sitemap')).toBe(BASE)
    expect(inline[LABEL]).toBeUndefined()
    expect(hint()).toBe(HINT)
    expect(setting('circle-arrow-right')).toBeNull()
  })

  it('its records all found again, though graphql has not said so yet: broken, and why in its words', async () => {
    reads(based('broken', { problem: 'proxies.example.com answers from other name servers' }))
    await render()
    expect(label('triangle-exclamation')).toBe('Broken')
    expect(sublabel('triangle-exclamation')).toContain('proxies.example.com answers from other name servers · Checked')
  })
})

describe('removing it', () => {
  it('which proxies move back said first, its zone deleted with it; then removed, and the base and the proxies read again', async () => {
    reads(ACTIVE, null)
    await render()
    await click(settingButton('rotate-left'))
    expect(remove).toHaveBeenCalledWith('ACCOUNT', false)
    expect($('[data-confirm-title]')?.textContent).toBe('Remove proxies.example.com?')
    expect($('[data-confirm-action]')?.textContent).toBe('Remove')
    expect($('[data-proxy-base-certificate]')?.textContent).toBe(
      'Their https endpoints are served with remote.it’s certificate for every proxy name.'
    )
    expect(preview()).toEqual([
      [
        'Gateway: gw-acme.dev.r3proxy.com',
        [
          'https://pi-acme.dev.r3proxy.com / was https://pi.gw.proxies.example.com',
          'gw-acme.dev.r3proxy.com:30001 / was gw.proxies.example.com:30001',
        ],
      ],
      ['NAS: nas-acme.dev.r3proxy.com', ['No endpoint address moves.']],
    ])
    expect($('[data-proxy-base-zone]')?.textContent).toBe(
      'remote.it’s zone for proxies.example.com is deleted: its NS records can then come out of your DNS.'
    )
    await click($('[data-confirm-action]'))
    expect(remove).toHaveBeenLastCalledWith('ACCOUNT', true)
    expect($('[data-confirm]')).toBeNull()
    expect(reloadProxies).toHaveBeenCalledTimes(1)
    expect(reloadEntry).toHaveBeenCalledTimes(1)
    expect(section()).toBe('none')
    expect(inline[LABEL].value).toBe('')
  })

  it('before any proxy moved: none moves, and it is still removed; Cancel removes nothing', async () => {
    reads(PENDING)
    remove.mockResolvedValue(said([]))
    await render()
    await click(settingButton('rotate-left'))
    expect($('[data-proxy-base-none]')?.textContent).toBe('No proxy moves.')
    expect($('[data-proxy-base-zone]')).not.toBeNull()
    expect(($('[data-confirm-action]') as HTMLButtonElement).disabled).toBe(false)
    await click($('[data-deny]'))
    expect($('[data-confirm]')).toBeNull()
    expect(remove).not.toHaveBeenCalledWith('ACCOUNT', true)
  })

  it('emptied, a pending base is given up the same way: said first', async () => {
    reads(PENDING)
    await render()
    await act(async () => inline[LABEL].onSave(''))
    expect(setBase).not.toHaveBeenCalled()
    expect(remove).toHaveBeenCalledWith('ACCOUNT', false)
    expect($('[data-confirm-title]')?.textContent).toBe('Remove proxies.example.com?')
  })

  it('a removal refused as it is made is said in graphql’s words, and nothing moves', async () => {
    reads(ACTIVE)
    await render()
    await click(settingButton('rotate-left'))
    remove.mockResolvedValue({ reason: 'The zone for proxies.example.com could not be deleted: try again' })
    await click($('[data-confirm-action]'))
    expect($('[data-confirm] [data-notice="error"]')?.textContent).toBe(
      'The zone for proxies.example.com could not be deleted: try again'
    )
    expect(reloadProxies).not.toHaveBeenCalled()
    expect(section()).toBe('active')
  })
})

describe('while one change is being made', () => {
  it('nothing else can be: Check now, the move and Remove wait', async () => {
    reads(VERIFIED)
    const answer = held<any>()
    verify.mockReturnValue(answer.promise)
    await render()
    await act(async () => {
      void checkNow()!.click()
    })
    expect(checkNow()!.disabled).toBe(true)
    expect(settingButton('circle-arrow-right')!.disabled).toBe(true)
    expect(settingButton('rotate-left')!.disabled).toBe(true)
    await act(async () => answer.release({ reason: 'try again' }))
    expect(checkNow()!.disabled).toBe(false)
    expect(settingButton('circle-arrow-right')!.disabled).toBe(false)
    expect(settingButton('rotate-left')!.disabled).toBe(false)
  })

  it('a pending base’s subdomain waits too', async () => {
    reads(PENDING)
    const answer = held<any>()
    verify.mockReturnValue(answer.promise)
    await render()
    await act(async () => {
      void checkNow()!.click()
    })
    expect(inline[LABEL].disabled).toBe(true)
    await act(async () => answer.release({ reason: 'try again' }))
    expect(inline[LABEL].disabled).toBe(false)
  })
})

describe('said in words', () => {
  it('a base: DNS labels, a subdomain — not a domain itself —; the rest is graphql’s', () => {
    expect(baseProblem(t, 'proxies.example.com')).toBeUndefined()
    expect(baseProblem(t, 'proxies.example.co.uk')).toBeUndefined()
    expect(baseProblem(t, 'example.com')).toBe(
      'A subdomain of your domain, as proxies.example.com: not the domain itself'
    )
    for (const name of ['proxies..example.com', 'proxies_.example.com', `${'x'.repeat(64)}.example.com`])
      expect(baseProblem(t, name)).toBe('Letters, digits and hyphens, in parts joined by dots')
  })

  it('where it stands in a line, as the Proxies page says it', () => {
    expect(baseStateLine(t, PENDING as any)).toBe('Pending: 2 of 4 NS records found')
    expect(baseStateLine(t, VERIFIED as any)).toBe('Verified: its delegation to remote.it is seen')
    expect(baseStateLine(t, based('active', { proxies: 0 }) as any)).toBe('Active: 0 proxies named under it')
    expect(baseStateLine(t, based('broken', { records: records(true, true, true, null) }) as any)).toBe(
      'Broken: NS ns-4.awsdns-04.co.uk is missing'
    )
  })

  it('the certificate after a move: the base’s, ready, pending or failed; remote.it’s for every proxy name moving back', () => {
    expect(baseMoveCertificateLine(t, 'verify', 'ready', BASE)).toBe(
      'Their https endpoints are served with the certificate for proxies.example.com.'
    )
    expect(baseMoveCertificateLine(t, 'verify', 'pending', BASE)).toBe(
      'The certificate for proxies.example.com is not issued yet: until it is, their https endpoints are not served under it.'
    )
    expect(baseMoveCertificateLine(t, 'verify', 'failed', BASE)).toBe(
      'The certificate for proxies.example.com could not be issued: until it is, their https endpoints are not served under it.'
    )
    expect(baseMoveCertificateLine(t, 'remove', 'ready', BASE)).toBe(
      'Their https endpoints are served with remote.it’s certificate for every proxy name.'
    )
    expect(baseMoveCertificateLine(t, 'remove', 'pending', BASE)).toBe(
      'remote.it’s certificate for every proxy name is not issued yet: until it is, their https endpoints are not served.'
    )
  })
})
