import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../services/post', () => ({ post: vi.fn() }))
vi.mock('../services/graphQL', () => ({ graphQLBasicRequest: vi.fn(), graphQLGetErrors: vi.fn() }))
vi.mock('../hooks/useDeviceSettings', () => ({ useDeviceSettings: () => ({ setting: vi.fn() }) }))
vi.mock('./ListItemSetting', () => ({
  ListItemSetting: ({ label, subLabel, toggle, disabled, onClick }: any) => (
    <button data-row data-on={String(toggle)} disabled={disabled} onClick={onClick}>
      {label}
      {subLabel ? ` — ${subLabel}` : ''}
    </button>
  ),
}))
vi.mock('./SelectSetting', () => ({
  SelectSetting: ({ value, values, disabled, helperText, onChange }: any) => (
    <div data-select data-value={value} data-disabled={String(!!disabled)}>
      {values.map((v: any) => (
        <button key={v.key} data-choice={v.key} disabled={disabled} onClick={() => onChange(v.key)} />
      ))}
      {helperText}
    </div>
  ),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, text: string, values?: any) => text.replace(/{{(\w+)}}/g, (_, k) => values?.[k] ?? ''),
  }),
}))

import { DeviceAppSetting } from './DeviceAppSetting'
import type { DeviceAppSetting as Setting } from '../services/graphQLDeviceApps'
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// The console's "Allow AI commands" (forcible: its administrator may hold it on as well as off).
const aiCommands = (control: string, more: Partial<Setting> = {}): Setting => ({
  name: 'ai_commands',
  type: 'bool',
  label: 'Allow AI commands',
  help: 'Commands an AI runs on this device through MCP, as the people you allow',
  default: true,
  value: true,
  at: null,
  by: null,
  onDevice: false,
  control: control as any,
  locked: null,
  choices: null,
  deprecated: null,
  ...more,
})

async function render(setting: Setting, onChange = vi.fn()) {
  const container = document.createElement('div')
  await act(async () =>
    createRoot(container).render(
      <DeviceAppSetting setting={setting} label={setting.label} help={setting.help} onChange={onChange} />
    )
  )
  return container
}
const row = (page: HTMLElement) => page.querySelector('[data-row]') as HTMLButtonElement

describe('an app setting its device’s administrator holds', () => {
  it('ai_commands held off: off, greyed, "Set by this device’s administrator" — no change offered', async () => {
    const onChange = vi.fn()
    const page = await render(aiCommands('off', { value: false }), onChange)
    expect(row(page).dataset.on).toBe('false')
    expect(row(page).disabled).toBe(true)
    expect(row(page).textContent).toBe('Allow AI commands — Set by this device’s administrator')
    await act(async () => row(page).click())
    expect(onChange).not.toHaveBeenCalled()
  })

  it('ai_commands held on: on, greyed, said the same', async () => {
    const page = await render(aiCommands('on', { value: true }))
    expect(row(page).dataset.on).toBe('true')
    expect(row(page).disabled).toBe(true)
    expect(row(page).textContent).toBe('Allow AI commands — Set by this device’s administrator')
  })

  it('held by its administrator and its product: both said', async () => {
    const page = await render(
      aiCommands('off', { value: false, locked: { product: 'Kiosks', level: 'enforced' } as any })
    )
    expect(row(page).textContent).toBe(
      'Allow AI commands — Set by this device’s administrator · Managed by product Kiosks (enforced)'
    )
  })

  it('not held: switched here, its help said; local is set on the device only; its product’s lock alone as before', async () => {
    for (const control of ['cloud+local', 'cloud']) {
      const onChange = vi.fn()
      const page = await render(aiCommands(control), onChange)
      expect(row(page).disabled).toBe(false)
      expect(row(page).textContent).toBe(
        'Allow AI commands — Commands an AI runs on this device through MCP, as the people you allow'
      )
      await act(async () => row(page).click())
      expect(onChange).toHaveBeenCalledWith(false)
    }
    const local = await render(aiCommands('local'))
    expect(row(local).disabled).toBe(true)
    expect(row(local).textContent).toBe('Allow AI commands — Set only on the device')
    const product = await render(aiCommands('cloud+local', { locked: { product: 'Kiosks', level: 'synced' } as any }))
    expect(row(product).disabled).toBe(true)
    expect(row(product).textContent).toBe('Allow AI commands — Set by its product Kiosks')
  })

  it('a choice it fixes: that choice, greyed, said the same', async () => {
    const mode: Setting = {
      ...aiCommands('nightly'),
      name: 'mode',
      type: 'choice',
      label: 'Back up',
      help: null,
      value: 'nightly',
      default: 'hourly',
      choices: [
        { value: 'hourly', label: 'Every hour' },
        { value: 'nightly', label: 'Every night' },
      ],
    }
    const page = await render(mode)
    const select = page.querySelector('[data-select]') as HTMLElement
    expect(select.dataset.value).toBe('nightly')
    expect(select.dataset.disabled).toBe('true')
    expect(select.textContent).toBe('Set by this device’s administrator')
    const free = await render({ ...mode, control: 'cloud+local' as any })
    expect((free.querySelector('[data-select]') as HTMLElement).dataset.disabled).toBe('false')
  })
})
