import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { setApp, setAppSetting, catalog } = vi.hoisted(() => ({ setApp: vi.fn(), setAppSetting: vi.fn(), catalog: vi.fn() }))
// The release a consent names is read from its catalogue entry; unserved by default: the app's own.
vi.mock('../services/graphQLAppCatalog', () => ({ graphQLCatalogApp: catalog }))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({
  graphQLGetErrors: vi.fn(),
  graphQLRequestWithReason: vi.fn(),
  graphQLBasicRequest: vi.fn(),
}))
vi.mock('../services/productPolicy', async importOriginal => ({
  ...(await importOriginal<typeof import('../services/productPolicy')>()),
  graphQLSetDeviceProductApp: setApp,
  graphQLSetDeviceProductAppSetting: setAppSetting,
}))
vi.mock('../hooks/useDeviceSettings', () => ({ useDeviceSettings: () => ({ setting: () => undefined }) }))
// The console's own words come with its part of the device page, which reaches for the local subnet and the terminal.
vi.mock('../hooks/useLocalSubnetName', () => ({ useSubnetName: () => undefined }))
vi.mock('../helpers/terminalHelper', () => ({ inApp: () => false, openTerminal: vi.fn(), terminalReaches: () => true }))
vi.mock('./SelectSetting', () => ({
  SelectSetting: ({ label, value, values, disabled, helperText, onChange, ...props }: any) => (
    <div
      data-select={label}
      data-value={value}
      data-disabled={String(!!disabled)}
      data-on={props['data-product-app-state']}
      data-setting={props['data-product-app-setting']}
    >
      {values.map((v: any) => (
        <button key={v.key} data-choice={v.key} onClick={() => onChange(v.key)}>
          {v.name}
        </button>
      ))}
      <span data-helper>{helperText}</span>
    </div>
  ),
}))
vi.mock('./Icon', () => ({ Icon: ({ name }: any) => (name ? <i data-icon={name} /> : null) }))
vi.mock('./Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('./Confirm', () => ({
  Confirm: ({ open, title, action, children, disabled, onConfirm, onDeny }: any) =>
    open ? (
      <div data-confirm>
        <span data-confirm-title>{title}</span>
        {children}
        <button data-confirm-ok disabled={disabled} onClick={onConfirm}>
          {action}
        </button>
        <button data-confirm-deny onClick={onDeny} />
      </div>
    ) : null,
}))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return { useTranslation: () => ({ t: (_key: string, a: any, b?: any) => fill(a, b) }) }
})

import { ProductPolicyApps } from './ProductPolicyApps'
import type { ProductApp, ProductAppSetting, ProductSync } from '../services/productPolicy'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const aiCommands = (more: Partial<ProductAppSetting> = {}): ProductAppSetting => ({
  name: 'ai_commands',
  type: 'bool',
  label: 'AI commands',
  help: null,
  default: true,
  value: null,
  at: null,
  by: null,
  forcible: false,
  locked: false,
  deprecated: null,
  choices: null,
  ...more,
})

const consoleApp = (more: Partial<ProductApp> = {}): ProductApp => ({
  id: 'remoteit.console',
  name: 'Console',
  publisher: 'remote.it',
  description: null,
  root: true,
  capabilities: ['person-accounts', 'person-certificates', 'ssh-exec'],
  protocol: 'ssh',
  version: '1.4.0',
  state: null,
  channel: 'stable',
  pinned: null,
  rootConsent: null,
  needsConsent: false,
  locked: false,
  at: null,
  by: null,
  // Its words are its release's, as the API gives them.
  settings: [
    aiCommands({
      label: 'Allow AI commands',
      help: 'AI assistants you authorize may run commands on this device through remote.it’s MCP server.',
    }),
  ],
  ...more,
})

const logs = (more: Partial<ProductApp> = {}): ProductApp => ({
  id: 'acme.logs',
  name: 'Logs',
  publisher: 'Acme',
  description: 'Reads the device’s logs',
  root: false,
  capabilities: [],
  protocol: null,
  version: null,
  state: null,
  channel: null,
  pinned: null,
  rootConsent: null,
  needsConsent: false,
  locked: false,
  at: null,
  by: null,
  settings: [
    aiCommands({
      name: 'level',
      type: 'choice',
      label: 'Level',
      forcible: true,
      choices: [
        { value: 'info', label: 'Info' },
        { value: 'debug', label: 'Debug' },
      ],
    }),
    aiCommands({ name: 'keep', type: 'int', label: 'Keep this many' }),
  ],
  ...more,
})

let root: Root
const onChanged = vi.fn()
async function render(
  apps: ProductApp[],
  { sync = 'synced', manage = true }: { sync?: ProductSync; manage?: boolean } = {}
) {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <ProductPolicyApps productId="P1" accountId="A1" apps={apps} sync={sync} manage={manage} onChanged={onChanged} />
    )
  )
  return container
}
afterEach(() => act(() => root.unmount()))

// The console's catalogue entry: stable gives `current`; each release as it runs and what it declares.
const CONSOLE_ALL = ['person-accounts', 'person-certificates', 'ssh-exec']
const consoleCatalog = (current: string, releases: { version: string; root: boolean; capabilities: string[] }[]) => ({
  id: 'remoteit.console',
  accountChannel: null,
  channels: [{ channel: 'stable', current, candidate: null, share: 0 }],
  releases: releases.map(r => ({ ...r, withdrawn: null })),
})

beforeEach(() => {
  catalog.mockReset().mockResolvedValue('UNSERVED')
  setApp.mockReset().mockResolvedValue(true)
  setAppSetting.mockReset().mockResolvedValue(true)
  onChanged.mockReset()
})

const row = (page: HTMLElement, id: string) => page.querySelector(`[data-product-app="${id}"]`) as HTMLElement
const line = (page: HTMLElement, id: string, name: string) =>
  row(page, id).querySelector(`[data-product-app-${name}]`)?.textContent
const onOf = (page: HTMLElement, id: string) => row(page, id).querySelector(`[data-on="${id}"]`) as HTMLElement
const settingOf = (page: HTMLElement, id: string, name: string) =>
  row(page, id).querySelector(`[data-setting="${name}"]`) as HTMLElement
const pick = (select: HTMLElement, key: string) =>
  act(async () => (select.querySelector(`[data-choice="${key}"]`) as HTMLElement).click())
const click = (el: Element | null) => act(async () => (el as HTMLElement).click())

describe('a product’s Apps block', () => {
  it('a row each catalogue app: its name, publisher, release, and Runs as root where it does', async () => {
    const page = await render([consoleApp(), logs()])
    expect([...page.querySelectorAll('[data-product-app]')].map(r => r.getAttribute('data-product-app'))).toEqual([
      'remoteit.console',
      'acme.logs',
    ])
    expect(line(page, 'remoteit.console', 'about')).toBe('By remote.it · 1.4.0 · Stable')
    expect(line(page, 'remoteit.console', 'root')).toBe('Runs as root: full control of this device')
    expect(row(page, 'remoteit.console').querySelector('[data-icon="terminal"]')).not.toBeNull()
    expect(line(page, 'remoteit.console', 'capabilities')).toBe(
      'Keeps accounts for the people you share with · Signs in people by remote.it certificate · AI commands go through this app'
    )
    expect(row(page, 'acme.logs').querySelector('[data-icon="cube"]')).not.toBeNull()
    expect(line(page, 'acme.logs', 'capabilities')).toBeUndefined()
    expect(line(page, 'acme.logs', 'about')).toBe('By Acme · No release here yet')
    expect(line(page, 'acme.logs', 'description')).toBe('Reads the device’s logs')
    expect(line(page, 'acme.logs', 'root')).toBeUndefined()
    const pinned = await render([consoleApp({ pinned: '1.3.0', version: '1.3.0' })])
    expect(line(pinned, 'remoteit.console', 'about')).toBe('By remote.it · 1.3.0 · Pinned')
  })

  it('nothing for one who does not manage the product: graphql gives them no apps', async () => {
    const page = await render([])
    expect(page.querySelector('[data-product-apps]')).toBeNull()
  })

  it('enabled, disabled, removed or unset (each device’s own); under enforced, unset reads Removed (not listed)', async () => {
    let page = await render([
      consoleApp({ state: 'enabled', rootConsent: { by: 'evan', at: '2026-11-12T18:00:00Z', version: '1.4.0' } }),
      logs({ state: 'disabled' }),
    ])
    expect(onOf(page, 'remoteit.console').getAttribute('data-value')).toBe('enabled')
    expect(onOf(page, 'acme.logs').getAttribute('data-value')).toBe('disabled')
    expect([...onOf(page, 'acme.logs').querySelectorAll('[data-choice]')].map(c => c.textContent)).toEqual([
      'Unset: each device’s own',
      'Enabled',
      'Disabled',
      'Removed',
    ])
    page = await render([logs({ state: 'removed' })])
    expect(onOf(page, 'acme.logs').getAttribute('data-value')).toBe('removed')
    page = await render([logs()], { sync: 'enforced' })
    expect(onOf(page, 'acme.logs').getAttribute('data-value')).toBe('')
    expect(onOf(page, 'acme.logs').querySelector('[data-choice=""]')!.textContent).toBe('Removed (not listed)')
    expect(page.textContent).toContain('One not listed is removed from them, as the product is enforced.')
  })

  it('a restricted app enabled at once, keeping its channel and pin; disabled likewise; removed and unset with neither', async () => {
    const page = await render([logs({ channel: 'beta', pinned: '2.0.0' })])
    await pick(onOf(page, 'acme.logs'), 'enabled')
    expect(setApp).toHaveBeenLastCalledWith('P1', 'acme.logs', 'enabled', { channel: 'beta', version: '2.0.0' })
    await pick(onOf(page, 'acme.logs'), 'disabled')
    expect(setApp).toHaveBeenLastCalledWith('P1', 'acme.logs', 'disabled', { channel: 'beta', version: '2.0.0' })
    await pick(onOf(page, 'acme.logs'), 'removed')
    expect(setApp).toHaveBeenLastCalledWith('P1', 'acme.logs', 'removed', {})
    expect(onChanged).toHaveBeenCalledTimes(3)
    const set = await render([logs({ state: 'enabled' })])
    await pick(onOf(set, 'acme.logs'), '')
    expect(setApp).toHaveBeenLastCalledWith('P1', 'acme.logs', null, {})
  })

  it('a root app with no consent: asked in words naming it, its publisher, full control and every device in the product, now and later', async () => {
    catalog.mockResolvedValue(consoleCatalog('1.4.0', [{ version: '1.4.0', root: true, capabilities: CONSOLE_ALL }]))
    const page = await render([consoleApp()])
    await pick(onOf(page, 'remoteit.console'), 'enabled')
    expect(setApp).not.toHaveBeenCalled()
    const confirm = page.querySelector('[data-confirm]')!
    expect(confirm.querySelector('[data-confirm-title]')!.textContent).toBe(
      'Run Console as root on this product’s devices?'
    )
    const body = confirm.querySelector('[data-root-consent]')!.textContent
    expect(body).toContain('Console, published by remote.it')
    expect(body).toContain('full control of this device')
    expect(body).toContain('every device in this product, now and later')
    expect(confirm.textContent).toContain('Turn it on only if you trust remote.it with every device in this product.')
    // What else it asks of remote.it is part of the consent.
    expect([...confirm.querySelectorAll('[data-app-capability]')].map(c => c.textContent)).toEqual([
      '· Keeps accounts for the people you share with',
      '· Signs in people by remote.it certificate',
      '· AI commands go through this app',
    ])
    await click(confirm.querySelector('[data-confirm-ok]'))
    expect(setApp).toHaveBeenCalledWith('P1', 'remoteit.console', 'enabled', {
      channel: 'stable',
      version: null,
      consentRoot: true,
    })
    expect(page.querySelector('[data-confirm]')).toBeNull()
  })

  it('where the catalogue cannot say what the release asks: said, and the yes not taken', async () => {
    const page = await render([consoleApp()])
    await pick(onOf(page, 'remoteit.console'), 'enabled')
    const confirm = page.querySelector('[data-confirm]')!
    expect(confirm.querySelector('[data-root-consent-unknown]')).not.toBeNull()
    expect((confirm.querySelector('[data-confirm-ok]') as HTMLButtonElement).disabled).toBe(true)
  })

  it('a root app not turned on when the person says no', async () => {
    const page = await render([consoleApp()])
    await pick(onOf(page, 'remoteit.console'), 'enabled')
    await click(page.querySelector('[data-confirm-deny]'))
    expect(setApp).not.toHaveBeenCalled()
    expect(page.querySelector('[data-confirm]')).toBeNull()
  })

  it('a consent kept that covers the release it names: shown with who and when, and the app turned on without asking again', async () => {
    catalog.mockResolvedValue(consoleCatalog('1.4.0', [{ version: '1.4.0', root: true, capabilities: CONSOLE_ALL }]))
    const page = await render([
      consoleApp({ state: 'disabled', rootConsent: { by: 'evan@example.com', at: '2026-11-12T18:00:00Z', version: '1.4.0' } }),
    ])
    expect(line(page, 'remoteit.console', 'consent')).toMatch(/^Consented to run as root by evan@example.com, .*2026/)
    await pick(onOf(page, 'remoteit.console'), 'enabled')
    expect(catalog).toHaveBeenCalledWith('remoteit.console', { accountId: 'A1', releases: 100 })
    expect(page.querySelector('[data-confirm]')).toBeNull()
    expect(setApp).toHaveBeenCalledWith('P1', 'remoteit.console', 'enabled', { channel: 'stable', version: null })
  })

  it('a consent kept that the release it names asks more than: asked again, for that release', async () => {
    // 1.5.0 newly declares ssh-exec: the consent to 1.4.0 does not cover it (graphql's coversRootAmong).
    catalog.mockResolvedValue(
      consoleCatalog('1.5.0', [
        { version: '1.5.0', root: true, capabilities: CONSOLE_ALL },
        { version: '1.4.0', root: true, capabilities: ['person-accounts', 'person-certificates'] },
      ])
    )
    const page = await render([
      consoleApp({ state: 'disabled', rootConsent: { by: 'evan@example.com', at: '2026-11-12T18:00:00Z', version: '1.4.0' } }),
    ])
    await pick(onOf(page, 'remoteit.console'), 'enabled')
    expect(setApp).not.toHaveBeenCalled()
    const confirm = page.querySelector('[data-confirm]')!
    expect(confirm.querySelector('[data-confirm-title]')!.textContent).toBe('Run Console as root on this product’s devices?')
    expect([...confirm.querySelectorAll('[data-app-capability]')].map(c => c.getAttribute('data-app-capability'))).toEqual(CONSOLE_ALL)
    await click(confirm.querySelector('[data-confirm-ok]'))
    expect(setApp).toHaveBeenCalledWith('P1', 'remoteit.console', 'enabled', { channel: 'stable', version: null, consentRoot: true })
  })

  it('a restricted app that declares capabilities asks as a root one does, in words for what it asks', async () => {
    const page = await render([logs({ capabilities: ['person-certificates'] })])
    await pick(onOf(page, 'acme.logs'), 'enabled')
    expect(setApp).not.toHaveBeenCalled()
    const confirm = page.querySelector('[data-confirm]')!
    expect(confirm.querySelector('[data-confirm-title]')!.textContent).toBe('Allow Logs what it asks on this product’s devices?')
    expect(confirm.querySelector('[data-root-consent]')!.textContent).toBe(
      'Logs, published by Acme, runs restricted, with an account of its own on every device in this product, now and later.'
    )
    expect(confirm.textContent).toContain('It asks of remote.it:')
    expect([...confirm.querySelectorAll('[data-app-capability]')].map(c => c.textContent)).toEqual([
      '· Signs in people by remote.it certificate',
    ])
    expect(confirm.querySelector('[data-confirm-ok]')!.textContent).toBe('Allow and turn on')
    await click(confirm.querySelector('[data-confirm-ok]'))
    expect(setApp).toHaveBeenCalledWith('P1', 'acme.logs', 'enabled', { channel: null, version: null, consentRoot: true })
  })

  it('a new release that needs root: said, and consented to from its row', async () => {
    catalog.mockResolvedValue(consoleCatalog('1.4.0', [{ version: '1.4.0', root: true, capabilities: CONSOLE_ALL }]))
    const page = await render([
      consoleApp({
        state: 'enabled',
        needsConsent: true,
        rootConsent: { by: 'evan@example.com', at: '2026-11-01T18:00:00Z', version: '1.3.0' },
      }),
    ])
    expect(line(page, 'remoteit.console', 'needs-consent')).toBe(
      'A new version needs your consent: its devices are not turned on until you consent'
    )
    expect(line(page, 'remoteit.console', 'consent')).toBeUndefined()
    await click(row(page, 'remoteit.console').querySelector('[data-product-app-consent-action]'))
    const confirm = page.querySelector('[data-confirm]')!
    expect(confirm.querySelector('[data-confirm-ok]')!.textContent).toBe('Consent to full control')
    await click(confirm.querySelector('[data-confirm-ok]'))
    expect(setApp).toHaveBeenCalledWith('P1', 'remoteit.console', 'enabled', {
      channel: 'stable',
      version: null,
      consentRoot: true,
    })
  })

  it('locked on its devices, with the product’s level', async () => {
    let page = await render([consoleApp({ state: 'disabled', locked: true })])
    expect(line(page, 'remoteit.console', 'locked')).toBe('Locked on its devices (synced)')
    page = await render([consoleApp({ state: 'disabled', locked: true })], { sync: 'enforced' })
    expect(line(page, 'remoteit.console', 'locked')).toBe('Locked on its devices (enforced)')
    page = await render([consoleApp({ state: 'disabled' })], { sync: 'template' })
    expect(line(page, 'remoteit.console', 'locked')).toBeUndefined()
  })

  it('its settings inside its row, labelled by what they allow, each with an unset choice', async () => {
    const page = await render([consoleApp(), logs({ settings: [...logs().settings.slice(0, 1)] })])
    const options = row(page, 'remoteit.console').querySelector('[data-product-app-options]')!
    expect([...options.querySelectorAll('[data-select]')].map(s => s.getAttribute('data-select'))).toEqual([
      'On its devices',
      'Allow AI commands',
    ])
    const ai = settingOf(page, 'remoteit.console', 'ai_commands')
    expect([...ai.querySelectorAll('[data-choice]')].map(c => c.textContent)).toEqual([
      'Each device’s own',
      'On',
      'Off',
    ])
    expect(ai.querySelector('[data-helper]')!.textContent).toContain('MCP server')
    await pick(ai, 'off')
    expect(setAppSetting).toHaveBeenLastCalledWith('P1', 'remoteit.console', 'ai_commands', false)
    const level = settingOf(page, 'acme.logs', 'level')
    expect([...level.querySelectorAll('[data-choice]')].map(c => c.textContent)).toEqual([
      'Each device’s own',
      'Info',
      'Debug',
    ])
    await pick(level, 'debug')
    expect(setAppSetting).toHaveBeenLastCalledWith('P1', 'acme.logs', 'level', 'debug')
    expect(onChanged).toHaveBeenCalledTimes(2)
  })

  it('a setting set: unset with null; locked, or given but not locked where it can’t be forced', async () => {
    const page = await render([
      consoleApp({ settings: [aiCommands({ value: true })] }),
      logs({
        settings: [
          aiCommands({
            name: 'level',
            type: 'choice',
            value: 'debug',
            locked: true,
            choices: [{ value: 'debug', label: 'Debug' }],
          }),
        ],
      }),
    ])
    const ai = settingOf(page, 'remoteit.console', 'ai_commands')
    expect(ai.getAttribute('data-value')).toBe('on')
    expect(ai.querySelector('[data-helper]')!.textContent).toContain(
      'Given to its devices, not locked: this setting can’t be forced on'
    )
    expect(settingOf(page, 'acme.logs', 'level').querySelector('[data-helper]')!.textContent).toBe(
      'Locked on its devices (synced)'
    )
    await pick(ai, '')
    expect(setAppSetting).toHaveBeenLastCalledWith('P1', 'remoteit.console', 'ai_commands', null)
    const template = await render([consoleApp({ settings: [aiCommands({ value: true })] })], { sync: 'template' })
    expect(
      settingOf(template, 'remoteit.console', 'ai_commands').querySelector('[data-helper]')!.textContent
    ).not.toContain('not locked')
  })

  it('an int typed and set when the field is left, cleared to unset', async () => {
    const page = await render([
      logs({ settings: [aiCommands({ name: 'keep', type: 'int', label: 'Keep this many', value: 7 })] }),
    ])
    const input = row(page, 'acme.logs').querySelector('[data-product-app-setting="keep"] input') as HTMLInputElement
    expect(input.value).toBe('7')
    const type = async (text: string) => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      await act(async () => {
        set.call(input, text)
        input.dispatchEvent(new Event('input', { bubbles: true }))
      })
      await act(async () => {
        input.focus()
        input.blur()
      })
    }
    await type('14')
    expect(setAppSetting).toHaveBeenLastCalledWith('P1', 'acme.logs', 'keep', 14)
    await type('')
    expect(setAppSetting).toHaveBeenLastCalledWith('P1', 'acme.logs', 'keep', null)
  })

  it('a deprecated setting only where the product set it', async () => {
    const page = await render([
      logs({
        settings: [
          aiCommands({ name: 'old', deprecated: 'use level' }),
          aiCommands({ name: 'older', deprecated: 'use level', value: true }),
        ],
      }),
    ])
    expect(settingOf(page, 'acme.logs', 'old')).toBeNull()
    expect(settingOf(page, 'acme.logs', 'older').querySelector('[data-helper]')!.textContent).toContain(
      'Deprecated: use level'
    )
  })

  it('read-only for one who may not manage the product', async () => {
    const page = await render([consoleApp({ needsConsent: true, state: 'enabled' })], { manage: false })
    expect(onOf(page, 'remoteit.console').getAttribute('data-disabled')).toBe('true')
    expect(settingOf(page, 'remoteit.console', 'ai_commands').getAttribute('data-disabled')).toBe('true')
    expect(row(page, 'remoteit.console').querySelector('[data-product-app-consent-action]')).toBeNull()
  })

  it('a refusal in graphql’s words', async () => {
    setApp.mockResolvedValue({ reason: 'Turning on an app needs Scripting in the product’s account' })
    const page = await render([logs()])
    await pick(onOf(page, 'acme.logs'), 'enabled')
    expect(page.querySelector('[data-notice]')!.textContent).toBe(
      'Turning on an app needs Scripting in the product’s account'
    )
    setApp.mockResolvedValue('ERROR')
    await pick(onOf(page, 'acme.logs'), 'disabled')
    expect(page.querySelector('[data-notice]')!.textContent).toBe('The app was not changed.')
  })
})

describe('root, and a release that newly asks for it', () => {
  it('who consented by their email, and that it covers every device in the product, now and later', async () => {
    const page = await render([
      consoleApp({
        state: 'enabled',
        rootConsent: { by: 'AAAA', email: 'pat@example.com', at: '2026-11-12T18:00:00Z', version: '1.4.0' },
      }),
    ])
    expect(line(page, 'remoteit.console', 'consent')).toMatch(
      /^Consented to run as root by pat@example.com, .*: for every device in this product, now and later$/
    )
  })

  it('its devices stay on the release they run until someone consents; the dialog says which release, for every device', async () => {
    // What they are given (1.4.0) runs restricted — graphql's root is the release given — beside the root one waiting,
    // which the dialog reads from the catalogue under the product's account.
    catalog.mockResolvedValue(
      consoleCatalog('1.5.0', [
        { version: '1.5.0', root: true, capabilities: CONSOLE_ALL },
        { version: '1.4.0', root: false, capabilities: [] },
      ])
    )
    const page = await render([
      consoleApp({ state: 'enabled', root: false, version: '1.4.0', needsConsent: true, awaitingRoot: '1.5.0', rootConsent: null }),
    ])
    expect(line(page, 'remoteit.console', 'root')).toBeUndefined()
    expect(line(page, 'remoteit.console', 'about')).toBe('By remote.it · 1.4.0 · Stable')
    expect(line(page, 'remoteit.console', 'needs-consent')).toBe(
      'A new version (1.5.0) needs your consent: its devices stay on 1.4.0 until you consent'
    )
    await click(row(page, 'remoteit.console').querySelector('[data-product-app-consent-action]'))
    const confirm = page.querySelector('[data-confirm]')!
    expect(confirm.querySelector('[data-root-consent-update]')?.textContent).toBe(
      'Console 1.5.0 needs to run as root. Its devices stay on the version they run until you consent.'
    )
    expect(catalog).toHaveBeenCalledWith('remoteit.console', { accountId: 'A1', releases: 100 })
    expect(confirm.textContent).toContain('on every device in this product, now and later')
    await click(confirm.querySelector('[data-confirm-ok]'))
    expect(setApp).toHaveBeenCalledWith('P1', 'remoteit.console', 'enabled', {
      channel: 'stable',
      version: null,
      consentRoot: true,
    })
  })
})

describe('a removed setting the product still sets', () => {
  const removed = { name: 'colour', value: true, at: '2026-11-12T18:00:00Z', by: 'AAAA', removedIn: '1.5.0' }

  it('listed as Removed in <version>, with no effect, and cleared with null', async () => {
    const page = await render([
      consoleApp({ state: 'enabled', removedSettings: [removed, { ...removed, name: 'quiet', removedIn: null }] }),
    ])
    const item = row(page, 'remoteit.console').querySelector('[data-product-app-removed="colour"]')!
    expect(item.textContent).toContain('colour: true')
    expect(item.textContent).toContain('Removed in 1.5.0: no effect on devices that run it')
    expect(row(page, 'remoteit.console').querySelector('[data-product-app-removed="quiet"]')?.textContent).toContain(
      'Removed: no effect on its devices'
    )
    await click(item.querySelector('[data-product-app-removed-clear="colour"]'))
    expect(setAppSetting).toHaveBeenCalledWith('P1', 'remoteit.console', 'colour', null)
  })

  it('not cleared by one who may not manage the product', async () => {
    const page = await render([consoleApp({ removedSettings: [removed] })], { manage: false })
    expect(
      (row(page, 'remoteit.console').querySelector('[data-product-app-removed-clear="colour"]') as HTMLButtonElement)
        .disabled
    ).toBe(true)
  })
})
