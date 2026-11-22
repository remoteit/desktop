import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { read, claim, rename, addKey, revoke, state, requestDomain, verifyDomain, removeDomain } = vi.hoisted(() => ({
  requestDomain: vi.fn(),
  verifyDomain: vi.fn(),
  removeDomain: vi.fn(),
  read: vi.fn(),
  claim: vi.fn(),
  rename: vi.fn(),
  addKey: vi.fn(),
  revoke: vi.fn(),
  state: { value: { user: { id: 'U1' }, active: 'U1' } },
}))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLGetErrors: vi.fn(), graphQLRequestWithReason: vi.fn(), refusalOf: vi.fn() }))
vi.mock('../services/graphQLAppPublishers', async importOriginal => ({
  ...(await importOriginal<any>()),
  graphQLAppPublisher: read,
  graphQLClaimAppPublisher: claim,
  graphQLRenameAppPublisher: rename,
  graphQLAddAppPublisherKey: addKey,
  graphQLRevokeAppPublisherKey: revoke,
  graphQLRequestAppPublisherDomain: requestDomain,
  graphQLVerifyAppPublisherDomain: verifyDomain,
  graphQLRemoveAppPublisherDomain: removeDomain,
}))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select(state.value) }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: (s: any) => s.active }))
vi.mock('../components/Container', () => ({ Container: ({ header, children }: any) => <div>{header}{children}</div> }))
vi.mock('../components/Title', () => ({ Title: ({ children }: any) => <span>{children}</span> }))
vi.mock('../components/Gutters', () => ({ Gutters: ({ children, ...rest }: any) => <div {...rest}>{children}</div> }))
vi.mock('../components/Notice', () => ({ Notice: ({ children, severity }: any) => <div data-notice={severity}>{children}</div> }))
vi.mock('../components/Confirm', () => ({
  Confirm: ({ open, title, children, onConfirm }: any) =>
    open ? (
      <div data-confirm>
        <span data-confirm-title>{title}</span>
        {children}
        <button data-confirm-ok onClick={onConfirm} />
      </div>
    ) : null,
}))
// The signer frame stands in for signer.html: a button that answers as the signer does, with a key's public half.
const MADE = { publicKey: 'A'.repeat(43) + '=', keyId: 'aaaaaaaaaaaaaaaa' }
vi.mock('../components/SignerFrame', () => ({
  useCreateLabels: () => ({}),
  SignerFrame: ({ request, onCreated }: any) => (
    <button data-signer={request.type} data-signer-publisher={request.publisher} onClick={() => onCreated(MADE)} />
  ),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { PublisherPage } from './PublisherPage'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const KEY = { keyId: '0123456789abcdef', publicKey: 'x', notAfter: '2027-11-13T00:00:00.000Z', added: '2026-11-13T00:00:00.000Z', revoked: null }
const acme = (more: any = {}) => ({
  id: 'acme',
  name: 'Acme',
  verifiedDomain: null,
  created: '2026-11-13T00:00:00.000Z',
  keys: [KEY],
  apps: [
    {
      id: 'acme.backup',
      name: 'Backup',
      description: 'Nightly',
      visibility: 'private',
      releases: [
        { version: '1.1.0', manifest: 'm', root: false, keyId: KEY.keyId, created: '2026-11-13', withdrawn: null },
        { version: '1.0.0', manifest: 'm', root: true, keyId: 'ffffffffffffffff', created: '2026-11-12', withdrawn: '2026-11-13' },
      ],
      channels: [{ stage: 'solo', channel: 'stable', current: '1.1.0' }],
    },
  ],
  ...more,
})

let root: Root
let container: HTMLElement
async function render() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<PublisherPage />))
  return container
}
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})
beforeEach(() => {
  for (const fn of [read, claim, rename, addKey, revoke, requestDomain, verifyDomain, removeDomain]) fn.mockReset()
  state.value = { user: { id: 'U1' }, active: 'U1' }
  read.mockResolvedValue({ publisher: acme(), publishing: { certifies: true, downloads: null } })
})

const type = async (input: Element | null, text: string) =>
  act(async () => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    set.call(input, text)
    input!.dispatchEvent(new Event('input', { bubbles: true }))
  })
const click = (el: Element | null) => act(async () => (el as HTMLElement).click())

describe('the account’s app publisher', () => {
  it('unclaimed: says how ids work, and claims one for the account in use — an organization’s by its id', async () => {
    state.value = { user: { id: 'U1' }, active: 'ORG1' }
    read.mockResolvedValue({ publisher: null, publishing: { certifies: true, downloads: null } })
    claim.mockResolvedValue({ publisher: acme() })
    const page = await render()
    expect(read).toHaveBeenCalledWith('ORG1')
    expect(page.querySelector('[data-publisher-claim]')?.textContent).toContain('first come, first served')
    const button = page.querySelector('[data-claim]') as HTMLButtonElement
    expect(button.disabled).toBe(true)
    await type(page.querySelector('[data-claim-id]'), 'Acme')
    await type(page.querySelector('[data-claim-name]'), 'Acme Labs')
    await click(button)
    expect(claim).toHaveBeenCalledWith('acme', 'Acme Labs', 'ORG1')
    expect(page.querySelector('[data-publisher="acme"]')).not.toBeNull()
  })

  it('a refusal in graphql’s words: a reserved or taken id', async () => {
    read.mockResolvedValue({ publisher: null, publishing: { certifies: true, downloads: null } })
    claim.mockResolvedValue({ reason: 'Remoteit is reserved' })
    const page = await render()
    await type(page.querySelector('[data-claim-id]'), 'remoteit')
    await type(page.querySelector('[data-claim-name]'), 'x')
    await click(page.querySelector('[data-claim]'))
    expect(claim).toHaveBeenCalledWith('remoteit', 'x', undefined)
    expect(page.querySelector('[data-notice="error"]')?.textContent).toBe('Remoteit is reserved')
  })

  it('its keys, apps and releases: who signed each, withdrawn ones said, its channels', async () => {
    const page = await render()
    expect(page.textContent).toContain('Your apps are acme.<app>')
    expect(page.querySelector('[data-key="0123456789abcdef"]')?.textContent).toContain('certified until')
    const app = page.querySelector('[data-publisher-app="acme.backup"]')!
    expect(app.textContent).toContain('Backup (acme.backup)')
    expect(app.textContent).toContain('solo stable 1.1.0')
    expect(app.querySelector('[data-release="1.1.0"]')?.textContent).toBe('1.1.0 · restricted · signed by 0123456789abcdef')
    expect(app.querySelector('[data-release="1.0.0"]')?.textContent).toBe('1.0.0 · full control · signed by ffffffffffffffff · withdrawn')
    expect(page.querySelector('[data-publisher-verified]')).toBeNull()
  })

  it('adds a key; revoking one says which releases it withdraws first', async () => {
    addKey.mockResolvedValue({ publisher: acme() })
    revoke.mockResolvedValue({ publisher: acme({ keys: [{ ...KEY, revoked: '2026-11-14T00:00:00.000Z' }] }) })
    const page = await render()
    await type(page.querySelector('[data-new-key]'), '4H5Q25aUDlEiakD66DHUzkgAPIr2oPOr6c2pZQPLmao=')
    await click(page.querySelector('[data-add-key]'))
    expect(addKey).toHaveBeenCalledWith('4H5Q25aUDlEiakD66DHUzkgAPIr2oPOr6c2pZQPLmao=', undefined)
    await click(page.querySelector('[data-revoke="0123456789abcdef"]'))
    expect(page.querySelector('[data-revoke-withdraws]')?.textContent).toMatch(/the 1 release\(s\) it signed are withdrawn/)
    await click(page.querySelector('[data-confirm-ok]'))
    expect(revoke).toHaveBeenCalledWith('0123456789abcdef', undefined)
    expect(page.querySelector('[data-key="0123456789abcdef"]')?.textContent).toContain('Revoked')
    expect(page.querySelector('[data-revoke]')).toBeNull()
  })

  it('creates a key in the signer, registers its public half, and says to keep the file', async () => {
    addKey.mockResolvedValue({ publisher: acme({ keys: [KEY, { ...KEY, keyId: MADE.keyId }] }) })
    const page = await render()
    await click(page.querySelector('[data-create-key]'))
    const signer = document.querySelector('[data-signer="create"]')
    expect(signer?.getAttribute('data-signer-publisher')).toBe('acme')
    await click(signer)
    expect(addKey).toHaveBeenCalledWith(MADE.publicKey, undefined)
    expect(page.querySelector(`[data-key-kept="${MADE.keyId}"]`)?.textContent).toContain('Remote.It cannot recover either')
    expect(page.querySelector(`[data-key="${MADE.keyId}"]`)).not.toBeNull()
  })

  it('a key made but not registered says so, and registers it again on Try again', async () => {
    addKey.mockResolvedValueOnce({ reason: 'at most 8 standing keys' }).mockResolvedValueOnce({ publisher: acme() })
    const page = await render()
    await click(page.querySelector('[data-create-key]'))
    await click(document.querySelector('[data-signer="create"]'))
    expect(document.querySelector(`[data-registering="${MADE.keyId}"]`)?.textContent).toContain('not registered yet')
    expect(document.querySelector('[data-create-key-dialog] [data-notice="error"]')?.textContent).toBe('at most 8 standing keys')
    await click(document.querySelector('[data-register-again]'))
    expect(addKey).toHaveBeenCalledTimes(2)
    expect(addKey).toHaveBeenLastCalledWith(MADE.publicKey, undefined)
    expect(page.querySelector(`[data-key-kept="${MADE.keyId}"]`)).not.toBeNull()
  })

  it('renamed; a stage that certifies no key says so; an API without publishers, too', async () => {
    rename.mockResolvedValue({ publisher: acme({ name: 'Acme Inc' }) })
    read.mockResolvedValue({ publisher: acme(), publishing: { certifies: false, downloads: null } })
    let page = await render()
    expect(page.querySelector('[data-notice="warning"]')?.textContent).toMatch(/cannot certify keys/)
    await click(page.querySelector('[data-rename]'))
    await type(page.querySelector('[data-rename-name]'), 'Acme Inc')
    await click(page.querySelector('[data-rename-save]'))
    expect(rename).toHaveBeenCalledWith('Acme Inc', undefined)
    expect(page.querySelector('[data-publisher] h2')?.textContent).toBe('Acme Inc')
    act(() => root.unmount())
    container.remove()
    read.mockResolvedValue(undefined)
    page = await render()
    expect(page.querySelector('[data-notice="info"]')?.textContent).toBe('Publishing apps is not available here.')
  })
})

describe('build step 8: a verified domain', () => {
  const pending = { domain: 'acme.com', record: '_remoteit-publisher.acme.com', value: 'remoteit-publisher=acme:0123', requested: '2026-11-13', verified: null, checked: null, lapsed: null }

  it('added: the TXT record to add shown; Verify looks it up, and the publisher shows Verified: acme.com', async () => {
    read.mockResolvedValue({ publisher: acme({ domains: [] }), publishing: { certifies: true, downloads: null } })
    requestDomain.mockResolvedValue({ publisher: acme({ domains: [pending] }) })
    verifyDomain.mockResolvedValue({ publisher: acme({ verifiedDomain: 'acme.com', domains: [{ ...pending, verified: '2026-11-13', checked: '2026-11-13' }] }) })
    const page = await render()
    await type(page.querySelector('[data-new-domain]'), 'Acme.com')
    await click(page.querySelector('[data-add-domain]'))
    expect(requestDomain).toHaveBeenCalledWith('acme.com', undefined)
    expect(page.querySelector('[data-domain-record="acme.com"]')?.textContent).toBe('_remoteit-publisher.acme.com TXT "remoteit-publisher=acme:0123"')
    await click(page.querySelector('[data-verify="acme.com"]'))
    expect(verifyDomain).toHaveBeenCalledWith('acme.com', undefined)
    expect(page.querySelector('[data-publisher-verified]')?.textContent).toBe('Verified: acme.com')
    expect(page.querySelector('[data-domain="acme.com"]')?.textContent).toContain('checked daily')
    expect(page.querySelector('[data-domain-record]')).toBeNull()
    expect(page.querySelector('[data-verify]')).toBeNull()
  })

  it('a lapsed one says why and offers Verify again; removed', async () => {
    read.mockResolvedValue({ publisher: acme({ domains: [{ ...pending, verified: '2026-11-01', lapsed: '2026-11-13' }] }), publishing: { certifies: true, downloads: null } })
    removeDomain.mockResolvedValue({ publisher: acme({ domains: [] }) })
    const page = await render()
    expect(page.querySelector('[data-domain="acme.com"]')?.textContent).toMatch(/Lapsed .*gone for three days/)
    expect(page.querySelector('[data-verify="acme.com"]')).not.toBeNull()
    await click(page.querySelector('[data-remove-domain="acme.com"]'))
    expect(removeDomain).toHaveBeenCalledWith('acme.com', undefined)
    expect(page.querySelector('[data-domain]')).toBeNull()
  })

  it('a refusal said: the record not found yet, or another publisher\'s domain', async () => {
    read.mockResolvedValue({ publisher: acme({ domains: [pending] }), publishing: { certifies: true, downloads: null } })
    verifyDomain.mockResolvedValue({ reason: 'No TXT record _remoteit-publisher.acme.com was found yet' })
    const page = await render()
    await click(page.querySelector('[data-verify="acme.com"]'))
    expect(page.querySelector('[data-notice="error"]')?.textContent).toMatch(/was found yet/)
  })
})
