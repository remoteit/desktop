import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { MemoryRouter, Route } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { read, state, build } = vi.hoisted(() => ({
  read: vi.fn(),
  build: vi.fn(),
  state: { value: { user: { id: 'U1' }, active: 'U1' } },
}))
vi.mock('../helpers/appRelease', async importOriginal => ({ ...(await importOriginal<any>()), buildRelease: build }))
// Review and sign stands in: a click publishes.
vi.mock('../components/NewAppPublish', () => ({
  NewAppPublish: ({ built, onPublished }: any) => (
    <button
      data-new-app-review={built.manifest.app}
      onClick={() => onPublished({ manifest: 'https://d/m', devices: 1 })}
    />
  ),
}))
vi.mock('../services/graphQLAppPublishers', () => ({ graphQLAppPublisher: read }))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select(state.value) }))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: (s: any) => s.active }))
vi.mock('../components/Container', () => ({
  Container: ({ header, children }: any) => (
    <div>
      {header}
      {children}
    </div>
  ),
}))
vi.mock('../components/Title', () => ({ Title: ({ children }: any) => <span>{children}</span> }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('../components/Icon', () => ({ Icon: () => <i /> }))
vi.mock('../components/Notice', () => ({
  Notice: ({ children, severity, button }: any) => (
    <div data-notice={severity}>
      {children}
      {button}
    </div>
  ),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { NewAppPage } from './NewAppPage'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

/* New app: needs a publisher, warns without a key, and says as the form changes whether remote.it takes the manifest —
   in the contract's own words —, refusing an id the publisher has already published. */

const KEY = { keyId: '0123456789abcdef', publicKey: 'x', notAfter: null, added: '2026-11-13', revoked: null }
const acme = (more: any = {}) => ({
  id: 'acme',
  name: 'Acme',
  verifiedDomain: null,
  created: '',
  keys: [KEY],
  apps: [{ id: 'acme.backup' }],
  ...more,
})

let root: Root
let container: HTMLElement
async function render() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={['/apps/new']} getUserConfirmation={(_message, answer) => answer(true)}>
        <NewAppPage />
        <Route path="*" render={({ location }) => <div data-location={location.pathname} />} />
      </MemoryRouter>
    )
  )
  return container
}
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})
beforeEach(() => {
  build.mockReset()
  read.mockReset()
  read.mockResolvedValue({
    publisher: acme(),
    publishing: { certifies: true, downloads: 'https://downloads.test', fileMax: 16 << 20 },
  })
})

const type = async (input: Element | null, text: string) =>
  act(async () => {
    const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(input, text)
    input!.dispatchEvent(new Event('input', { bubbles: true }))
  })

describe('New app', () => {
  it('without a publisher, sends the person to claim one', async () => {
    read.mockResolvedValue({ publisher: null, publishing: { certifies: true, downloads: null } })
    const page = await render()
    expect(page.querySelector('[data-new-app-claim]')).not.toBeNull()
    expect(page.querySelector('[data-new-app-form]')).toBeNull()
  })

  it('without a standing key, says to create one', async () => {
    read.mockResolvedValue({
      publisher: acme({ keys: [{ ...KEY, revoked: '2026-11-14' }] }),
      publishing: { certifies: true, downloads: null },
    })
    const page = await render()
    expect(page.querySelector('[data-new-app-no-key]')).not.toBeNull()
  })

  it('checks the manifest as the form changes, in the contract’s words', async () => {
    const page = await render()
    expect(page.querySelector('[data-manifest-problems]')).not.toBeNull()
    await type(page.querySelector('[data-field-id]'), 'Panel')
    await type(page.querySelector('[data-field-name]'), 'Panel')
    await type(page.querySelector('[data-field-command]'), 'bin/panel')
    await type(page.querySelector('[data-field-args]'), '${remoteit.port}')
    expect(page.querySelector('[data-manifest-ok]')).not.toBeNull()
    expect(JSON.parse(page.querySelector('[data-manifest-preview]')!.textContent!)).toMatchObject({
      contract: 1,
      app: 'acme.panel',
      run: { command: 'bin/panel', args: ['${remoteit.port}'] },
      listen: { type: 'tcp' },
      service: { name: 'Panel', protocol: 'http' },
    })
    await type(page.querySelector('[data-field-args]'), '${setting.title}')
    expect(page.querySelector('[data-manifest-problems]')?.textContent).toBe(
      'the manifest: ${setting.title} is not a declared setting'
    )
  })

  it('refuses an id the publisher has published', async () => {
    const page = await render()
    await type(page.querySelector('[data-field-id]'), 'backup')
    await type(page.querySelector('[data-field-command]'), 'bin/backup')
    expect(page.querySelector('[data-new-app-check]')?.textContent).toContain('You have published acme.backup already')
  })

  it('takes any contract-1 manifest as JSON, checked the same way', async () => {
    const page = await render()
    await act(async () => (page.querySelector('[data-edit-json]') as HTMLElement).click())
    const editor = page.querySelector('[data-manifest-json]') as HTMLTextAreaElement
    expect(JSON.parse(editor.value)).toMatchObject({ contract: 1, version: '1.0.0' })
    await type(editor, '{')
    expect(page.querySelector('[data-manifest-problems]')?.textContent).toMatch(/^Not JSON/)
    const named = {
      contract: 1,
      app: 'acme.cam',
      version: '1.0.0',
      run: { command: 'cam', args: ['${remoteit.listen.web.port}'] },
      listen: { web: { type: 'tcp', port: 8080 }, rtsp: { type: 'tcp', port: 8554 } },
      service: [
        { name: 'Web', protocol: 'http', listen: 'web' },
        { name: 'Stream', protocol: 'tcp', listen: 'rtsp' },
      ],
    }
    await type(editor, JSON.stringify(named))
    expect(page.querySelector('[data-manifest-ok]')).not.toBeNull()
    await type(editor, JSON.stringify({ ...named, app: 'other.cam' }))
    expect(page.querySelector('[data-new-app-check]')?.textContent).toContain('starts with your publisher id')
  })
})

describe('New app, files to Done', () => {
  const describePanel = async (page: HTMLElement) => {
    await type(page.querySelector('[data-field-id]'), 'panel')
    await type(page.querySelector('[data-field-name]'), 'Panel')
    await type(page.querySelector('[data-field-command]'), 'bin/panel')
    await type(page.querySelector('[data-field-args]'), '${remoteit.port}')
    await act(async () => (page.querySelector('[data-new-app-continue]') as HTMLElement).click())
  }

  it('packs the chosen platforms’ files, then reviews, publishes, and offers Add to a device', async () => {
    const page = await render()
    await describePanel(page)
    expect(page.querySelector('[data-new-app-files]')).not.toBeNull()
    // A stock tool's platforms only where the manifest runs something: one command, every OS offered.
    expect(page.querySelector('[data-platform="windows-amd64"]')).not.toBeNull()
    await act(async () => (page.querySelector('[data-platform-chosen="linux-arm64"]') as HTMLElement).click())
    await act(async () => (page.querySelector('[data-new-app-pack]') as HTMLElement).click())
    expect(page.querySelector('[data-pack-refusal]')?.textContent).toBe('linux-arm64: no files yet')
    const program = new File(['#!/bin/sh'], 'panel')
    const input = page.querySelector('[data-platform-input="linux-arm64"]') as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [program], configurable: true })
    await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })))
    build.mockResolvedValue({
      manifest: { app: 'acme.panel', version: '1.0.0' },
      text: '',
      bytes: new Uint8Array(),
      archives: [],
    })
    await act(async () => (page.querySelector('[data-new-app-pack]') as HTMLElement).click())
    expect(build.mock.calls[0][1]).toEqual({ 'linux-arm64': { kind: 'program', file: program } })
    expect(build.mock.calls[0][2]).toBe(16 << 20)
    await act(async () => (page.querySelector('[data-new-app-review="acme.panel"]') as HTMLElement).click())
    expect(page.querySelector('[data-new-app-done]')?.textContent).toContain('acme.panel 1.0.0 is published')
    await act(async () => (page.querySelector('[data-new-app-add]') as HTMLElement).click())
    expect(page.querySelector('[data-location]')?.getAttribute('data-location')).toBe('/apps/acme.panel/add')
  })

  it('a release that cannot be packed says why in words', async () => {
    const { ReleaseRefused } = await import('../helpers/appRelease')
    const page = await render()
    await describePanel(page)
    await act(async () => (page.querySelector('[data-platform-chosen="any"]') as HTMLElement).click())
    const input = page.querySelector('[data-platform-input="any"]') as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [new File(['x'], 'panel')], configurable: true })
    await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })))
    build.mockRejectedValue(new ReleaseRefused('tooBig', { platform: 'any', mb: '18.4', most: '16' }))
    await act(async () => (page.querySelector('[data-new-app-pack]') as HTMLElement).click())
    expect(page.querySelector('[data-pack-refusal]')?.textContent).toBe(
      'any: the archive is 18.4 MB; remote.it takes at most 16 MB a file'
    )
  })
})
