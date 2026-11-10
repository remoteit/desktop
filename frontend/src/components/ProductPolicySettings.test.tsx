import React, { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { setSetting } = vi.hoisted(() => ({ setSetting: vi.fn() }))
vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLGetErrors: vi.fn(), graphQLRequestWithReason: vi.fn() }))
vi.mock('../services/productPolicy', async importOriginal => ({
  ...(await importOriginal<typeof import('../services/productPolicy')>()),
  graphQLSetDeviceProductSetting: setSetting,
}))
vi.mock('./SelectSetting', () => ({
  SelectSetting: ({ label, value, values, disabled, onChange }: any) => (
    <div data-select={label} data-value={value} data-disabled={String(!!disabled)}>
      {values.map((v: any) => (
        <button key={v.key} data-choice={v.key} onClick={() => onChange(v.key)}>
          {v.name}
        </button>
      ))}
    </div>
  ),
}))
vi.mock('./ListItemSetting', () => ({
  ListItemSetting: ({ label, subLabel, button, onButtonClick }: any) => (
    <div data-other={label}>
      {label} — {subLabel}
      {button && (
        <button data-unset onClick={onButtonClick}>
          {button}
        </button>
      )}
    </div>
  ),
}))
vi.mock('./Notice', () => ({ Notice: ({ children }: any) => <div data-notice>{children}</div> }))
vi.mock('react-i18next', () => {
  const fill = (text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? '')
  return { useTranslation: () => ({ t: (_key: string, a: any, b?: any) => fill(a, b) }) }
})

import { ProductPolicySettings } from './ProductPolicySettings'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

let root: Root
const onChanged = vi.fn()
async function render(settings: { name: string; value: any }[], manage = true) {
  document.body.innerHTML = ''
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(<ProductPolicySettings productId="P1" settings={settings} manage={manage} onChanged={onChanged} />)
  )
  return container
}
const row = (page: HTMLElement, label: string) => page.querySelector(`[data-select="${label}"]`) as HTMLElement
const pick = async (page: HTMLElement, label: string, key: string) =>
  act(async () => (row(page, label).querySelector(`[data-choice="${key}"]`) as HTMLElement).click())

beforeEach(() => {
  setSetting.mockReset().mockResolvedValue(true)
  onChanged.mockReset()
})
afterEach(() => act(() => root.unmount()))

describe('the settings a product sets', () => {
  it('each offered setting: its value where the product sets it, else each device’s own', async () => {
    const page = await render([
      { name: 'subnet', value: true },
      { name: 'websocket', value: 'off' },
      { name: 'services', value: false },
    ])
    expect(row(page, 'Device subnet').dataset.value).toBe('on')
    expect(row(page, 'Allow remote access to services').dataset.value).toBe('off')
    expect(row(page, 'Reflector (websocket)').dataset.value).toBe('off')
    expect(row(page, 'Console').dataset.value).toBe('')
    expect(row(page, 'Console').textContent).toBe('Each device’s ownOnOff')
    expect(row(page, 'Reflector (websocket)').textContent).toBe('Each device’s ownAutomaticAlwaysOff')
  })

  it('set to a value, or unset; the product read again', async () => {
    const page = await render([{ name: 'subnet', value: true }])
    await pick(page, 'Console', 'on')
    expect(setSetting).toHaveBeenLastCalledWith('P1', 'console', true)
    await pick(page, 'Reflector (websocket)', 'auto')
    expect(setSetting).toHaveBeenLastCalledWith('P1', 'websocket', 'auto')
    await pick(page, 'Device subnet', '')
    expect(setSetting).toHaveBeenLastCalledWith('P1', 'subnet', null)
    expect(onChanged).toHaveBeenCalledTimes(3)
    await pick(page, 'Device subnet', 'on')
    expect(setSetting).toHaveBeenCalledTimes(3)
  })

  it('one it sets that is not offered here: shown as it is, and may be unset; never the exit nor Protect', async () => {
    const page = await render([
      { name: 'any_port', value: { tcp: '502', udp: '' } },
      { name: 'exit', value: { via: 'xoffice' } },
      { name: 'protect', value: true },
    ])
    // The exit and Protect are never a product's to set: not offered, nor shown.
    expect(page.textContent).not.toMatch(/protect/i)
    expect(page.querySelector('[data-other="any_port"]')?.textContent).toBe('any_port — {"tcp":"502","udp":""}Unset')
    expect(page.querySelector('[data-other="exit"]')).toBeNull()
    await act(async () => (page.querySelector('[data-unset]') as HTMLElement).click())
    expect(setSetting).toHaveBeenCalledWith('P1', 'any_port', null)
  })

  it('a refusal in graphql’s words, or that it was not changed', async () => {
    setSetting.mockResolvedValue({ reason: 'Subnet needs a newer daemon on 3 devices' })
    const page = await render([])
    await pick(page, 'Device subnet', 'on')
    expect(page.querySelector('[data-notice]')?.textContent).toBe('Subnet needs a newer daemon on 3 devices')
    setSetting.mockResolvedValue('ERROR')
    await pick(page, 'Device subnet', 'off')
    expect(page.querySelector('[data-notice]')?.textContent).toBe('The setting was not changed.')
  })

  it('only its managers may change them', async () => {
    const page = await render([{ name: 'any_port', value: null }], false)
    expect(row(page, 'Device subnet').dataset.disabled).toBe('true')
    expect(page.querySelector('[data-unset]')).toBeNull()
  })
})
