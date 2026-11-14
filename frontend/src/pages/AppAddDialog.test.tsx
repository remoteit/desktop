import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { catalog, targets, addMany, setProductApp, count, push, state, dispatch } = vi.hoisted(() => ({
  catalog: vi.fn(),
  targets: vi.fn(),
  addMany: vi.fn(),
  setProductApp: vi.fn(),
  count: vi.fn(),
  push: vi.fn(),
  dispatch: { tags: { fetchIfEmpty: vi.fn() }, products: { fetchIfEmpty: vi.fn() } },
  state: {
    value: {
      user: { id: 'U1' },
      active: 'U1',
      tags: [{ name: 'office' }, { name: 'lab' }],
      products: [{ id: 'P1', name: 'Kiosks' }],
    },
  },
}))
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push }), useParams: () => ({ appID: 'acme.backup' }) }))
vi.mock('react-redux', () => ({ useSelector: (select: any) => select(state.value), useDispatch: () => dispatch }))
vi.mock('../store', () => ({}))
vi.mock('../selectors/accounts', () => ({ selectActiveAccountId: (s: any) => s.active }))
vi.mock('../selectors/tags', () => ({ selectTags: (s: any) => s.tags }))
vi.mock('../models/products', () => ({ getProductModel: (s: any) => ({ all: s.products }) }))
vi.mock('../services/graphQLAppCatalog', () => ({ graphQLCatalogApp: catalog, graphQLAppTargets: targets }))
vi.mock('../services/graphQLDeviceApps', async () => ({
  ...(await import('../services/deviceAppsShared')),
  MANY_DEVICES_MAX: 500,
  graphQLAddDeviceApps: addMany,
}))
vi.mock('../services/productPolicy', () => ({ graphQLSetDeviceProductApp: setProductApp }))
vi.mock('../services/graphQLDevice', () => ({ graphQLFetchDeviceCount: count }))
vi.mock('../components/Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('../components/LoadingMessage', () => ({ LoadingMessage: () => <div data-loading /> }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return {
    useTranslation: () => ({
      t: (_key: string, a: any, b?: any) =>
        typeof a === 'string' ? fill(a, b) : fill(a.count === 1 ? a.defaultValue_one : a.defaultValue_other, a),
    }),
  }
})

import { AppAddDialog } from './AppAddDialog'
import { mockCatalogApp } from '../services/__fixtures__/appCatalogMock'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

const target = (id: string, name: string, more: any = {}) => ({
  id,
  name,
  canRun: true,
  has: null,
  offer: { refused: null, version: '1.4.0', needsNewer: false },
  ...more,
})

const TARGETS = [
  target('D1', 'pi-kitchen'),
  target('D2', 'nas'),
  target('D3', 'gw-3', { offer: null }),
  target('D4', 'kiosk-4', { has: 'enabled' }),
  target('D5', 'old-pi', { has: 'disabled' }),
  target('D6', 'viewer', { canRun: false }),
  target('D7', 'locked', { offer: { refused: 'Not allowed on this device by its administrator', version: '1.4.0', needsNewer: false } }),
  target('D8', 'ancient', { offer: { refused: null, version: '1.4.0', needsNewer: true } }),
]

let root: Root
let container: HTMLElement
async function render() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<AppAddDialog />))
  await act(async () => {})
}
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})
beforeEach(() => {
  push.mockReset()
  catalog.mockReset().mockResolvedValue(mockCatalogApp('acme.backup'))
  targets.mockReset().mockResolvedValue(TARGETS)
  addMany.mockReset().mockResolvedValue([
    { deviceId: 'D1', name: 'pi-kitchen', outcome: 'added', error: null },
    { deviceId: 'D5', name: 'old-pi', outcome: 'enabled', error: null },
    { deviceId: 'D2', name: 'nas', outcome: 'refused', error: 'No build for linux-mips' },
  ])
  setProductApp.mockReset().mockResolvedValue(true)
  count.mockReset().mockResolvedValue({ data: { data: { login: { account: { devices: { total: 7 } } } } } })
})

const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement
const click = (el: Element | null) => act(async () => (el as HTMLElement).click())
const select = (el: Element | null, value: string | string[]) =>
  act(async () => {
    const node = el as HTMLSelectElement
    if (Array.isArray(value)) [...node.options].forEach(o => (o.selected = value.includes(o.value)))
    else node.value = value
    node.dispatchEvent(new Event('change', { bubbles: true }))
  })
const row = (id: string) => $(`[data-app-add-device="${id}"]`)
const tick = (id: string) => click($(`[data-app-add-tick="${id}"]`))
const submit = () => $('[data-app-add-submit]') as HTMLButtonElement

describe('Add, to devices', () => {
  it('the person’s devices, one that cannot take it unticked with why; a remote.it too old, or disabled there, said', async () => {
    await render()
    expect($('[data-app-add-dialog]').textContent).toContain('Add Backup')
    expect(targets).toHaveBeenCalledWith('acme.backup', { accountId: undefined, name: '' })
    const disabled = (id: string) => ($(`[data-app-add-tick="${id}"]`) as HTMLInputElement).disabled
    expect(disabled('D1')).toBe(false)
    expect(row('D3').textContent).toContain('Not offered to this device: no build for its platform')
    expect(disabled('D3')).toBe(true)
    expect(row('D4').textContent).toContain('Already there')
    expect(disabled('D4')).toBe(true)
    expect(row('D5').textContent).toContain('Disabled there: adding enables it')
    expect(disabled('D5')).toBe(false)
    expect(row('D6').textContent).toContain('Needs Manage and Scripting on it')
    expect(disabled('D6')).toBe(true)
    expect(row('D7').textContent).toContain('Not allowed on this device by its administrator')
    expect(row('D8').textContent).toContain('Needs a newer remote.it: it runs once remote.it is upgraded')
    expect(disabled('D8')).toBe(false)
  })

  it('bulk add: addDeviceApps with the devices ticked, then each device’s result', async () => {
    await render()
    expect(submit().disabled).toBe(true)
    await tick('D1')
    await tick('D2')
    await tick('D5')
    expect(submit().textContent).toBe('Add to 3 devices')
    await click(submit())
    expect(addMany).toHaveBeenCalledWith('acme.backup', { deviceIds: ['D1', 'D2', 'D5'], accountId: undefined })
    const results = $('[data-app-results]')
    expect(results.textContent).toContain('pi-kitchenAdded')
    expect(results.textContent).toContain('old-piEnabled')
    expect(results.textContent).toContain('nasRefused: No build for linux-mips')
    expect($('[data-app-add-close]').textContent).toBe('Done')
    await click($('[data-app-add-close]'))
    expect(push).toHaveBeenCalledWith('/apps/acme.backup')
  })

  it('the channel and a pinned version go with it', async () => {
    await render()
    await tick('D1')
    await select($('[data-app-add-channel]'), 'beta')
    await click($('[data-app-add-pin]'))
    await select($('[data-app-add-version]'), '1.4.0')
    await click(submit())
    expect(addMany).toHaveBeenCalledWith('acme.backup', {
      deviceIds: ['D1'],
      accountId: undefined,
      channel: 'beta',
      version: '1.4.0',
    })
  })

  it('a call refused whole: its words, nothing listed', async () => {
    addMany.mockResolvedValue({ reason: 'More than 500 devices: add it to a product' })
    await render()
    await tick('D1')
    await click(submit())
    expect($('[data-notice]').textContent).toBe('More than 500 devices: add it to a product')
    expect($('[data-app-results]')).toBeNull()
  })
})

describe('the root consent', () => {
  it('a root app: Add only once the yes is ticked, in words, and consentRoot passed', async () => {
    catalog.mockResolvedValue({ ...mockCatalogApp('acme.backup'), root: true })
    await render()
    await tick('D1')
    expect($('[data-app-add-root]').textContent).toContain('Backup runs as root: full control of each device.')
    expect($('[data-app-add-root]').textContent).toContain('I allow Acme’s Backup full control of these devices')
    expect(submit().disabled).toBe(true)
    await click($('[data-app-add-consent]'))
    expect(submit().disabled).toBe(false)
    await click(submit())
    expect(addMany).toHaveBeenCalledWith('acme.backup', { deviceIds: ['D1'], accountId: undefined, consentRoot: true })
  })

  it('a restricted app whose pinned release runs as root asks too', async () => {
    const app = mockCatalogApp('acme.backup')!
    catalog.mockResolvedValue({ ...app, releases: [{ ...app.releases[0], root: true }, app.releases[1]] })
    await render()
    expect($('[data-app-add-root]')).toBeNull()
    await click($('[data-app-add-pin]'))
    await select($('[data-app-add-version]'), '1.5.0-beta.2')
    expect($('[data-app-add-root]')).not.toBeNull()
  })
})

describe('Add, to a tag or a product', () => {
  it('a tag: any or all of them, how many devices now, addDeviceApps with the tags', async () => {
    await render()
    await click($('[data-app-add-to="tag"] input'))
    await select($('[data-app-add-tag-select]'), ['office'])
    expect(count).toHaveBeenLastCalledWith(expect.objectContaining({ tag: { operator: 'ANY', values: ['office'] }, accountId: 'U1' }))
    expect($('[data-app-add-tag-count]').textContent).toBe('7 devices now')
    await select($('[data-app-add-operator]'), 'ALL')
    expect(submit().textContent).toBe('Add to 7 devices')
    await click(submit())
    expect(addMany).toHaveBeenCalledWith('acme.backup', { tags: { operator: 'ALL', values: ['office'] }, accountId: undefined })
  })

  it('a tag over 500 devices: refused before the call, pointing to a product', async () => {
    count.mockResolvedValue({ data: { data: { login: { account: { devices: { total: 501 } } } } } })
    await render()
    await click($('[data-app-add-to="tag"] input'))
    await select($('[data-app-add-tag-select]'), ['office'])
    expect($('[data-app-add-too-many]').textContent).toBe('More than 500 devices: add it to a product.')
    expect(submit().disabled).toBe(true)
  })

  it('a product: set Enabled on it (state enabled), its consent worded for every device in it, now and later', async () => {
    catalog.mockResolvedValue({ ...mockCatalogApp('acme.backup'), root: true })
    await render()
    await click($('[data-app-add-to="product"] input'))
    await select($('[data-app-add-product-select]'), 'P1')
    expect(submit().textContent).toBe('Set Enabled on Kiosks')
    expect($('[data-app-add-root]').textContent).toContain('full control of every device in this product, now and later')
    await click($('[data-app-add-consent]'))
    await click(submit())
    expect(setProductApp).toHaveBeenCalledWith('P1', 'acme.backup', 'enabled', { consentRoot: true })
    expect($('[data-app-add-product-done]').textContent).toBe('Kiosks sets Backup enabled on its devices, now and later.')
  })

  it('a product refusing: graphql’s words', async () => {
    setProductApp.mockResolvedValue({ reason: 'Enabling an app needs Scripting in the product’s account' })
    await render()
    await click($('[data-app-add-to="product"] input'))
    await select($('[data-app-add-product-select]'), 'P1')
    await click(submit())
    expect($('[data-notice]').textContent).toBe('Enabling an app needs Scripting in the product’s account')
  })
})
