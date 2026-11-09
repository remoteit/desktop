import React, { act, useState } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { setName, verify, remove, readAgain, busyCalls, inline } = vi.hoisted(() => ({
  setName: vi.fn(async (_proxy: string, _name: string) => ({} as any)),
  verify: vi.fn(async (_proxy: string, _apply: boolean) => ({} as any)),
  remove: vi.fn(async (_proxy: string, _apply: boolean) => ({} as any)),
  // The proxy as its page reads it again after a change.
  readAgain: vi.fn((): any => undefined),
  busyCalls: [] as boolean[],
  // Each inline field's props, by its label: its value, its checks and its save.
  inline: {} as Record<string, any>,
}))
vi.mock('../services/graphQLProxy', () => ({
  graphQLSetProxyName: setName,
  graphQLVerifyProxyName: verify,
  graphQLRemoveProxyName: remove,
}))
vi.mock('./InlineTextFieldSetting', () => ({
  InlineTextFieldSetting: (props: any) => {
    inline[props.label] = props
    return <div data-inline={props.label} data-value={props.value} data-disabled={props.disabled ? '' : undefined} />
  },
}))
// A line, by its icon: what it says, and its button.
vi.mock('./ListItemSetting', () => ({
  ListItemSetting: ({ icon, iconColor, label, subLabel, button, buttonDisabled, onButtonClick }: any) => (
    <div data-setting={icon} data-color={iconColor}>
      <span data-label>{label}</span>
      <span data-sublabel>{subLabel}</span>
      {button && (
        <button disabled={buttonDisabled} onClick={onButtonClick}>
          {button}
        </button>
      )}
    </div>
  ),
}))
vi.mock('./Confirm', () => ({
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
vi.mock('./Notice', () => ({
  Notice: ({ severity, children, onClose }: any) => (
    <div data-notice={severity ?? 'info'}>
      {children}
      {onClose && <button data-close onClick={onClose} />}
    </div>
  ),
}))
vi.mock('../buttons/CopyIconButton', () => ({
  CopyIconButton: ({ value, title }: any) => <span data-copy={value} title={title} />,
}))
vi.mock('./Timestamp', () => ({ Timestamp: ({ date }: any) => <>{date.toISOString()}</> }))
vi.mock('./Icon', () => ({ Icon: ({ name, color }: any) => <i data-icon={name} data-color={color} /> }))
vi.mock('./LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return { useTranslation: () => ({ t: (_key: string, text: string, values?: any) => fill(text, values) }) }
})

import { ProxyOwnName, moveCertificateLine, ownCertificateLine, ownNameProblem, recordState } from './ProxyOwnName'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const t = ((_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')) as any

const LABEL = 'DNS name'
const HINT =
  'Use a name under a domain you control. Add these records where your DNS is hosted; remote.it checks them and keeps the certificate renewed.'
const TOKEN = '3f9a1c2b4d5e6f70.challenge.dev.r3proxy.com'

// Its three records, each found or not — and, not found, what DNS answered instead where it answered something.
const records = (...found: (true | null | string)[]) =>
  [
    ['office.example.com', 'gw-acme-corp.dev.r3proxy.com'],
    ['*.office.example.com', 'gw-acme-corp.dev.r3proxy.com'],
    ['_acme-challenge.office.example.com', TOKEN],
  ].map(([name, value], n) => ({
    name,
    type: 'CNAME',
    value,
    found: found[n] === true,
    seen: typeof found[n] === 'string' ? found[n] : null,
  }))
const own = (state: string, fields: any = {}) => ({
  name: 'office.example.com',
  state,
  records: records(true, true, true),
  certificate: null,
  checked: '2026-11-08T23:00:00.000Z',
  problem: null,
  ...fields,
})
const GATEWAY = {
  id: 'P1',
  name: 'Gateway',
  host: 'gw-acme-corp.dev.r3proxy.com',
  remoteit: false,
  ownName: null,
} as any
const named = (state: string, fields: any = {}) => ({ ...GATEWAY, ownName: own(state, fields) })
const PENDING = named('pending', { records: records(true, null, 'other.example.net') })
const VERIFIED = named('verified', { certificate: 'pending' })
const ACTIVE = named('active', { certificate: 'ready' })
// What moving under it does: its https endpoint under the name, its tcp one at it; the certificate after.
const MOVE = {
  addresses: [
    {
      endpoint: 'EP1',
      kind: 'https',
      from: 'https://ep1-acme-corp.dev.r3proxy.com',
      to: 'https://ep1.office.example.com',
    },
    { endpoint: 'EP2', kind: 'tcp', from: 'gw-acme-corp.dev.r3proxy.com:30001', to: 'office.example.com:30001' },
  ],
  certificate: 'pending',
  applied: false,
}
// Back to remote.it's names.
const BACK = {
  addresses: MOVE.addresses.map(address => ({ ...address, from: address.to, to: address.from })),
  certificate: 'ready',
  applied: false,
}

// The section as its page holds it: the page's busy, and the proxy read again after a change.
const Page: React.FC<{ proxy: any }> = ({ proxy: first }) => {
  const [proxy, setProxy] = useState(first)
  const [busy, setBusy] = useState(false)
  return (
    <ProxyOwnName
      proxy={proxy}
      busy={busy}
      onBusy={value => {
        busyCalls.push(value)
        setBusy(value)
      }}
      onChanged={async () => {
        const read = readAgain() ?? proxy
        setProxy(read)
        return read
      }}
    />
  )
}

let root: Root | undefined
async function render(proxy: any) {
  if (root) await act(async () => root!.unmount())
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root!.render(<Page proxy={proxy} />))
  return container
}
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null
const setting = (icon: string) => $(`[data-setting="${icon}"]`)
const label = (icon: string) => setting(icon)?.querySelector('[data-label]')?.textContent
const sublabel = (icon: string) => setting(icon)?.querySelector('[data-sublabel]')?.textContent
const settingButton = (icon: string) => setting(icon)?.querySelector('button') as HTMLButtonElement | null
const click = (element: Element | null) => act(async () => (element as HTMLElement).click())
const section = () => $('[data-own-name]')?.getAttribute('data-own-name')
// Where it stands: its line's icon, what it says, and what is under it.
const STATES = ['hourglass', 'badge-check', 'circle-check', 'triangle-exclamation']
const stateLine = () => STATES.map(setting).find(Boolean) ?? null
const checkNow = () => [...document.body.querySelectorAll('button')].find(b => b.textContent === 'Check now') ?? null
const rows = () =>
  [...document.body.querySelectorAll('[data-record]')].map(row => [
    row.getAttribute('data-record'),
    row.getAttribute('data-record-state'),
    row.querySelector('[data-record-found]')?.textContent,
  ])
const preview = () =>
  [...document.body.querySelectorAll('[data-own-name-addresses] li')].map(item => [
    item.querySelector('.MuiListItemText-primary')?.textContent,
    item.querySelector('.MuiListItemText-secondary')?.textContent,
  ])
// An answer held back until the test lets it go.
function held<T>() {
  let release!: (value: T) => void
  const promise = new Promise<T>(resolve => (release = resolve))
  return { promise, release }
}

beforeEach(() => {
  for (const each of [setName, verify, remove]) each.mockReset().mockResolvedValue({ ...MOVE })
  remove.mockResolvedValue({ ...BACK })
  readAgain.mockReset().mockReturnValue(undefined)
  busyCalls.length = 0
  for (const key of Object.keys(inline)) delete inline[key]
})

describe('an own name, as it can be told here', () => {
  it('DNS labels joined by dots, at least one under a domain: example.com itself is refused, the rest is graphql’s', () => {
    expect(ownNameProblem(t, 'office.example.com')).toBeUndefined()
    expect(ownNameProblem(t, 'pi-1.office.example.co.uk')).toBeUndefined()
    expect(ownNameProblem(t, 'example.com')).toBe(
      'A name under your domain, as office.example.com: not the domain itself'
    )
    for (const name of [
      '-office.example.com',
      'office-.example.com',
      'office..example.com',
      `${'x'.repeat(64)}.example.com`,
    ])
      expect(ownNameProblem(t, name)).toBe('Letters, digits and hyphens, in parts joined by dots')
    expect(ownNameProblem(t, `${'a.'.repeat(126)}com`)).toBe('Letters, digits and hyphens, in parts joined by dots')
  })

  it('each record found, missing, or wrong: what DNS answered instead', () => {
    expect(records(true, null, 'other.example.net').map(recordState)).toEqual(['found', 'missing', 'wrong'])
  })

  it('its certificate issued and renewed, not yet, or not issued; a move’s, the name’s or remote.it’s after', () => {
    expect(ownCertificateLine(t, 'ready')).toBe('Issued: remote.it renews it')
    expect(ownCertificateLine(t, 'pending')).toBe(
      'Not issued yet: until it is, its https endpoints under it are not served'
    )
    expect(ownCertificateLine(t, 'failed')).toBe('Not issued: until it is, its https endpoints under it are not served')
    const name = 'office.example.com'
    expect(moveCertificateLine(t, 'verify', 'ready', name)).toBe(
      'Its https endpoints are served with the certificate for office.example.com.'
    )
    expect(moveCertificateLine(t, 'verify', 'pending', name)).toBe(
      'The certificate for office.example.com is not issued yet: until it is, its https endpoints are not served.'
    )
    expect(moveCertificateLine(t, 'verify', 'failed', name)).toBe(
      'The certificate for office.example.com could not be issued: until it is, its https endpoints are not served.'
    )
    expect(moveCertificateLine(t, 'remove', 'ready', name)).toBe(
      'Its https endpoints are served with remote.it’s certificate for every proxy name.'
    )
    expect(moveCertificateLine(t, 'remove', 'pending', name)).toBe(
      'remote.it’s certificate for every proxy name is not issued yet: until it is, its https endpoints are not served.'
    )
  })
})

describe('no own name yet', () => {
  it('a name to enter under a domain you control, said in one line; nothing to check, move or remove', async () => {
    await render(GATEWAY)
    expect(section()).toBe('none')
    expect($('[data-own-name]')?.textContent).toContain('Own name')
    expect(inline[LABEL].value).toBe('')
    expect(inline[LABEL].placeholder).toBe('none: a name under your domain, as office.example.com')
    expect(inline[LABEL].maxLength).toBe(253)
    expect('Pi_1 .Example.com'.replace(inline[LABEL].filter, '')).toBe('Pi1.Example.com')
    expect($('[data-own-name]')?.textContent).toContain(HINT)
    expect(stateLine()).toBeNull()
    expect(checkNow()).toBeNull()
    expect($('[data-own-name-records]')).toBeNull()
    for (const icon of ['circle-arrow-right', 'rotate-left', 'file-certificate']) expect(setting(icon)).toBeNull()
  })

  it('a name is checked as it is typed, as it is saved: any case, a trailing dot; empty is none', async () => {
    await render(GATEWAY)
    expect(inline[LABEL].validate('Office.Example.com.')).toBeUndefined()
    expect(inline[LABEL].validate('example.com')).toBe(
      'A name under your domain, as office.example.com: not the domain itself'
    )
    expect(inline[LABEL].validate('')).toBeUndefined()
  })

  it('claimed — trimmed, lower case, its trailing dot dropped —, then read again to show its records', async () => {
    readAgain.mockReturnValue(PENDING)
    setName.mockResolvedValue(PENDING.ownName)
    await render(GATEWAY)
    await act(async () => inline[LABEL].onSave(' Office.Example.com. '))
    expect(setName).toHaveBeenCalledWith('P1', 'office.example.com')
    expect(busyCalls).toEqual([true, false])
    expect(readAgain).toHaveBeenCalledTimes(1)
    expect(section()).toBe('pending')
    expect(inline[LABEL].value).toBe('office.example.com')
    expect(rows()).toHaveLength(3)
    expect($('[data-notice]')).toBeNull()
  })

  it('nothing typed is nothing asked', async () => {
    await render(GATEWAY)
    await act(async () => inline[LABEL].onSave('  '))
    expect(setName).not.toHaveBeenCalled()
    expect($('[data-confirm]')).toBeNull()
  })

  it('a claim refused is said in graphql’s words, or that it was not set; its notice closes', async () => {
    setName.mockResolvedValue({ reason: 'R3proxy.com is remote.it’s: use a name under a domain you control' })
    await render(GATEWAY)
    await act(async () => inline[LABEL].onSave('gw.r3proxy.com'))
    expect($('[data-notice="error"]')?.textContent).toBe(
      'R3proxy.com is remote.it’s: use a name under a domain you control'
    )
    expect(readAgain).toHaveBeenCalledTimes(1)
    setName.mockResolvedValue({ reason: '' })
    await act(async () => inline[LABEL].onSave('office.example.com'))
    expect($('[data-notice="error"]')?.textContent).toBe('It was not set: try again.')
    await click($('[data-notice] [data-close]'))
    expect($('[data-notice]')).toBeNull()
  })
})

describe('pending', () => {
  it('how many of its records are found; each with copy buttons and what was found — found, missing, or wrong', async () => {
    await render(PENDING)
    expect(section()).toBe('pending')
    expect(label('hourglass')).toBe('Pending: 1 of 3 records found')
    expect(setting('hourglass')?.getAttribute('data-color')).toBe('warning')
    expect(sublabel('hourglass')).toBe('Add them, then check them · Checked 2026-11-08T23:00:00.000Z')
    expect(rows()).toEqual([
      ['office.example.com', 'found', 'Found'],
      ['*.office.example.com', 'missing', 'Missing'],
      ['_acme-challenge.office.example.com', 'wrong', 'Wrong: answers other.example.net'],
    ])
    const row = $('[data-record="_acme-challenge.office.example.com"]')!
    expect(
      [...row.querySelectorAll('[data-copy]')].map(copy => [copy.getAttribute('data-copy'), copy.getAttribute('title')])
    ).toEqual([
      ['_acme-challenge.office.example.com', 'Copy the name'],
      [TOKEN, 'Copy the value'],
    ])
    expect(row.textContent).toContain('CNAME')
    expect([...document.body.querySelectorAll('[data-own-name-records] th')].map(th => th.textContent)).toEqual([
      'Name',
      'Type',
      'Value',
      'State',
    ])
    expect($('[data-own-name]')?.textContent).toContain(HINT)
    expect(checkNow()).not.toBeNull()
    expect(label('rotate-left')).toBe('Remove its own name')
    expect(setting('circle-arrow-right')).toBeNull()
    expect(setting('file-certificate')).toBeNull()
    // Not served under it: its name may still be changed.
    expect(inline[LABEL].value).toBe('office.example.com')
  })

  it('never checked, says so; a problem graphql says is said with it', async () => {
    await render(named('pending', { checked: null, problem: 'office.example.com does not resolve' }))
    expect(sublabel('hourglass')).toBe(
      'Add them, then check them · office.example.com does not resolve · Not checked yet'
    )
  })

  it('another name in its place is claimed anew; the same one is no change', async () => {
    await render(PENDING)
    await act(async () => inline[LABEL].onSave('office.example.com'))
    expect(setName).not.toHaveBeenCalled()
    await act(async () => inline[LABEL].onSave('gw.example.com'))
    expect(setName).toHaveBeenCalledWith('P1', 'gw.example.com')
  })

  it('Check now: its records checked at once and read again; still not all found, nothing more is asked', async () => {
    readAgain.mockReturnValue(named('pending', { records: records(true, true, null) }))
    await render(PENDING)
    await click(checkNow())
    expect(verify).toHaveBeenCalledWith('P1', false)
    expect(verify).toHaveBeenCalledTimes(1)
    expect(readAgain).toHaveBeenCalledTimes(1)
    expect(busyCalls).toEqual([true, false])
    expect(label('hourglass')).toBe('Pending: 2 of 3 records found')
    expect($('[data-confirm]')).toBeNull()
  })

  it('a check refused is said in graphql’s words, the records read again; one with none says they could not be checked', async () => {
    verify.mockResolvedValue({ reason: 'office.example.com’s records could not be looked up: try again' })
    await render(PENDING)
    await click(checkNow())
    expect($('[data-notice="error"]')?.textContent).toBe(
      'office.example.com’s records could not be looked up: try again'
    )
    expect(readAgain).toHaveBeenCalledTimes(1)
    expect($('[data-confirm]')).toBeNull()
    verify.mockResolvedValue({ reason: '' })
    await click(checkNow())
    expect($('[data-notice="error"]')?.textContent).toBe('Its records could not be checked: try again.')
  })

  it('Check now finding them all right: what moves said from its answer, not asked again, and moved once confirmed', async () => {
    readAgain.mockReturnValue(VERIFIED)
    await render(PENDING)
    await click(checkNow())
    expect(section()).toBe('verified')
    expect($('[data-confirm-title]')?.textContent).toBe('Move Gateway under office.example.com?')
    expect($('[data-own-name-certificate]')?.textContent).toBe(
      'The certificate for office.example.com is not issued yet: until it is, its https endpoints are not served.'
    )
    expect(preview()).toEqual([
      ['https://ep1.office.example.com', 'was https://ep1-acme-corp.dev.r3proxy.com'],
      ['office.example.com:30001', 'was gw-acme-corp.dev.r3proxy.com:30001'],
    ])
    expect(verify).toHaveBeenCalledTimes(1)
    expect($('[data-confirm-action]')?.textContent).toBe('Move')
    expect(($('[data-confirm-action]') as HTMLButtonElement).disabled).toBe(false)

    verify.mockResolvedValue({ ...MOVE, applied: true })
    readAgain.mockReturnValue(ACTIVE)
    await click($('[data-confirm-action]'))
    expect(verify).toHaveBeenLastCalledWith('P1', true)
    expect($('[data-confirm]')).toBeNull()
    expect(section()).toBe('active')
  })
})

describe('verified', () => {
  it('its records right: the move offered, said first — asked now —, then made', async () => {
    verify.mockResolvedValue({ ...MOVE, certificate: 'ready' })
    await render(VERIFIED)
    expect(label('badge-check')).toBe('Verified: its records are right')
    expect(setting('badge-check')?.getAttribute('data-color')).toBe('success')
    expect(sublabel('badge-check')).toBe(
      'Its addresses move under it once you confirm · Checked 2026-11-08T23:00:00.000Z'
    )
    expect(rows().map(([, state]) => state)).toEqual(['found', 'found', 'found'])
    expect(label('circle-arrow-right')).toBe('Move its addresses under office.example.com')
    expect(sublabel('circle-arrow-right')).toBe('What moves is said first')
    await click(settingButton('circle-arrow-right'))
    expect(verify).toHaveBeenCalledWith('P1', false)
    expect($('[data-own-name-certificate]')?.textContent).toBe(
      'Its https endpoints are served with the certificate for office.example.com.'
    )
    expect(preview()).toHaveLength(2)
    readAgain.mockReturnValue(ACTIVE)
    await click($('[data-confirm-action]'))
    expect(verify).toHaveBeenLastCalledWith('P1', true)
    expect(section()).toBe('active')
  })

  it('a move refused as it is made is said in graphql’s words, nothing moved and the dialog kept; with none, that nothing was', async () => {
    await render(VERIFIED)
    await click(settingButton('circle-arrow-right'))
    verify.mockResolvedValue({ reason: '_acme-challenge.office.example.com is gone: check its records again' })
    await click($('[data-confirm-action]'))
    expect($('[data-confirm] [data-notice="error"]')?.textContent).toBe(
      '_acme-challenge.office.example.com is gone: check its records again'
    )
    expect(($('[data-confirm-action]') as HTMLButtonElement).disabled).toBe(true)
    expect(readAgain).not.toHaveBeenCalled()
    await click($('[data-deny]'))
    expect($('[data-confirm]')).toBeNull()
    verify.mockResolvedValueOnce({ ...MOVE }).mockResolvedValueOnce({ reason: '' })
    await click(settingButton('circle-arrow-right'))
    expect($('[data-confirm] [data-notice]')).toBeNull()
    await click($('[data-confirm-action]'))
    expect($('[data-confirm] [data-notice="error"]')?.textContent).toBe('Nothing was moved: try again.')
  })

  it('what the move would do not said: in graphql’s words, or that it could not be, and nothing to confirm', async () => {
    verify.mockResolvedValue({ reason: 'office.example.com’s records changed: check them again' })
    await render(VERIFIED)
    await click(settingButton('circle-arrow-right'))
    expect($('[data-confirm] [data-notice="error"]')?.textContent).toBe(
      'office.example.com’s records changed: check them again'
    )
    expect(($('[data-confirm-action]') as HTMLButtonElement).disabled).toBe(true)
    await click($('[data-deny]'))
    verify.mockResolvedValue({ reason: '' })
    await click(settingButton('circle-arrow-right'))
    expect($('[data-confirm] [data-notice="error"]')?.textContent).toBe(
      'What it would do could not be said: try again.'
    )
  })

  it('said, while it is still being asked', async () => {
    const answer = held<any>()
    verify.mockReturnValue(answer.promise)
    await render(VERIFIED)
    await click(settingButton('circle-arrow-right'))
    expect($('[data-confirm] [data-loading]')).not.toBeNull()
    expect(($('[data-confirm-action]') as HTMLButtonElement).disabled).toBe(true)
    await act(async () => answer.release(MOVE))
    expect($('[data-loading]')).toBeNull()
    expect(preview()).toHaveLength(2)
  })
})

describe('active', () => {
  it('its name — another only once it is removed —, its certificate, and its records kept where its DNS is hosted', async () => {
    await render(ACTIVE)
    expect(section()).toBe('active')
    expect(inline[LABEL]).toBeUndefined()
    expect(label('earth-americas')).toBe('office.example.com')
    expect(sublabel('earth-americas')).toBe('Its own name: to use another, remove this one first')
    expect(label('circle-check')).toBe('Active: its endpoints are reached under it')
    expect(setting('circle-check')?.getAttribute('data-color')).toBe('success')
    expect(sublabel('circle-check')).toBe('Checked 2026-11-08T23:00:00.000Z')
    expect(label('file-certificate')).toBe('Issued: remote.it renews it')
    expect(sublabel('file-certificate')).toBe('Its certificate under office.example.com')
    expect(setting('file-certificate')?.getAttribute('data-color')).toBe('success')
    expect($('[data-own-name]')?.textContent).toContain(
      'Keep these records where your DNS is hosted: remote.it renews its certificate through them.'
    )
    expect($('[data-own-name]')?.textContent).not.toContain(HINT)
    expect(rows()).toHaveLength(3)
    expect(setting('circle-arrow-right')).toBeNull()
    expect(checkNow()).not.toBeNull()
    expect(label('rotate-left')).toBe('Remove its own name')
  })

  it('its certificate not issued yet, or not issued, with graphql’s problem', async () => {
    await render(named('active', { certificate: 'pending' }))
    expect(label('file-certificate')).toBe('Not issued yet: until it is, its https endpoints under it are not served')
    expect(setting('file-certificate')?.getAttribute('data-color')).toBe('warning')
    await render(named('active', { certificate: 'failed', problem: 'Let’s Encrypt refused the order: rate limited' }))
    expect(label('file-certificate')).toBe('Not issued: until it is, its https endpoints under it are not served')
    expect(setting('file-certificate')?.getAttribute('data-color')).toBe('danger')
    expect(sublabel('circle-check')).toBe(
      'Let’s Encrypt refused the order: rate limited · Checked 2026-11-08T23:00:00.000Z'
    )
    await render(named('active', { certificate: null }))
    expect(setting('file-certificate')).toBeNull()
  })

  it('Check now checks its records again, and asks nothing more', async () => {
    readAgain.mockReturnValue(ACTIVE)
    await render(ACTIVE)
    await click(checkNow())
    expect(verify).toHaveBeenCalledWith('P1', false)
    expect($('[data-confirm]')).toBeNull()
  })
})

describe('broken', () => {
  it('each record gone or wrong named, and its certificate’s renewal failing until they are right', async () => {
    await render(named('broken', { certificate: 'ready', records: records(true, null, 'other.example.net') }))
    expect(section()).toBe('broken')
    expect(label('triangle-exclamation')).toBe(
      'Broken: *.office.example.com is missing; _acme-challenge.office.example.com is wrong: it answers other.example.net'
    )
    expect(setting('triangle-exclamation')?.getAttribute('data-color')).toBe('danger')
    expect(sublabel('triangle-exclamation')).toBe(
      'It keeps serving until its certificate needs renewing, and the renewal fails until its records are right · Checked 2026-11-08T23:00:00.000Z'
    )
    expect(rows().map(([name, state]) => [name, state])).toEqual([
      ['office.example.com', 'found'],
      ['*.office.example.com', 'missing'],
      ['_acme-challenge.office.example.com', 'wrong'],
    ])
    expect(label('file-certificate')).toBe('Issued: remote.it renews it')
    expect(label('earth-americas')).toBe('office.example.com')
    expect(inline[LABEL]).toBeUndefined()
    expect($('[data-own-name]')?.textContent).toContain(HINT)
    expect(setting('circle-arrow-right')).toBeNull()
  })

  it('its records all found again, though graphql has not said so yet: broken, and why in its words', async () => {
    await render(named('broken', { problem: 'its certificate could not be renewed' }))
    expect(label('triangle-exclamation')).toBe('Broken')
    expect(sublabel('triangle-exclamation')).toContain('its certificate could not be renewed · Checked')
  })
})

describe('removing it', () => {
  it('what moves back to remote.it’s names said first, then removed, and the proxy read again', async () => {
    readAgain.mockReturnValue(GATEWAY)
    await render(ACTIVE)
    expect(sublabel('rotate-left')).toBe('What moves back to remote.it’s names is said first')
    await click(settingButton('rotate-left'))
    expect(remove).toHaveBeenCalledWith('P1', false)
    expect($('[data-confirm-title]')?.textContent).toBe('Remove office.example.com from Gateway?')
    expect($('[data-confirm-action]')?.textContent).toBe('Remove')
    expect($('[data-own-name-certificate]')?.textContent).toBe(
      'Its https endpoints are served with remote.it’s certificate for every proxy name.'
    )
    expect(preview()).toEqual([
      ['https://ep1-acme-corp.dev.r3proxy.com', 'was https://ep1.office.example.com'],
      ['gw-acme-corp.dev.r3proxy.com:30001', 'was office.example.com:30001'],
    ])
    await click($('[data-confirm-action]'))
    expect(remove).toHaveBeenLastCalledWith('P1', true)
    expect($('[data-confirm]')).toBeNull()
    expect(section()).toBe('none')
    expect(busyCalls).toEqual([true, false])
  })

  it('before anything moved: no address moves, and it is still removed; Cancel removes nothing', async () => {
    remove.mockResolvedValue({ addresses: [], certificate: 'ready', applied: false })
    await render(PENDING)
    await click(settingButton('rotate-left'))
    expect($('[data-confirm]')?.textContent).toContain('No endpoint address moves.')
    expect(($('[data-confirm-action]') as HTMLButtonElement).disabled).toBe(false)
    await click($('[data-deny]'))
    expect($('[data-confirm]')).toBeNull()
    expect(remove).not.toHaveBeenCalledWith('P1', true)
  })

  it('emptied, a name not yet served under is given up the same way: said first', async () => {
    await render(VERIFIED)
    await act(async () => inline[LABEL].onSave(''))
    expect(setName).not.toHaveBeenCalled()
    expect(remove).toHaveBeenCalledWith('P1', false)
    expect($('[data-confirm-title]')?.textContent).toBe('Remove office.example.com from Gateway?')
  })

  it('a removal refused as it is made is said in graphql’s words, and nothing moves', async () => {
    await render(ACTIVE)
    await click(settingButton('rotate-left'))
    remove.mockResolvedValue({ reason: 'Gw-acme-corp.dev.r3proxy.com is being renamed: try again' })
    await click($('[data-confirm-action]'))
    expect($('[data-confirm] [data-notice="error"]')?.textContent).toBe(
      'Gw-acme-corp.dev.r3proxy.com is being renamed: try again'
    )
    expect(readAgain).not.toHaveBeenCalled()
    expect(section()).toBe('active')
  })
})

describe('while one change is being made', () => {
  it('nothing else can be: its name, Check now, the move and Remove wait', async () => {
    const answer = held<any>()
    verify.mockReturnValue(answer.promise)
    await render(VERIFIED)
    await act(async () => {
      void checkNow()!.click()
    })
    expect(inline[LABEL].disabled).toBe(true)
    expect(checkNow()!.disabled).toBe(true)
    expect(settingButton('circle-arrow-right')!.disabled).toBe(true)
    expect(settingButton('rotate-left')!.disabled).toBe(true)
    await act(async () => answer.release({ reason: 'try again' }))
    expect(inline[LABEL].disabled).toBe(false)
    expect(checkNow()!.disabled).toBe(false)
    expect(settingButton('rotate-left')!.disabled).toBe(false)
  })
})
